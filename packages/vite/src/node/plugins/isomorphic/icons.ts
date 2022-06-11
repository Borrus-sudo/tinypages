import { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const { config } = useContext("iso");
  const stringifiedDefaults = JSON.stringify(
    config.modules.icons.defaultIconsStyles || {}
  );
  let isBuild;
  return {
    name: "vite-tinypages-icons",
    resolveId(id: string) {
      if (id.endsWith(".svg")) return;
      if (id.startsWith("~icons/")) return id;
    },
    configResolved(config) {
      isBuild = config.isProduction;
    },
    load(id: string) {
      if (id.startsWith("~icons/")) {
        if (isBuild)
          return `
          import { h } from "preact";
          import { stringifyImageStyle } from "@tinypages/compiler/utils";
          import svgUrl from "${id}.svg";
          export default (props) => {
            return h("img", {src:svgUrl, style:stringifyImageStyle(props||${stringifiedDefaults}) });
          }
          `;
        else {
          `import { h } from "preact";
           import svg from "svg:${id}";
           export default (props) => {
              return h("span", {}, [
                         h("svg", {
                            dangerouslySetInnerHTML: {
                            html: svg,
                          },
                        ...props,
                        }),
                    ]);
          };
         `;
        }
      }
    },
  };
}
