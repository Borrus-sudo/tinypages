import { promises as fs, existsSync } from "fs";
import { useContext, useVite } from "../context";
import { fsRouter } from "../router/fs";
import { loadPage } from "../render/load-page";
import path from "path";
import kleur from "kleur";

export default function () {
  const { page, utils, config } = useContext("dev");
  const vite = useVite();
  const [routerQuery] = fsRouter(utils.pageDir);

  return async (req, res, next) => {
    try {
      // check if the asset is in the public folder
      const url = req.originalUrl;
      if (
        existsSync(path.join(config.vite.root, "public", url)) &&
        /\..*?$/.test(url)
      ) {
        utils.logger.info(req.originalUrl, { timestamp: true });
        return res.end(
          await fs.readFile(path.join(config.vite.root, "public", url), {
            encoding: "utf-8",
          })
        );
      } else if (!url.endsWith(".html") && /\..*?$/.test(url)) {
        // if it is not, then still don't make .ico and .js ending urls to go through
        utils.logger.warn(kleur.red("URL not found " + url), {
          timestamp: true,
        });
        return res.end("");
      }
      const pageCtx = routerQuery(url);
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
