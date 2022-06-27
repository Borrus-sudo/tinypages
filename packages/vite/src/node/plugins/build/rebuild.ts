import type { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const headCache: Map<string, string> = new Map();
  return {
    name: "vite-tinypages-rebuild-bundle",
    apply: "build",
    config(config) {},
    transformIndexHtml: {
      enforce: "pre",
      transform(html: string, ctx) {
        const key = ctx.path;
        return html.replace(/\<head\>([\s\S]*)\<\/head\>/, (head) => {
          headCache.set(key, head);
          return "<head></head>";
        });
      },
    },
    generateBundle(_, bundle) {
      Object.values(bundle).forEach((chunk) => {
        //@ts-ignore
        const key = chunk.facadeModuleId;
        const head = headCache.get(key);
      });
    },
  };
}
