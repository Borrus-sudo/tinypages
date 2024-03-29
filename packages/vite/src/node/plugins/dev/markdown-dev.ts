import { compile as compileMarkdown } from "@tinypages/compiler";
import { promises as fs } from "fs";
import path from "path";
import type { ModuleNode, Plugin, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { Meta } from "../../../../types/types";
import { useContext, useVite } from "../../context";
import { refreshRouter } from "../../router/fs";
import { hash } from "../../utils";
import { appendPrelude } from "../../render/render-utils";
import { purgeLoaderCache } from "../../render/load-page";
import { hash as hashIt, reload } from "../plugin-utils";
import { generateVirtualEntryPoint } from "../../render/render-utils";
import { uuid } from "../../utils";

export default function (): Plugin {
  const { config, page, utils } = useContext("dev");
  const cache: Map<string, string> = new Map();
  const virtualModuleMap: Map<string, string> = new Map([
    [
      "/uno:only.js",
      `import "uno.css";import "virtual:unocss-devtools";import "tinypages/hmr";`,
    ],
  ]);
  let seen = [];
  let vite: ViteDevServer;
  let isBuild = false;

  /**
   * The compile function takes something as input and caches it.
   */
  const compile = async (input: string): Promise<[string, Meta]> => {
    const digest = hash(input).toString();
    if (cache.has(digest)) {
      return JSON.parse(cache.get(digest));
    }
    const result = await compileMarkdown(
      input,
      config.compiler,
      utils.markdown_cache,
      false
    );
    cache.set(digest, JSON.stringify(result));
    return result;
  };

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    configureServer(server) {
      const eventHandler = (filePath) => {
        if (typeof filePath === "string") {
          const normalizedPath = path.normalize(filePath);
          if (normalizedPath.startsWith(utils.pageDir)) {
            refreshRouter(utils.pageDir);
            reload("change in /pages dir", server, utils.logger);
            seen = [];
          } else if (
            normalizedPath.startsWith(utils.i18nDir) &&
            normalizedPath.includes(utils.currI18n)
          ) {
            reload("change in /locales dir", server, utils.logger);
          }
        }
      };
      server.watcher.addListener("add", eventHandler);
      server.watcher.addListener("unlink", eventHandler);
    },
    transformIndexHtml: {
      enforce: "pre",
      /**
       * The compiled markdown by liquidjs following the remix layout system and ssred loader function
       */
      async transform(builtLiquid: string, context) {
        if (!vite) {
          vite = useVite();
        }
        let [rawHtml, meta] = await compile(builtLiquid);
        /**
         * Initialize the page globals to make it ready for the new page.
         * page.reloads=[] happens in middleware/router.
         */
        page.meta = meta;
        page.sources = [];
        page.global = {
          components: {},
          ssrProps: {},
        };
        page.prevHash = hashIt({
          components: meta.components,
          head: meta.head,
        });

        const renderedHtml = await utils.render(rawHtml);

        /**
         * Initializes the virtual point for hydrating code
         */

        if (Object.keys(page.global.components).length > 0) {
          const virtualModuleId = "/" + uuid() + ".js";

          page.meta.head.script.push({
            type: "module",
            src: virtualModuleId,
            innerHTML: undefined,
          });

          virtualModuleMap.set(
            virtualModuleId,
            await generateVirtualEntryPoint(
              page.global.components,
              config.vite.root,
              isBuild,
              utils,
              virtualModuleId
            )
          );
        } else {
          page.meta.head.script.push({
            type: "module",
            src: "/uno:only.js",
            innerHTML: undefined,
          });
        }

        const appHtml = appendPrelude(renderedHtml, page);
        for (const toAdd of page.reloads.filter((p) => p.endsWith(".md"))) {
          if (!seen.includes(toAdd)) {
            context.server.moduleGraph.createFileOnlyEntry(toAdd);
            seen.push(toAdd);
          }
        }

        context.filename = viteNormalizePath(page.pageCtx.filePath);
        return appHtml;
      },
    },
    resolveId(id: string) {
      if (virtualModuleMap.has(id)) {
        return id;
      }
    },
    load(id: string) {
      if (virtualModuleMap.has(id)) {
        return virtualModuleMap.get(id);
      }
    },
    async handleHotUpdate(context) {
      const toReturnModules: ModuleNode[] = [];
      for (let module of context.modules) {
        const fileId = path.normalize(module.file);
        const fileBasename = path.basename(fileId);

        if (page.pageCtx.filePath === fileId) {
          /**
           * If the pageCtx is equal to the fileId then check if the components have changed,
           * If the components have not changed then just re request the page and update it using million.js
           * Else reload the entire page to remove the previous module from the HMR system
           */
          const [, meta] = await compile(
            await fs.readFile(page.pageCtx.filePath, { encoding: "utf-8" })
          );
          const newHash = hashIt({
            components: meta.components,
            head: meta.head,
          });
          if (newHash !== page.prevHash) {
            reload(fileBasename, context.server, utils.logger);
            seen = [];
            return;
          }

          utils.logger.info(`Page reload ${fileBasename}`, {
            timestamp: true,
            clear: true,
          });

          context.server.ws.send({
            type: "custom",
            event: "new:page",
          });
          return;
        } else if (page.reloads.includes(fileId)) {
          /**
           * Reload the page. (mainly for handling the loader and layout files)
           */
          if (/\.[tj]sx?$/.test(fileId)) {
            // time to throw away the fileToURL cache entry for this thing and re-import this file.
            purgeLoaderCache(fileId);
          }
          reload(fileBasename, context.server, utils.logger);
          seen = [];
          return;
        } else {
          toReturnModules.push(module);
        }
      }
      return toReturnModules;
    },
  };
}
