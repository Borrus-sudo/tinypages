import { promises as fs } from "fs";
import { InlineConfig, ViteDevServer } from "vite";
import type { Bridge, cascadeContext } from "../../types";
import { compileMarkdown } from "../compile";
import { fsRouter } from "../router/fs";

function appendPrelude(content: string, headTags, styles: string) {
  return String.raw`<!DOCTYPE html><html><head>${headTags.join(
    "\n"
  )}<style>${styles}</style></head><body>${content}</body></html>`;
}

export default async function (
  vite: ViteDevServer,
  config: InlineConfig,
  bridge: Bridge
) {
  const router = await fsRouter(config.root);
  const watchedUrls = [];
  return async (req, res, next) => {
    try {
      console.log(req.originalUrl);
      const pageCtx = router(req.originalUrl);
      if (pageCtx.url === "404") {
        next(new Error(`404 ${req.originalUrl} not found`));
        return;
      }
      const markdown = await fs.readFile(pageCtx.url, "utf-8");
      let [html, meta] = await compileMarkdown(markdown); // convert tinypages styled markdown to html
      bridge.currentUrl = pageCtx.url;
      bridge.pageCtx = pageCtx;
      if (!watchedUrls.includes(pageCtx.url)) {
        vite.watcher.add(pageCtx.url);
        watchedUrls.push(pageCtx.url);
      }
      html = await vite.transformIndexHtml(pageCtx.url, html); // vite transformed html
      let render = (
        await vite.ssrLoadModule(
          require.resolve("tinypages/entry-server").replace(".js", ".mjs")
        )
      ).default;
      // The meta object shall reflect changes as it is pass by reference
      let appHtml = await render({
        html,
        meta,
        root: config.root,
        pageCtx,
        vite: vite as ViteDevServer,
        compile: compileMarkdown,
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
