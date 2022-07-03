import type { Plugin } from "vite";
import { useContext, useVite } from "../../context";
import { uuid } from "../../utils";

export default function (): Plugin {
  //   const { page } = useContext("iso");
  const entryLinkCrawler: Map<string, string[]> = new Map();
  return {
    name: "vite-tinypages-sub-island-hydration",
    apply: "serve",
    async resolveId(id: string, importer) {
      return /\?hydrate/.test(id) ? id : "";
    },
    /**
     * The extra boilerplate code will not affect prod
     * vite.ssrLoadModule
     */
    load(id: string, options) {
      //   console.log(id);
      const vite = useVite();
      if (/\?hydrate/.test(id)) {
        const uid = uuid();
        const path = id.split("?hydrate")[0];
        // page.global.components[uid] = {
        //   lazy: id.includes("?hydrate=lazy"),
        //   path,
        // };
        if (options.ssr) {
          return `
        import { h } from "preact";
        import component from "${path}"
        export default (props) => {
          return  h("div", {preact:null,uid:"${uid}"}, [
              h(component, props),
              h('script', {type: 'application/json',dangerouslySetInnerHTML: { __html: JSON.stringify(props) },}),
          ]);
        };
        `;
        }
      }
    },
  };
}
