import * as path from "path";
import type { ModuleNode, Plugin } from "vite";
import { useContext } from "../context";
import { refreshRouter } from "../router/fs";
import { isParentJSX, reload } from "./pluginUtils";

export default function (): Plugin {
  const { page, utils } = useContext();
  return {
    name: "vite-tinypages-hmr",
    apply: "serve",
    enforce: "pre",
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
      const toReturn: ModuleNode[] = [];
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        if (fileId === utils.configFile) {
          reload(module.file, ctx.server, utils.logger);
          break;
        } else if (module.url.startsWith("/component")) {
          if (page.sources.includes(fileId)) {
            // TODO: check if page.sources's pageProps hash has changed and accordingly do things
            utils.invalidate(fileId);
            // reload(module.file, ctx.server, utils.logger);
          } else {
            const res = isParentJSX(module, page);
            if (res[0]) {
              utils.invalidate(res[1]);
            }
          }
          toReturn.push(module);
        }
      }
      return toReturn;
    },
  };
}
