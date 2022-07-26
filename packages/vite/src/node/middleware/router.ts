import { promises as fs, existsSync } from "fs";
import { useContext, useVite } from "../context";
import { fsRouter } from "../router/fs";
import { loadPage } from "../render/load-page";
import path from "path";

export default function () {
  const { page, utils } = useContext("dev");
  const vite = useVite();
  const [routerQuery] = fsRouter(utils.pageDir);

  return async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const pageCtx = routerQuery(url);
      if (
        existsSync(path.join(utils.pageDir, url)) &&
        (url.endsWith(".ico") || pageCtx.filePath === "404")
      ) {
        utils.logger.info(req.originalUrl, { timestamp: true });
        res.end(await fs.readFile(pageCtx.filePath, { encoding: "utf-8" }));
        return;
      }
      if (pageCtx.filePath === "404") {
        res
          .writeHead(404, {
            "Cache-control": "no-store",
          })
          .end(`<h1> 404 url not found </h1>`); // so that hmr works
      } else {
        utils.logger.info(req.originalUrl, { timestamp: true });
        page.pageCtx = pageCtx;
        page.reloads = [];

        const markdown = await loadPage(pageCtx.filePath, page, false);
        const html = await vite.transformIndexHtml(pageCtx.filePath, markdown); // vite transformed html
        res
          .writeHead(200, {
            "Cache-control": "no-store",
            "Content-type": "text/html",
          })
          .end(html);
      }
    } catch (err) {
      next(err);
    }
  };
}
