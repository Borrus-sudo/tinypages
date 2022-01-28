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

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  let renderFunction: RenderFunction;
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
      async render(html: string, meta: Meta, pageCtx: Record<string, string>) {
        return await renderFunction(html, meta, pageCtx);
      },
    },
  };
  const plugins = await createPlugins(ctx);
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });
  const app = express();
  const vite = await createServer(config.vite);
  renderFunction = (
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
