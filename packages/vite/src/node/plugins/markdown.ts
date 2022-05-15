import { compile as compileMarkdown } from "@tinypages/compiler";
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
// import { useUnlighthouse } from "@unlighthouse/core";

export default function (): Plugin {
  const { config, page, utils } = useContext();
  const cache: Map<string, [string, Meta, string[]]> = new Map();
  let changedLayoutIndication = false;
  /**
   * The compile function takes something as input and caches it. In the case of changedLayouts we have to forcibly make it
   * not take from the cache as the main markown remains unchanged but the layout needs to be recompiled
   */
  const compile = async (input: string): Promise<[string, Meta, string[]]> => {
    const digest = hash(input).toString();
    if (changedLayoutIndication) {
      changedLayoutIndication = false;
    } else {
      if (cache.has(digest)) {
        return deepCopy(cache.get(digest));
      }
    }
    const result = await compileMarkdown(
      input,
      config.compiler,
      page.pageCtx.url
    );
    cache.set(digest, deepCopy(result));
    return result;
  };

  const virtualModuleMap = new Map();
  const addedModule = [];
  let isBuild = false;
  // let worker;

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build" || config.isProduction;
      // worker = useUnlighthouse().worker;
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform(markdown: string, ctx) {
        const [rawHtml, meta, layouts] = await compile(markdown);
        /**
         * Initialize the page globals to make it ready for the new page
         */

        page.meta = meta;
        page.sources = [];
        page.global = {};
        page.prevHash = hashIt(meta.components);
        page.layouts = layouts;

        const renderedHtml = await utils.render(rawHtml);

        /**
         * Initializes the virtual point for hydrating code
         */

        if (Object.keys(page.global).length > 0) {
          const virtualModuleId = viteNormalizePath(
            `/virtualModule${
              pathToFileURL(page.pageCtx.url.replace(/\.md$/, ".jsx")).href
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
        } else {
          page.meta.head.script.push({
            type: "module",
            src: "/uno:only",
          });
        }

        const appHtml = appendPrelude(renderedHtml, page);
        for (const toAdd of [page.pageCtx.url, ...page.layouts]) {
          if (!addedModule.includes(toAdd)) {
            ctx.server.moduleGraph.createFileOnlyEntry(toAdd);
            addedModule.push(toAdd);
          }
        }
        // worker.queueRoute(page.pageCtx.originalUrl);
        ctx.filename = viteNormalizePath(page.pageCtx.url);
        return appHtml;
      },
    },
    resolveId(id: string) {
      return virtualModuleMap.has(id) || id === "/uno:only" ? id : null;
    },
    load(id: string) {
      if (virtualModuleMap.has(id)) {
        return virtualModuleMap.get(id);
      } else if (id === "/uno:only") {
        return `import "uno.css";`;
      }
    },
    async handleHotUpdate(ctx) {
      const toReturnModules: ModuleNode[] = [];
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);

        /**
         * If the pageCtx is equal to the fileId then check if the components have changed,
         * If the components have not changed then just re request the page and update it using million.js
         * Else reload the entire page to remove the previous module from the HMR system
         */
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
          return;
        } else if (page.layouts.includes(fileId)) {
          /**
           *  Reload the page if layout changed;
           *  TODO: improve this
           */

          changedLayoutIndication = true;
          reload(module.file, ctx.server, utils.logger);

          utils.logger.info(`Page reload ${module.file}`, {
            timestamp: true,
            clear: true,
          });
          return;
        } else {
          toReturnModules.push(module);
        }
      }
      return toReturnModules;
    },
  };
}
