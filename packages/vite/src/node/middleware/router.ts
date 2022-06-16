import { promises as fs } from "fs";
import { useContext, useVite } from "../context";
import { fsRouter } from "../router/fs";
import { normalizeUrl } from "../utils";
import { loadPage } from "../render/load-page";

export default function () {
  const { page, utils } = useContext("dev");
  const vite = useVite();
  const router = fsRouter(utils.pageDir);

  return async (req, res, next) => {
    try {
      const url = normalizeUrl(req.originalUrl);
      const pageCtx = router(url.replace(/\.md$/, ""), req.originalUrl);

      if (!/\.md$/.test(url)) {
        if (pageCtx.url === "404") {
          utils.logger.info(`404 not found ${req.originalUrl}`, {
            timestamp: true,
          });
          res.sendStatus(404);
        } else {
          utils.logger.info(req.originalUrl, { timestamp: true });
          res.send(await fs.readFile(pageCtx.url, { encoding: "utf-8" }));
        }
      } else {
        res.set("Cache-Control", "no-store"); // so that hmr works
        if (pageCtx.url === "404") {
          res.send(`<h1> 404 url not found </h1>`);
        } else {
          utils.logger.info(req.originalUrl, { timestamp: true });
          page.pageCtx = pageCtx;
          page.reloads = [];
          const markdown = await loadPage(pageCtx.url, page, false);
          const html = await vite.transformIndexHtml(pageCtx.url, markdown); // vite transformed html
          res.status(200).set({ "Content-type": "text/html" }).end(html);
        }
      }
    } catch (err) {
      next(err);
    }
  };
}
