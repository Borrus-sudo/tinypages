import { promises as fs } from "fs";
import hasher from "node-object-hash";
import { normalizePath, ViteDevServer } from "vite";
import type { ResolvedConfig } from "../../types";
import { fsRouter } from "../router/fs";
import { appendPrelude } from "../utils";

const hashIt = hasher({ sort: false, coerce: true });

export default async function (
  vite: ViteDevServer,
  { bridge, utils }: ResolvedConfig
) {
  const router = await fsRouter(utils.pageDir);
  const watchedUrls = [];
  const history: string[] = [];
  return async (req, res, next) => {
    try {
      console.log(
        utils.logger.info(normalizePath(req.originalUrl), { timestamp: true })
      );
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
      bridge.sources = [];
      if (!watchedUrls.includes(pageCtx.url)) {
        vite.watcher.add(pageCtx.url);
        watchedUrls.push(pageCtx.url);
      }
      const viteScriptTag = `<script type="module" src="/@vite/client"></script>`;
      html = (await vite.transformIndexHtml(pageCtx.url, html)).replace(
        viteScriptTag,
        ""
      ); // vite transformed html
      if (!vite.moduleGraph.fileToModulesMap.has(pageCtx.url)) {
        vite.moduleGraph.createFileOnlyEntry(pageCtx.url);
      }
      [html, meta] = await utils.render(html, meta, pageCtx);
      bridge.preservedScriptGlobal = meta.headTags[meta.headTags.length - 1];
      meta.headTags.push(
        `  
      <script type="module">
      import hydrate from "/@tinypages/client";
      (async()=>{await hydrate();})();
      </script>
     `.trim(),
        viteScriptTag
      );
      html = appendPrelude(html, meta.headTags, meta.styles);
      res.status(200).set({ "Content-type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
