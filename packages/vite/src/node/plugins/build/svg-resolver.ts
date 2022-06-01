import type { Plugin } from "vite";
import { useContext } from "../../context";
import path from "path";
import Icons from "node-icons";

export default function (): Plugin {
  const { config } = useContext("iso");
  const svgIdToMap = new Map();
  const cache = new Map();
  const icons = Icons(config.modules.icons);
  const separator = config.modules.icons?.separator || ":";
  const stringifiedDefaults = JSON.stringify(
    config.modules.icons.defaultIconsStyles || {}
  );
  const loadIcons = (id) => {
    let res = "";
    if (config.modules.icons.load) {
      res = config.modules.icons.load(id.split("~icons/")[1]) || "";
    } else {
      const parts = id.split("~icons/")[1].split("/");
      res =
        icons.getIconsSync(parts[0] + separator + parts[1], {}, false) || "";
    }
    return res;
  };
  let assetsDir;
  return {
    name: "vite-tinypages-svg-resolver",
    enforce: "pre",
    apply: "build",
    configResolved(config) {
      assetsDir = config.build.assetsDir;
    },
    resolveId(id: string, importer) {
      if (id.endsWith(".svg") && !id.startsWith("ICONS-LOAD-")) {
        return path.join(assetsDir, id);
      }
      let originalId = id;
      if (cache.has(originalId)) {
        return cache.get(originalId);
      }
      if (id.startsWith("/~icons/")) {
        id = id.replace("/~icons/", "~icons/");
      }
      if (id.startsWith("~icons/")) {
        const svgId = id.split("~icons/")[1].replace(/\//g, "-") + ".svg";
        const res = loadIcons(id);
        if (!res) {
          return;
        }
        if (importer.endsWith(".html")) {
          console.log(svgId);
          this.emitFile({
            type: "asset",
            name: id,
            source: res,
          });
          svgIdToMap.set(svgId, res);
          const toReturn = path.join(assetsDir, id);
          cache.set(originalId, toReturn);
          return toReturn;
        }
        console.log(svgId);
        svgIdToMap.set(svgId, res);
        cache.set(originalId, `ICONS-LOAD-${svgId}`);
        return `ICONS-LOAD-${svgId}`;
      }
    },
    load(id: string) {
      if (id.endsWith(".svg") && !id.startsWith("ICONS-LOAD-")) {
        const referenceId = this.emitFile({
          type: "asset",
          name: path.basename(id),
          source: svgIdToMap.get(path.basename(id)),
        });
        return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`;
      } else if (id.startsWith("ICONS-LOAD-")) {
        return `
          import svg from "${id.split("ICONS-LOAD-")[1]}";
          import { h } from "preact";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          export default (props) => {
            return h("img", {src:svg, style:stringifyImageStyle(props||${stringifiedDefaults}) });
          }
          `;
      }
    },
  };
}
