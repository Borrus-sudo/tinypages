import { InlineConfig, ViteDevServer } from "vite";
import { compileMarkdown } from "../compile";
import { fsRouter } from "../router/fs";
import { promises as fs } from "fs";

function appendPrelude(content: string, headTags, styles: string) {
  return String.raw`<!DOCTYPE html><html><head>${headTags.join(
    "\n"
  )}<style>${styles}</style></head><body>${content}</body></html>`;
}

export default function (vite: ViteDevServer, config: InlineConfig) {
  return async (req, res, next) => {
    try {
      console.log(req.originalUrl);
      const url: string = await fsRouter(req.originalUrl, config.root);
      if (url === "404") {
        next(new Error(`<h1> 404 ${req.originalUrl} not found </h1>`));
        return;
      }
      const markdown = await fs.readFile(url, "utf-8");
      let [html, meta] = await compileMarkdown(markdown); // convert tinypages styled markdown to html
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
      appHtml = appendPrelude(appHtml, meta.headTags, meta.styles);
      res.status(200).set({ "Content-type": "text/html" }).end(appHtml);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
