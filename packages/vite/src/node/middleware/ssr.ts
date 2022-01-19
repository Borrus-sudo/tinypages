import { InlineConfig, ViteDevServer, normalizePath } from "vite";
import { compileMarkdown } from "../compile";
import { fsRouter } from "../router/fs";
import { promises as fs } from "fs";
import type { Bridge } from "../../types";

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
      const url: string = normalizePath(router(req.originalUrl));
      if (url === "404") {
        next(new Error(`404 ${req.originalUrl} not found`));
        return;
      }
      const markdown = await fs.readFile(url, "utf-8");
      let [html, meta] = await compileMarkdown(markdown); // convert tinypages styled markdown to html
      bridge.currentUrl = url;
      if (!watchedUrls.includes(url)) {
        console.log("Adding url", url);
        vite.watcher.add(url);
        watchedUrls.push(url);
      }
      html = await vite.transformIndexHtml(url, html); // vite transformed html
      let render = (
        await vite.ssrLoadModule(
          require.resolve("tinypages/entry-server").replace(".js", ".mjs")
        )
      ).default;
      let appHtml = await render({
        html,
        meta,
        root: config.root,
        vite: vite as ViteDevServer,
        compile: compileMarkdown,
      });
      bridge.preservedScriptGlobal = meta.headTags[meta.headTags.length - 1];
      appHtml = appendPrelude(appHtml, meta.headTags, meta.styles);
      res.status(200).set({ "Content-type": "text/html" }).end(appHtml);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
