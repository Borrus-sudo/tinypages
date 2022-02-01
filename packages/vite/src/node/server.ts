import compileMarkdown from "@tinypages/compiler";
import express from "express";
import { createLogger, createServer, mergeConfig, ViteDevServer } from "vite";
import {
  Meta,
  RenderFunction,
  ResolvedConfig,
  TinyPagesConfig,
} from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";
import crypto from "crypto";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  let renderFunction: RenderFunction;
  let invalidateFunction: (param: string) => void;
  let cache: Map<string, [string, Meta]> = new Map();
  let md5;
  let ctx: ResolvedConfig = {
    config,
    bridge: {
      currentUrl: "",
      preservedScriptGlobal: "",
      pageCtx: {},
      sources: [source || ""],
    },
    utils: {
      async compile(input: string) {
        md5 = crypto.createHash("md5");
        md5.update(input);
        const hash = md5.digest("hex");
        if (cache.has(hash)) {
          return cache.get(hash);
        }
        const result = await compileMarkdown(input, config.compiler);
        cache.set(hash, result);
        md5.end();
        return result;
      },
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string, meta: Meta, pageCtx: Record<string, string>) {
        return await renderFunction(html, meta, pageCtx);
      },
      invalidate(componentPath: string) {
        invalidateFunction(componentPath);
      },
    },
  };
  const plugins = await createPlugins(ctx);
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });
  const app = express();
  const vite = await createServer(config.vite);
  [renderFunction, invalidateFunction] = (
    await vite.ssrLoadModule(
      require.resolve("tinypages/entry-server").replace(".js", ".mjs")
    )
  ).createRender({
    root: config.vite.root,
    vite,
    compile: async (input: string) => {
      return await compileMarkdown(input, config.compiler);
    },
  });
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
