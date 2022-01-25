import { default as compileMarkdown } from "@tinypages/compiler";
import express from "express";
import { createLogger, createServer, mergeConfig, ViteDevServer } from "vite";
import { ResolvedConfig, TinyPagesConfig } from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
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
        return await compileMarkdown(input, config.compiler);
      },
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
    },
  };
  const plugins = await createPlugins(ctx);
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });
  const app = express();
  const vite = await createServer(config.vite);
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
