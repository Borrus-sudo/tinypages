import { promises as fs } from "fs";
import hasher from "node-object-hash";
import Helmet from "preact-helmet";
import { ModuleNode, normalizePath, type Plugin } from "vite";
import { ResolvedConfig } from "../../types";

const hashIt = hasher({ sort: false, coerce: true });
const isParentJSX = (node: ModuleNode) => {
  for (let module of node.importedModules) {
    if (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) {
      return true;
    }
    if (isParentJSX(module)) {
      return true;
    }
  }
  return false;
};
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
  utils,
}: ResolvedConfig): Promise<Plugin> {
  return {
    name: "vite-tinypages-hmr",
    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        if (module.file === normalizePath(bridge.currentUrl)) {
          let [html, meta] = await utils.compile(
            await fs.readFile(bridge.currentUrl, { encoding: "utf-8" })
          );
          const newHash = hashIt.hash({ components: meta.components });
          if (newHash === bridge.prevHash) {
            [html, meta] = await utils.render(html, meta, bridge.pageCtx);
            html = appendPrelude(html, meta.headTags, meta.styles);
            ctx.server.ws.send({
              type: "custom",
              event: "new:document",
              data: html,
            });
          } else {
            utils.logger.info(`Page reload ${module.file}`);
            ctx.server.ws.send({
              type: "custom",
              event: "reload:page",
            });
          }
        } else {
          if (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) {
            utils.invalidate(module.file);
          } else if (isParentJSX(module)) {
            utils.logger.info(`Page reload ${module.file}`);
            ctx.server.ws.send({
              type: "custom",
              event: "reload:page",
            });
          }
        }
      }
      return [];
    },
  };
}
