//@ts-ignore
import express from "express";
import * as fs from "fs";
import * as path from "path";
import { join, dirname } from "path";
import { createServer, type ViteDevServer } from "vite";
import { compileMarkdown } from "./compile";

const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;
export async function createDevServer(root: string) {
  const app = express();
  const vite = await createServer({
    root,
    logLevel: isTest ? "error" : "info",
    server: {
      middlewareMode: "ssr",
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
    esbuild: {
      jsxInject: "import {h,Fragment} from 'preact';",
      jsxFactory: "h",
      jsxFragment: "Fragment",
    },
  });
  const resolve = (p) => path.resolve(root, "pages", p);
  app.use(vite.middlewares);
  app.get("*", async (req, res) => {
    try {
      const url = req.originalUrl;
      const markdown = fs.readFileSync(resolve("index.md"), "utf-8");
      //convert the tinypages flavoured  markdown to html
      let [html, meta] = await compileMarkdown(markdown);
      // vite transformed html
      html = await vite.transformIndexHtml(url, html);
      let pathToServer = new URL(
        join(dirname(import.meta.url), "./entry-server.mjs")
      ).pathname;
      let render = (await vite.ssrLoadModule(pathToServer)).default;
      const appHtml = await render(
        html,
        meta.components,
        root,
        vite as ViteDevServer
      );

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
}
