import type { Plugin } from "vite";

const headCache: Map<string, string> = new Map();

function stripHead(): Plugin {
  return {
    name: "vite-tinypages-rebuild-strip-head",
    apply: "build",
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
  };
}

function addHead(): Plugin {
  return {
    name: "vite-tinypages-rebuild-add-head",
    apply: "build",
    transformIndexHtml: {
      enforce: "post",
      transform(html: string, ctx) {
        const key = ctx.path;
        return html.replace("<head></head>", headCache.get(key) ?? "");
      },
    },
  };
}

export const RebuildPlugin = () => [stripHead(), addHead()];
