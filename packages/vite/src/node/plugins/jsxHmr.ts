import * as path from "path";
import type { Plugin, ModuleNode } from "vite";
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
      /**
       * Because of the way how the framework works, the module graph is populated with many modules during ssg at dev time.
       * So when files change, we filter out component files which are used by the browser and give vite to handle them (prefresh takes over
       * these modules).
       * We also revalidate caching based on components changed, so on the next reload, the ssged content is not stale
       */
      const toReturn: ModuleNode[] = [];
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
          toReturn.push(module);
        }
      }
      return toReturn;
    },
  };
}
