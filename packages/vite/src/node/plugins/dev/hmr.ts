import * as path from "path";
import type { ModuleNode, Plugin } from "vite";
import { useContext } from "../../context";
import { isParentJSX } from "../plugin-utils";

export default function (): Plugin {
  const { page, utils } = useContext("dev");
  return {
    name: "vite-tinypages-hmr",
    apply: "serve",
    enforce: "pre",
    async handleHotUpdate(ctx) {
      const toReturn: ModuleNode[] = [];
      const seen: Set<string> = new Set();
      for (let module of ctx.modules) {
        // css modules are treated as normal [jt]sx? files
        if (/\.css$/.test(module.file) && !/\.module\.css/.test(module.file)) {
          toReturn.push(module);
          continue;
        }
        const fileId = path.normalize(module.file);
        /**
         * The component is used in this page and need to be given to prefresh
         */
        if (
          module.url.startsWith("/component") &&
          page.sources.includes(fileId)
        ) {
          toReturn.push(module);
          continue;
        }
        /**
         * The component belongs to this page and is a ssr module
         */
        if (page.sources.includes(fileId)) {
          utils.invalidate(fileId);
        } else if (!seen.has(module.url)) {
          /**
           * Sees if the component is a descendant of a top level component.
           * seen map is maintained to prevent duplicates between ssr and non ssr instances of top level components
           */
          const res = isParentJSX(module, page);
          if (res[0]) {
            utils.invalidate(res[1]);
            toReturn.push(module);
            seen.add(module.url);
          }
        }
      }
      return toReturn;
    },
  };
}
