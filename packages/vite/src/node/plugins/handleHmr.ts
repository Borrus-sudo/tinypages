import { promises as fs } from "fs";
import hasher from "node-object-hash";
import { normalize } from "path";
import { ModuleNode, ViteDevServer, type Plugin } from "vite";
import { Bridge, ResolvedConfig } from "../../types";
import { appendPrelude } from "../utils";
import { refreshRouter } from "../router/fs";

const hashIt = hasher({ sort: false, coerce: true });
const isParentJSX = (node: ModuleNode, bridge: Bridge) => {
  for (let module of node.importedModules) {
    const fileId = normalize(module.file);
    if (
      (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) &&
      bridge.sources.includes(fileId)
    ) {
      return [true, fileId];
    }
    const res = isParentJSX(module, bridge);
    if (res[0]) {
      return res;
    }
  }
  return [false, ""];
};

export default async function ({
  bridge,
  utils,
}: ResolvedConfig): Promise<Plugin> {
  const reload = (file, server: ViteDevServer) => {
    utils.logger.info(`Page reload: ${file}`, {
      timestamp: true,
    });
    server.ws.send({
      type: "custom",
      event: "reload:page",
    });
  };
  return {
    name: "vite-tinypages-hmr",
    apply: "serve",
    configureServer(server) {
      server.watcher.addListener("change", async (_, filePath) => {
        if (
          typeof filePath === "string" &&
          normalize(filePath) === utils.pageDir
        ) {
          await refreshRouter(utils.pageDir);
          reload("change in /pages dir", server);
        }
      });
    },
    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        const fileId = normalize(module.file);
        if (fileId === bridge.configFile) {
          reload(fileId, ctx.server);
          break;
        } else if (fileId === bridge.currentUrl) {
          let [html, meta] = await utils.compile(
            await fs.readFile(bridge.currentUrl, { encoding: "utf-8" })
          );
          const newHash = hashIt.hash({ components: meta.components });

          // no change in component signature in markdown
          if (newHash === bridge.prevHash) {
            // rerender the new changes, this will be fast as the components are cached
            [html, meta] = await utils.render(html, meta, bridge.pageCtx);
            html = appendPrelude(html, meta.headTags, meta.styles);
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
            reload(fileId, ctx.server);
            break;
          }
        } else {
          if (bridge.sources.includes(fileId)) {
            // invalidate the file and reload, so in the next reload, compileMarkdown cached values are used and cached ssr components
            // other than fileId are utilized
            ctx.server.moduleGraph.invalidateModule(module);
            utils.invalidate(fileId);
            reload(fileId, ctx.server);
            break;
          } else {
            const res = isParentJSX(module, bridge);
            if (res[0]) {
              ctx.server.moduleGraph.invalidateModule(module);
              utils.invalidate(res[1]);
              ctx.server.ws.send({
                type: "custom",
                event: "reload:component",
                data: res[1],
              });
              break;
            }
          }
        }
      }
      return [];
    },
  };
}
