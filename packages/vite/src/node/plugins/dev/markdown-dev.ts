import { compile as compileMarkdown } from "@tinypages/compiler";
import { existsSync, promises as fs } from "fs";
import path from "path";
import type { ModuleNode, Plugin, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { Meta } from "../../../../types/types";
import { useContext, useVite } from "../../context";
import { refreshRouter } from "../../router/fs";
import { hash } from "../../utils";
import { appendPrelude } from "../../render/render-utils";
import {
  generateVirtualEntryPoint,
  hash as hashIt,
  reload,
} from "../plugin-utils";
import { Liquid } from "liquidjs";
import { v4 as uuid } from "@lukeed/uuid";

export default function (): Plugin {
  const { config, page, utils } = useContext("dev");
  const cache: Map<string, string> = new Map();
  const virtualModuleMap: Map<string, string> = new Map([
    ["/uno:only", `import "uno.css";import "tinypages/hmr";`],
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
    const result = await compileMarkdown(input, config.compiler);
    cache.set(digest, JSON.stringify(result));
    return result;
  };

  /**
   * Loads the entry point and builds the page
   */

  // constants needed
  const ssrTimestampCache = new Map();
  const propsCache = new Map();
  const engine = new Liquid({
    cache: true,
    extname: ".md",
    root: path.join(config.vite.root, "pages"),
    layouts: path.join(config.vite.root, "layouts"),
  });

  // main function
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
    let data;

    /**
     * caching strategy for better hmr during dev
     */
    let originalUrl = page.pageCtx.originalUrl;
    let currTimestamp = new Date().getTime();

    if (isBuild || !ssrTimestampCache.has(originalUrl)) {
      // it is imperative to use originalUrl

      //boilerplate stuff
      const { default: loader } = await vite.ssrLoadModule(url);
      data = await loader(page.pageCtx.params);
      utils.consola.success("State loaded!");

      if (!isBuild) {
        ssrTimestampCache.set(originalUrl, currTimestamp);
        propsCache.set(originalUrl, data);
      }
    } else {
      const prevTimestamp = ssrTimestampCache.get(originalUrl) ?? 0;
      const offset = 120 * 1000;

      // cache expired
      if (currTimestamp - prevTimestamp > offset) {
        // boilerplate stuff
        const { default: loader } = await vite.ssrLoadModule(url);
        data = await loader(page.pageCtx.params);
        utils.consola.success("State loaded!");

        ssrTimestampCache.set(originalUrl, currTimestamp);
        propsCache.set(originalUrl, data);
      } else {
        utils.consola.success("State loaded from cache!");
        data = propsCache.get(originalUrl);
      }
    }

    page.global.ssrProps = data?.ssrProps || {};

    //Liquidjs stuff
    markdown.replace(/\{.*?layout.*?\"(.*?)\".*?\}/, (_, needle) => {
      const layout = path.resolve(
        path.dirname(page.pageCtx.url),
        needle.endsWith(".md") ? needle : needle + ".md"
      );
      page.reloads.push(layout);
      return _;
    });
    const builtMarkdown = await engine.parseAndRender(markdown, data);
    return builtMarkdown;
  };

  return {
    name: "vite-tinypages-markdown",
    enforce: "pre",
    apply: "serve",
    configureServer(server) {
      const eventHandler = (filePath) => {
        if (
          typeof filePath === "string" &&
          path.normalize(filePath).startsWith(utils.pageDir)
        ) {
          refreshRouter(utils.pageDir);
          reload("change in /pages dir", server, utils.logger);
          seen = [];
        }
      };
      server.watcher.addListener("add", eventHandler);
      server.watcher.addListener("unlink", eventHandler);
    },
    transformIndexHtml: {
      enforce: "pre",
      async transform(markdown: string, context) {
        if (!vite) {
          vite = useVite();
        }

        const builtLiquid = await buildRoute(page.pageCtx.url, markdown);
        const [rawHtml, meta] = await compile(builtLiquid);
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
        page.prevHash = hashIt({
          components: meta.components,
          head: meta.head,
          feed: meta.feeds,
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
        for (const toAdd of [
          page.pageCtx.url,
          ...page.reloads.filter((p) => p.endsWith(".md")),
        ]) {
          if (!seen.includes(toAdd)) {
            context.server.moduleGraph.createFileOnlyEntry(toAdd);
            seen.push(toAdd);
          }
        }

        context.filename = viteNormalizePath(page.pageCtx.url);
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
        /**
         * Reload the page. (mainly for handling the loader and layout files)
         */
        if (page.reloads.includes(fileId)) {
          reload(fileBasename, context.server, utils.logger);
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
          const newHash = hashIt({
            components: meta.components,
            head: meta.head,
            feed: meta.feeds,
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
        } else {
          toReturnModules.push(module);
        }
      }
      return toReturnModules;
    },
  };
}
