import { promises as fs } from "fs";
import { normalizePath, ViteDevServer } from "vite";
import { useContext } from "../context";
import { fsRouter } from "../router/fs";

export default async function (vite: ViteDevServer) {
  const { page, utils } = useContext();
  const router = await fsRouter(utils.pageDir);
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
      page.pageCtx = pageCtx;
      const markdown = await fs.readFile(pageCtx.url, "utf-8");
      const html = await vite.transformIndexHtml(pageCtx.url, markdown); // vite transformed html
      res.status(200).set({ "Content-type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err);
      next(err);
    }
  };
}
