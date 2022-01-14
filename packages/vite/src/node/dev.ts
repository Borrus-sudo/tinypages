import * as express from "express";
import { promises as fs } from "fs";
import * as path from "path";
import type { InlineConfig, ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { compileMarkdown } from "./compile";
import { presetViteConfig } from "./constants";
import type { cascadeContext } from "../types";

export async function createDevServer(
  config: InlineConfig
): Promise<ViteDevServer> {
  const app = express();
  const vite = await createServer(mergeConfig(config, presetViteConfig));
  app.use(vite.middlewares);
  app.get("*", async (req, res) => {
    try {
      const url = req.originalUrl;
      const markdown = await fs.readFile(
        path.resolve(config.root, "pages", "index.md"),
        "utf-8"
      );
      let [html, meta] = await compileMarkdown(markdown, true); // convert tinypages styled markdown to html
      html = await vite.transformIndexHtml(url, html); // vite transformed html
      let pathToServer = new URL(
        path.join(path.dirname(import.meta.url), "./entry-server.mjs")
      ).pathname;
      let render = (await vite.ssrLoadModule(pathToServer.slice(1))).default;
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
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  });
  return vite;
}
