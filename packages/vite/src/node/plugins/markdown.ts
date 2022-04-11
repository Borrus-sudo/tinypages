import compileMarkdown from "@tinypages/compiler";
import { promises as fs } from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import type { ModuleNode, Plugin } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { Meta } from "../../types/types";
import { useContext } from "../context";
import { appendPrelude, deepCopy, hash } from "../utils";
import {
  generateVirtualEntryPoint,
  hash as hashIt,
  reload,
} from "./pluginUtils";

export default function (): Plugin {
  const { config, page, utils } = useContext();
  const cache: Map<string, [string, Meta]> = new Map();
  const compile = async (input: string): Promise<[string, Meta]> => {
    const digest = hash(input).toString();
    if (cache.has(digest)) {
      return deepCopy(cache.get(digest));
    }
    const result = await compileMarkdown(input, config.compiler);
    cache.set(digest, deepCopy(result));
    return result;
  };
  const virtualModuleMap = new Map();
  const addedModule = [];
  let isBuild = false;

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build" || config.isProduction;
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform(markdown: string, ctx) {
        const [rawHtml, meta] = await compile(markdown);
        page.meta = meta;
        page.sources = [];
        page.global = {};
        page.prevHash = hashIt(meta.components);
        const renderedHtml = await utils.render(rawHtml);
        if (true) {
          const virtualModuleId = viteNormalizePath(
            `/virtualModule${
              pathToFileURL(page.pageCtx.url.replace(/\.md$/, ".js")).href
            }`
          );
          page.meta.head.script.push({
            type: "module",
            src: virtualModuleId,
          });
          virtualModuleMap.set(
            virtualModuleId,
            generateVirtualEntryPoint(page.global, config.vite.root, isBuild)
          );
        }
        const appHtml = appendPrelude(renderedHtml, page);
        if (!addedModule.includes(page.pageCtx.url)) {
          ctx.server.moduleGraph.createFileOnlyEntry(page.pageCtx.url);
          addedModule.push(page.pageCtx.url);
        }
        ctx.filename = viteNormalizePath(page.pageCtx.url);
        return appHtml;
      },
    },
    resolveId(id: string) {
      return virtualModuleMap.has(id) ? id : null;
    },
    load(id: string) {
      if (virtualModuleMap.has(id)) {
        return virtualModuleMap.get(id);
      }
    },
    async handleHotUpdate(ctx) {
      const toReturnModules: ModuleNode[] = [];
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        if (page.pageCtx.url === fileId) {
          const [, meta] = await compile(
            await fs.readFile(page.pageCtx.url, { encoding: "utf-8" })
          );
          const newHash = hashIt(meta.components);
          if (newHash !== page.prevHash) {
            reload(module.file, ctx.server, utils.logger);
            return [];
          }
          utils.logger.info(`Page reload ${module.file}`, {
            timestamp: true,
            clear: true,
          });
          ctx.server.ws.send({
            type: "custom",
            event: "new:page",
          });
        } else {
          toReturnModules.push(module);
        }
      }
      return toReturnModules;
    },
  };
}
