import { promises as fs } from "fs";
import { ViteDevServer } from "vite";
import { presetPageConfig } from "../constants";
import { useContext } from "../context";
import { fsRouter } from "../router/fs";
import { deepCopy, normalizeUrl } from "../utils";

export default async function (vite: ViteDevServer) {
  const { page, utils } = useContext();
  const router = await fsRouter(utils.pageDir);
  return async (req, res, next) => {
    try {
      const url = normalizeUrl(req.originalUrl);
      const pageCtx = router(url);
      if (!/\.(md|html)$/.test(url)) {
        if (pageCtx.url === "404") {
          utils.logger.info(`404 not found ${req.originalUrl}`, {
            timestamp: true,
          });
        } else {
          utils.logger.info(req.originalUrl, { timestamp: true });
          res.send(await fs.readFile(pageCtx.url, { encoding: "utf-8" }));
        }
        return;
      } else {
        if (pageCtx.url === "404") {
          if (!url.endsWith("404.md")) {
            utils.logger.info(`404 not found ${req.originalUrl}`, {
              timestamp: true,
            });
            res.redirect("/404.md");
          } else {
            res.send(`<h1> 404 url not found </h1>`);
            page.pageCtx = deepCopy(presetPageConfig.pageCtx);
            page.sources = [];
            page.global = {};
            page.meta = deepCopy(presetPageConfig.meta);
            page.prevHash = "";
          }
          return;
        }
      }
      utils.logger.info(req.originalUrl, { timestamp: true });
      page.pageCtx = pageCtx;
      global.pageCtx = pageCtx; // globally assign pageCtx
      const markdown = await fs.readFile(pageCtx.url, "utf-8");
      const html = await vite.transformIndexHtml(pageCtx.url, markdown); // vite transformed html
      res.status(200).set({ "Content-type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
