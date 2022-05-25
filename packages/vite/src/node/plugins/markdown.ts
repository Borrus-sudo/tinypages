import { v4 as uuid } from "@lukeed/uuid";
import { compile as compileMarkdown } from "@tinypages/compiler";
import ejs from "ejs";
import { existsSync, promises as fs } from "fs";
import * as path from "path";
import type { ModuleNode, Plugin, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { Meta } from "../../../types/types";
import { useContext, useVite } from "../context";
import { refreshRouter } from "../router/fs";
import { appendPrelude, hash } from "../utils";
import {
  generateVirtualEntryPoint,
  hash as hashIt,
  reload,
} from "./plugin-utils";

// import { useUnlighthouse } from "@unlighthouse/core";

export default function (): Plugin {
  const { config, page, utils } = useContext();
  const cache: Map<string, string> = new Map();
  let changedLayoutIndication = false;
  let vite: ViteDevServer;
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
        return JSON.parse(cache.get(digest));
      }
    }

    const result = await compileMarkdown(
      input,
      config.compiler,
      page.pageCtx.url
    );

    cache.set(digest, JSON.stringify(result));
    return result;
  };

  const buildRoute = async (url: string, markdown: string) => {
    page.reloads = [];
    let jsUrl = url.replace(/\.md$/, ".js");
    if (!existsSync(jsUrl)) {
      let tsUrl = url.replace(/\.md$/, ".ts");
      if (existsSync(tsUrl)) {
        url = tsUrl;
      } else {
        return markdown;
      }
    } else {
      url = jsUrl;
    }

    if (!page.reloads.includes(url)) page.reloads.push(url);
    utils.consola.info("Loading state...");
    const { default: loader } = await vite.ssrLoadModule(url);
    const data = await loader(page.pageCtx.params || {});
    page.global.ssrProps = data?.ssrProps || {};
    const buildMarkdown = ejs.render(markdown, data);
    return buildMarkdown;
  };

  const virtualModuleMap: Map<string, string> = new Map([
    ["/uno:only", `import "uno.css"`],
  ]);
  let seen = [];
  let isBuild = false;
  // let worker;

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build" || config.isProduction;
      // worker = useUnlighthouse().worker;
    },
    configureServer(server) {
      const eventHandler = async (filePath) => {
        if (
          typeof filePath === "string" &&
          path.normalize(filePath).startsWith(utils.pageDir)
        ) {
          await refreshRouter(utils.pageDir);
          reload("change in /pages dir", server, utils.logger);
          seen = [];
        }
      };
      server.watcher.addListener("add", eventHandler);
      server.watcher.addListener("unlink", eventHandler);
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform(markdown: string, ctx) {
        if (!vite) {
          vite = useVite();
        }

        const builtEjs = await buildRoute(page.pageCtx.url, markdown);
        const [rawHtml, meta, layouts] = await compile(builtEjs);
        /**
         * Initialize the page globals to make it ready for the new page.
         * page.reloads=[] happens in buildRoute function.
         */
        page.meta = meta;
        page.sources = [];
        page.global = {
          components: {},
          ssrProps: {},
        };
        page.prevHash = hashIt(meta.components);
        page.layouts = layouts;

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
            generateVirtualEntryPoint(
              page.global.components,
              config.vite.root,
              isBuild
            )
          );
        } else {
          page.meta.head.script.push({
            type: "module",
            src: "/uno:only",
            innerHTML: undefined,
          });
        }

        const appHtml = appendPrelude(renderedHtml, page);
        for (const toAdd of [page.pageCtx.url, ...page.layouts]) {
          if (!seen.includes(toAdd)) {
            ctx.server.moduleGraph.createFileOnlyEntry(toAdd);
            seen.push(toAdd);
          }
        }

        ctx.filename = viteNormalizePath(page.pageCtx.url);
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
    async handleHotUpdate(ctx) {
      const toReturnModules: ModuleNode[] = [];
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        /**
         * Reload the page. (mainly for handling the loader files)
         */
        if (page.reloads.includes(fileId)) {
          reload(module.file, ctx.server, utils.logger);
          seen = [];
          return;
        } else if (page.pageCtx.url === fileId) {
          /**
           * If the pageCtx is equal to the fileId then check if the components have changed,
           * If the components have not changed then just re request the page and update it using million.js
           * Else reload the entire page to remove the previous module from the HMR system
           */
          const [, meta] = await compile(
            await fs.readFile(page.pageCtx.url, { encoding: "utf-8" })
          );
          const newHash = hashIt(meta.components);
          if (newHash !== page.prevHash) {
            reload(module.file, ctx.server, utils.logger);
            seen = [];
            return;
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
          seen = [];

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
