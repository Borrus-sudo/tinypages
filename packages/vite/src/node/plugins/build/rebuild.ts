import type { Plugin } from "vite";
import { useContext } from "../../context";

const headCache: Map<string, string> = new Map();

function stripHead(): Plugin {
  const buildContext = useContext("iso");
  return {
    name: "vite-tinypages-rebuild-strip-head",
    apply: "build",
    transformIndexHtml: {
      enforce: "pre",
      transform(html: string, ctx) {
        if (buildContext.isRebuild) {
          const key = ctx.path;
          return html.replace(/\<head\>([\s\S]*)\<\/head\>/, (head) => {
            headCache.set(key, head);
            return "<head></head>";
          });
        }
      },
    },
  };
}

function addHead(): Plugin {
  const buildContext = useContext("iso");
  return {
    name: "vite-tinypages-rebuild-add-head",
    apply: "build",
    transformIndexHtml: {
      enforce: "post",
      transform(html: string, ctx) {
        if (buildContext.isRebuild) {
          const key = ctx.path;
          return html.replace("<head></head>", headCache.get(key) ?? "");
        }
      },
    },
  };
}

export const RebuildPlugin = () => [stripHead(), addHead()];
