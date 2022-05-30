import Icons from "node-icons";
import type { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const { config, virtualModuleMap } = useContext("iso");
  const icons = Icons(config.modules.icons);
  const separator = config.modules.icons?.separator || ":";
  const svgMap: Map<string, string> = new Map();
  const stringifiedDefaults = JSON.stringify(
    config.modules.icons.defaultIconsStyles || {}
  );
  let isBuild;
  return {
    name: "vite-tinypages-icons",
    configResolved(config) {
      isBuild = config.command === "build" || config.isProduction;
    },
    async resolveId(id: string) {
      if (svgMap.has(id)) {
        return id;
      }
      if (config.modules.icons.load) {
        const res = config.modules.icons.load(id);
        if (res) {
          svgMap.set(id, res);
          return id;
        }
      }
      if (id.startsWith("~icons/")) {
        const parts = id.split("~icons/")[1].split("/");
        const res = icons.getIconsSync(
          parts[0] + separator + parts[1],
          {},
          false
        );
        if (res) {
          svgMap.set(id, res);
          return id;
        }
      }
    },
    load(id: string) {
      const res = svgMap.get(id);
      if (res) {
        // preact js component
        if (!isBuild) {
          return `
        import { h } from "preact";
        import { stringifyObject } from "@tinypages/compiler/utils";
        export default function(props){
          const initial = "<svg "+ stringifyObject(props||${stringifiedDefaults});
          return h("span", {
          dangerouslySetInnerHTML: { __html: ${
            "initial" + "+ `" + res.split("<svg")[1] + "`"
          } },
          });
        }
        `;
        } else {
          const svgId =
            id.split("~icons/")[1].replace(/\//g, "-") + "[hash]" + ".svg";
          const emitFileId = this.emitFile({
            type: "asset",
            source: res,
            fileName: svgId,
          });
          virtualModuleMap.set(
            svgId,
            `export default import.meta.import.meta.ROLLUP_FILE_URL_${emitFileId};`
          );
          return `
          import svg from "${svgId}";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          export default (props) => {
            return h("img", {src:svg, style:stringifyImageStyle(props||${stringifiedDefaults}) });
          }
          `;
        }
      }
    },
  };
}
