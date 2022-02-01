import { normalizePath, type Plugin } from "vite";
import { ResolvedConfig } from "../../types";
import { promises as fs } from "fs";
import Helmet from "preact-helmet";

function appendPrelude(content: string, headTags, styles: string) {
  const head = Helmet.rewind();
  const html = String.raw`
    <!doctype html>
    <html ${head.htmlAttributes.toString()}>
        <head>
            ${head.title.toString()}
            ${head.meta.toString()}
            ${head.link.toString()}
            ${headTags.join("\n")}
        </head>
        <style>${styles}</style>
        <body>
            <div id="app">
                ${content}
            </div>
        </body>
    </html>
`;
  return html;
}

export default async function ({
  bridge,
  utils: { compile, render, invalidate },
}: ResolvedConfig): Promise<Plugin> {
  return {
    name: "vite-tinypages-hmr",
    async handleHotUpdate(ctx) {
      let newModules = [];
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
        } else {
          if (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) {
            invalidate(module.file);
          }
          newModules.push(module);
        }
      }
      return newModules;
    },
  };
}
