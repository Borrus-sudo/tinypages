import { promises as fs } from "fs";
import { useContext, useVite } from "../context";
import { fsRouter } from "../router/fs";
import { normalizeUrl } from "../utils";

export default async function () {
  const { page, utils } = useContext();
  const vite = useVite();
  const router = await fsRouter(utils.pageDir);

  return async (req, res, next) => {
    try {
      const url = normalizeUrl(req.originalUrl);
      const pageCtx = router(url.replace(/\.md$/, ""), req.originalUrl);
      if (!/\.md$/.test(pageCtx.url)) {
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
        if (pageCtx.url === "404") {
          if (!url.endsWith("404.md")) {
            utils.logger.info(`404 not found ${req.originalUrl}`, {
              timestamp: true,
            });
            res.redirect("/404.md");
          } else {
            res.send(`<h1> 404 url not found </h1>`);
          }
        } else {
          utils.logger.info(req.originalUrl, { timestamp: true });
          page.pageCtx = pageCtx;
          global.pageCtx = pageCtx; // globally assign pageCtx
          const markdown = await fs.readFile(pageCtx.url, "utf-8");
          const html = await vite.transformIndexHtml(pageCtx.url, markdown); // vite transformed html
          res.status(200).set({ "Content-type": "text/html" }).end(html);
        }
      }
    } catch (err) {
      next(err);
    }
  };
}
