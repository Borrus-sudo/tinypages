import { promises as fs } from "fs";
import { ViteDevServer } from "vite";
import type { cascadeContext, ResolvedConfig } from "../../types";
import { fsRouter } from "../router/fs";

function appendPrelude(content: string, headTags, styles: string) {
  return String.raw`<!DOCTYPE html><html><head>${headTags.join(
    "\n"
  )}<style>${styles}</style></head><body><div id="app">${content}</div></body></html>`;
}

export default async function (
  vite: ViteDevServer,
  { config, bridge, utils }: ResolvedConfig
) {
  const router = await fsRouter(config.vite.root);
  const watchedUrls = [];
  const entryPoint = require
    .resolve("tinypages/entry-server")
    .replace(".js", ".mjs");
  const render = (await vite.ssrLoadModule(entryPoint)).default;
  return async (req, res, next) => {
    try {
      if (req.originalUrl)
        console.log(utils.logger.info(req.originalUrl, { timestamp: true }));
      const pageCtx = router(req.originalUrl);
      if (pageCtx.url === "404") {
        if (req.originalUrl !== "/404.md") res.redirect("/404.md");
        else res.send(`<h1> 404 url not found </h1>`);
        return;
      }
      const markdown = await fs.readFile(pageCtx.url, "utf-8");
      let [html, meta] = await utils.compile(markdown); // convert tinypages styled markdown to html
      bridge.currentUrl = pageCtx.url;
      bridge.pageCtx = pageCtx;
      if (!watchedUrls.includes(pageCtx.url)) {
        vite.watcher.add(pageCtx.url);
        watchedUrls.push(pageCtx.url);
      }
      html = await vite.transformIndexHtml(pageCtx.url, html); // vite transformed html
      // The meta object shall reflect changes as it is pass by reference
      let appHtml = await render({
        html,
        meta,
        root: config.vite.root,
        pageCtx,
        vite: vite as ViteDevServer,
        compile: utils.compile,
      } as cascadeContext);
      bridge.preservedScriptGlobal = meta.headTags[meta.headTags.length - 1];
      appHtml = appendPrelude(appHtml, meta.headTags, meta.styles);
      res.status(200).set({ "Content-type": "text/html" }).end(appHtml);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
