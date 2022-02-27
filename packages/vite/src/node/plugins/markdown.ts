import compileMarkdown from "@tinypages/compiler";
import crypto from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import type { ModuleNode, Plugin } from "vite";
import type { Meta } from "../../types";
import { useContext } from "../context";
import { appendPrelude } from "../utils";
import { hashIt, reload, generateVirtualEntryPoint } from "./pluginUtils";
import { normalizePath } from "vite";

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
  const moduleMap = new Map();
  const addedModule = [];
  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    transformIndexHtml: {
      enforce: "pre",
      async transform(markdown: string, ctx) {
        const [rawHtml, meta] = await compile(markdown);
        page.prevHash = hashIt.hash({ components: meta.components });
        page.meta = meta;
        page.sources = [];
        page.global = {};
        const renderedHtml = await utils.render(rawHtml);
        const virtualModuleId = normalizePath(
          `/virtualModule${pathToFileURL(page.pageCtx.url).href.replace(
            /\.md$/,
            ".js"
          )}`
        );
        page.meta.head.script.push({
          type: "module",
          src: virtualModuleId,
        });
        moduleMap.set(
          virtualModuleId,
          generateVirtualEntryPoint(page.global, config.vite.root)
        );
        const appHtml = appendPrelude(renderedHtml, page);
        if (!addedModule.includes(page.pageCtx.url)) {
          ctx.server.moduleGraph.createFileOnlyEntry(page.pageCtx.url);
          addedModule.push(page.pageCtx.url);
        }
        return appHtml;
      },
    },
    resolveId(id: string) {
      return moduleMap.has(id) ? id : null;
    },
    load(id: string) {
      if (moduleMap.has(id)) {
        return moduleMap.get(id);
      }
    },
    async handleHotUpdate(ctx) {
      console.log(ctx.modules);
      const toReturnModules: ModuleNode[] = [];
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        if (page.pageCtx.url === fileId) {
          let [html, meta] = await compile(
            await fs.readFile(page.pageCtx.url, { encoding: "utf-8" })
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
        } else {
          toReturnModules.push(module);
        }
      }
      return toReturnModules;
    },
  };
}
