import express from "express";
import type { InlineConfig, ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { Bridge } from "../types";
import { presetViteConfig } from "./constants";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";

export async function createDevServer(
  config: InlineConfig
): Promise<ViteDevServer> {
  const bridge: Bridge = { currentUrl: "", preservedScriptGlobal: "" };
  const plugins = createPlugins(bridge);
  presetViteConfig.plugins = plugins;
  config = mergeConfig(config, presetViteConfig);
  const app = express();
  const vite = await createServer(config);
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, config, bridge));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
