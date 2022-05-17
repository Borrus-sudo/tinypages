import type { Plugin } from "vite";

export default function (): Plugin {
  return {
    name: "vite-tinypages-icons",
    async resolveId(id: string) {
      return /(j|t)sx\?hydrate=.*?/.test(id) ? id : "";
    },
    load(id: string) {
      return ``;
    },
  };
}
