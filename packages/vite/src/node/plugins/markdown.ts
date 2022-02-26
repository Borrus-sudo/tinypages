import compileMarkdown from "@tinypages/compiler";
import crypto from "crypto";
import { promises as fs } from "fs";
import { normalize } from "path";
import type { Plugin } from "vite";
import type { Meta } from "../../types";
import { useContext } from "../createContext";
import { appendPrelude } from "../utils";
import { hashIt, reload, generateVirtualEntryPoint } from "./pluginUtils";

export default function (): Plugin {
  const { config, page, utils } = useContext();
  let md5;
  const cache: Map<string, [string, Meta]> = new Map();
  const compile = async (input: string): Promise<[string, Meta]> => {
    md5 = crypto.createHash("md5");
    md5.update(input);
    const hash = md5.digest("hex");
    if (cache.has(hash)) {
      return JSON.parse(JSON.stringify(cache.get(hash)));
    }
    const result = await compileMarkdown(input, config.compiler);
    cache.set(hash, JSON.parse(JSON.stringify(result)));
    md5.end();
    return result;
  };

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    async transform(code: string, id: string) {
      if (!id.endsWith(".md")) return;
      const [rawHtml, meta] = await compile(code);
      page.prevHash = hashIt.hash({ components: meta.components });
      page.head = meta.head;
      page.meta = meta;
      page.sources = [];
      page.global = {};
      const renderedHtml = await utils.render(rawHtml);
      page.head.script.push({
        type: "text/javascript",
        innerHTML: generateVirtualEntryPoint(page.global, config.vite.root),
      });
      const appHtml = appendPrelude(renderedHtml, page);
      return appHtml;
    },

    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        const fileId = normalize(module.file);
        if (page.currentUrl === fileId) {
          let [html, meta] = await compile(
            await fs.readFile(page.currentUrl, { encoding: "utf-8" })
          );
          const newHash = hashIt.hash({ components: meta.components });

          // no change in component signature in markdown
          if (newHash === page.prevHash) {
            // rerender the new changes, this will be fast as the components are cached
            html = await utils.render(html);
            html = appendPrelude(html, page);
            utils.logger.info(`Page reload: ${fileId}`, {
              timestamp: true,
            });
            ctx.server.ws.send({
              type: "custom",
              event: "new:document",
              data: html,
            });
          } else {
            // change in component signature, reload the file. Cached ssr components will still be used
            reload(fileId, ctx.server, utils.logger);
            break;
          }
        }
      }
    },
  };
}
