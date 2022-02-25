import type { Plugin } from "vite";
import type { ResolvedConfig } from "../../types";
import Icons from "node-icons";

export default function ({ config }: ResolvedConfig): Plugin {
  const icons = Icons(config.compiler.icons);
  const separator = config.compiler.icons?.separator || ":";
  const moduleMap: Map<string, string> = new Map();
  const stringifiedDefaults = JSON.stringify(
    config.compiler.defaultIconsStyles || {}
  );
  return {
    name: "vite-tinypages-icons",
    async resolveId(id: string) {
      if (moduleMap.has(id)) {
        return id;
      }
      if (id.startsWith("~icons/")) {
        const parts = id.split("~icons/").slice(1)[0].split("/");
        const res = icons.getIconsSync(
          parts[0] + separator + parts[1],
          {},
          false
        );
        if (res) {
          moduleMap.set(id, res);
          return id;
        }
      }
    },
    load(id: string) {
      const res = moduleMap.get(id);
      if (res) {
        // preact js component
        return `
        import { h } from "preact";
        import { wrapObject } from "@tinypages/compiler/utils";
        export default function(props){
          const str=(obj)=>{
            let returnVal = "";
            Object.values(obj).forEach(([key,val])=>{
              returnVal +=\`\$\{key\}=\$\{val\} \`;
            });
             return returnVal;
          }; 
          const initial = "<svg "+ str(wrapObject(props||${stringifiedDefaults}));
          return h("span", {
          dangerouslySetInnerHTML: { __html: ${
            "initial" + "+ `" + res.split("<svg")[1] + "`"
          } },
          });
        }
        `;
      }
    },
  };
}
