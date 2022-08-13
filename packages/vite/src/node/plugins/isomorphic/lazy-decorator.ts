import type { Plugin } from "vite";

export default function (): Plugin {
  return {
    name: "vite-tinypages-lazy-decorator",
    async resolveId(id: string) {
      return /\?lazy/.test(id) ? id : undefined;
    },
    load(id: string) {
      if (/\?lazy/.test(id)) {
        const path = id.split("?lazy")[0];
        return `
      import { lazy } from "preact/compat";
      export default lazy(()=>import("${path}"));
        `;
      }
    },
  };
}
