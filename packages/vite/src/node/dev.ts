import express from "express";
import { promises as fs } from "fs";
import * as path from "path";
import type { InlineConfig, ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { compileMarkdown } from "./compile";
import { presetViteConfig } from "./constants";
import { fsRouter } from "./router/fs";

export async function createDevServer(
  config: InlineConfig
): Promise<ViteDevServer> {
  const app = express();
  const vite = await createServer(mergeConfig(config, presetViteConfig));
  app.use(vite.middlewares);
  app.get("*", async (req, res) => {
    try {
      console.log(req.originalUrl);
      if (!req.originalUrl.endsWith("/") && !req.originalUrl.endsWith(".md"))
        return;
      const url: string = await fsRouter(req.originalUrl, config.root);
      if (url === "404") {
        res.status(404).end("File not found");
      }
      const markdown = await fs.readFile(url, "utf-8");
      let [html, meta] = await compileMarkdown(markdown, true); // convert tinypages styled markdown to html
      html = await vite.transformIndexHtml(url, html); // vite transformed html
      let pathToServer = path.join(__dirname, "./entry-server.mjs");
      let render = (await vite.ssrLoadModule(pathToServer)).default;
      const appHtml = await render({
        html,
        meta,
        root: config.root,
        vite: vite as ViteDevServer,
        compile: compileMarkdown,
      });
      res.status(200).set({ "Content-type": "text/html" }).end(appHtml);
    } catch (e) {
      vite && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });
  app.listen(3003, () => {
    console.log("http://localhost:3000");
  });
  return vite;
}
