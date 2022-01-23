import express from "express";
import type { ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { Bridge, TinyPagesConfig } from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";

export async function createDevServer(
  config: TinyPagesConfig
): Promise<ViteDevServer> {
  const bridge: Bridge = {
    currentUrl: "",
    preservedScriptGlobal: "",
    pageCtx: {},
  };
  const plugins = createPlugins(bridge);
  config.vite = mergeConfig(config.vite, { plugins });
  const app = express();
  const vite = await createServer(config.vite);
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, config, bridge));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
