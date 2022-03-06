import * as path from "path";
import { type Plugin } from "vite";
import { useContext } from "../context";
import { refreshRouter } from "../router/fs";
import { isParentJSX, reload } from "./pluginUtils";

export default async function (): Promise<Plugin> {
  const { page, utils } = useContext();
  return {
    name: "vite-tinypages-hmr",
    apply: "serve",
    configureServer(server) {
      server.watcher.addListener("change", async (_, filePath) => {
        if (
          typeof filePath === "string" &&
          path.normalize(filePath) === utils.pageDir
        ) {
          await refreshRouter(utils.pageDir);
          reload("change in /pages dir", server, utils.logger);
        }
      });
    },
    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        if (fileId === utils.configFile) {
          reload(module.file, ctx.server, utils.logger);
          break;
        } else {
          if (page.sources.includes(fileId)) {
            // invalidate the file and reload, so in the next reload, compileMarkdown cached values are used and cached ssr components
            // other than fileId are utilized
            ctx.server.moduleGraph.invalidateModule(module);
            utils.invalidate(fileId);
            reload(module.file, ctx.server, utils.logger);
            break;
          } else {
            const res = isParentJSX(module, page);
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
