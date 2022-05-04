import * as path from "path";
import type { Plugin } from "vite";
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
      for (let module of ctx.modules) {
        const fileId = path.normalize(module.file);
        if (module.url.startsWith("/component")) {
          if (page.sources.includes(fileId)) {
            utils.invalidate(fileId);
          } else {
            const res = isParentJSX(module, page);
            if (res[0]) {
              utils.invalidate(res[1]);
            }
          }
        }
      }
      return ctx.modules;
    },
  };
}
