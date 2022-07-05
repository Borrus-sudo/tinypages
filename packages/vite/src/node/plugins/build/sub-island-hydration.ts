import type { Plugin } from "vite";
import { hash } from "../../utils";

export default function (): Plugin {
  return {
    name: "vite-tinypages-sub-island-hydration",
    apply: "serve",
    async resolveId(id: string) {
      return /\?hydrate/.test(id) ? id : "";
    },
    /**
     * The extra boilerplate code will not affect prod
     *  We hash the id to make it possible for multi page build from a single static file.
     */
    load(id: string, options) {
      if (/\?hydrate/.test(id)) {
        const uid = hash(id);
        const path = id.split("?hydrate")[0];
        const componentMeta = JSON.stringify({
          lazy: id.includes("?hydrate=lazy"),
          path,
          uid,
        });
        if (options.ssr) {
          return `
        import { h } from "preact";
        import component from "${path}"
        export default (props) => {
          return  h("div", {preact:null,uid:"${uid}"}, [
              h(component, props),
              h('script', {type: 'application/json',dangerouslySetInnerHTML: { __html: JSON.stringify(props) },}),
              h('island-marker', { dangerouslySetInnerHTML: { __html: "${componentMeta}" },} } )
          ]);
        };
        `;
        }
      }
    },
  };
}
