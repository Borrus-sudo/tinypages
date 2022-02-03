import { promises as fs } from "fs";
import hasher from "node-object-hash";
import Helmet from "preact-helmet";
import { ModuleNode, normalizePath, type Plugin } from "vite";
import { Bridge, ResolvedConfig } from "../../types";

const hashIt = hasher({ sort: false, coerce: true });
const isParentJSX = (node: ModuleNode, bridge: Bridge) => {
  for (let module of node.importedModules) {
    if (
      (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) &&
      bridge.sources.includes(module.file)
    ) {
      return true;
    }
    if (isParentJSX(module, bridge)) {
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
  const reload = (file, ctx) => {
    utils.logger.info(`Page reload ${file}`, {
      timestamp: true,
    });
    ctx.server.ws.send({
      type: "custom",
      event: "reload:page",
    });
  };
  return {
    name: "vite-tinypages-hmr",
    async handleHotUpdate(ctx) {
      for (let module of ctx.modules) {
        if (module.file === normalizePath(bridge.configFile)) {
          reload(module.file, ctx);
          break;
        } else if (module.file === normalizePath(bridge.currentUrl)) {
          let [html, meta] = await utils.compile(
            await fs.readFile(bridge.currentUrl, { encoding: "utf-8" })
          );
          const newHash = hashIt.hash({ components: meta.components });

          // no change in component signature in markdown
          if (newHash === bridge.prevHash) {
            // rerender the new changes, this will be fast as the components are cached
            [html, meta] = await utils.render(html, meta, bridge.pageCtx);
            html = appendPrelude(html, meta.headTags, meta.styles);
            ctx.server.ws.send({
              type: "custom",
              event: "new:document",
              data: html,
            });
          } else {
            // change in component signature, reload the file. Cached ssr components will still be used
            reload(module.file, ctx);
            break;
          }
        } else {
          if (bridge.sources.includes(module.file)) {
            // invalidate the file and reload, so in the next reload, compileMarkdown cached values are used and cached ssr components
            // other than module.file are utilized
            utils.invalidate(module.file);
            reload(module.file, ctx);
            break;
          } else if (isParentJSX(module, bridge)) {
            reload(module.file, ctx);
            break;
          }
        }
      }
      return [];
    },
  };
}
