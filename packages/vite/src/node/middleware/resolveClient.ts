import type { ViteDevServer } from "vite";

export default function (vite: ViteDevServer) {
  return async (req, res, next) => {
    if (req.originalUrl === "/@tinypages/client") {
      const result = await vite.transformRequest("tinypages/client");
      res
        .status(200)
        .set({ "Content-type": "text/javascript" })
        .end(result.code);
    } else if (
      !req.originalUrl.endsWith("/") &&
      !req.originalUrl.endsWith(".md")
    ) {
      next(new Error(`<h1> 404 ${req.originalUrl} not found </h1>`));
    } else {
      await next();
    }
  };
}
