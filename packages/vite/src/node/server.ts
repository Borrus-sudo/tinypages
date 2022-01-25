import express from "express";
import type { ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { Bridge, ResolvedConfig, TinyPagesConfig } from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  const bridge: Bridge = {
    currentUrl: "",
    preservedScriptGlobal: "",
    pageCtx: {},
    sources: [source || ""],
  };
  let ctx: ResolvedConfig = { config, bridge };
  const plugins = await createPlugins(ctx);
  config.vite = mergeConfig(config.vite, { plugins });
  const app = express();
  const vite = await createServer(config.vite);
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
