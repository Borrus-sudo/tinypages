import { normalizePath, type Plugin } from "vite";
import { ResolvedConfig } from "../../types";
import { promises as fs } from "fs";

function appendPrelude(content: string, headTags, styles: string) {
  return String.raw`<!DOCTYPE html><html><head>${headTags.join(
    "\n"
  )}<style>${styles}</style></head><body><div id="app">${content}</div></body></html>`;
}

export default async function ({
  bridge,
  utils: { compile, render },
}: ResolvedConfig): Promise<Plugin> {
  return {
    name: "vite-tinypages-hmr",
    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        if (module.file === normalizePath(bridge.currentUrl)) {
          let [html, meta] = await compile(
            await fs.readFile(bridge.currentUrl, { encoding: "utf-8" })
          );
          [html, meta] = await render(html, meta, bridge.pageCtx);
          html = appendPrelude(html, meta.headTags, meta.styles);
          ctx.server.ws.send({
            type: "custom",
            event: "new:document",
            data: html,
          });
        }
      }
      return [];
    },
  };
}
