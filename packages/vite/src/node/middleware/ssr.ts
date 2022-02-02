import { promises as fs } from "fs";
import { ViteDevServer } from "vite";
import type { ResolvedConfig } from "../../types";
import { fsRouter } from "../router/fs";
import Helmet from "preact-helmet";
import hasher from "node-object-hash";

const hashIt = hasher({ sort: false, coerce: true });
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

export default async function (
  vite: ViteDevServer,
  { config, bridge, utils }: ResolvedConfig
) {
  const router = await fsRouter(config.vite.root);
  const watchedUrls = [];
  const history: string[] = [];
  return async (req, res, next) => {
    try {
      console.log(utils.logger.info(req.originalUrl, { timestamp: true }));
      const pageCtx = router(req.originalUrl);
      if (pageCtx.url === "404") {
        if (req.originalUrl !== "/404.md") res.redirect("/404.md");
        else res.send(`<h1> 404 url not found </h1>`);
        return;
      }
      history.push(pageCtx.url);
      if (!pageCtx.url.endsWith(".md")) {
        res.send(await fs.readFile(pageCtx.url));
        return;
      }
      if (
        pageCtx.url.endsWith("404.md") &&
        !history[history.length - 2].endsWith(".md")
      ) {
        return;
      }
      const markdown = await fs.readFile(pageCtx.url, "utf-8");
      let [html, meta] = await utils.compile(markdown); // convert tinypages styled markdown to html
      bridge.prevHash = hashIt.hash({ components: meta.components });
      bridge.currentUrl = pageCtx.url;
      bridge.pageCtx = pageCtx;
      if (!watchedUrls.includes(pageCtx.url)) {
        vite.watcher.add(pageCtx.url);
        watchedUrls.push(pageCtx.url);
      }
      html = await vite.transformIndexHtml(pageCtx.url, html); // vite transformed html
      if (!vite.moduleGraph.fileToModulesMap.has(pageCtx.url)) {
        vite.moduleGraph.createFileOnlyEntry(pageCtx.url);
      }
      [html, meta] = await utils.render(html, meta, pageCtx);
      bridge.preservedScriptGlobal = meta.headTags[meta.headTags.length - 1];
      html = appendPrelude(html, meta.headTags, meta.styles);
      res.status(200).set({ "Content-type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
