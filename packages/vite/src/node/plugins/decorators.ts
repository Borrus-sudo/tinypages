import type { Plugin } from "vite";
import { useContext } from "../context";
import { v4 as uuid } from "@lukeed/uuid";

export default function (): Plugin {
  const { page } = useContext();
  return {
    name: "vite-tinypages-sub-island-hydration",
    async resolveId(id: string) {
      return /(j|t)sx\?hydrate/.test(id) ? id : "";
    },
    /**
     * The extra boilerplate code will affect
     */
    load(id: string, options) {
      if (!/(j|t)sx\?hydrate/.test(id)) {
        return;
      }
      const uid = uuid();
      const path = id.split("?hydrate")[0];
      page.global.components[uid] = {
        lazy: id.includes("?hydrate=lazy"),
        path,
      };
      if (options.ssr) {
        return `
        import {h} from "preact";
        import component from "${path}"
        export default (props)=>{
          return  h("div", {preact:undefined,uid:"${uid}"}, [
              h('script', {type: 'application/json',dangerouslySetInnerHTML: { __html: JSON.stringify(props) },}),
              h(component, props),
          ]);
        };
        `;
      }
    },
  };
}
