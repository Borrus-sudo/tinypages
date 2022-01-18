import express from "express";
import type { InlineConfig, ViteDevServer } from "vite";
import { createServer, mergeConfig } from "vite";
import { presetViteConfig } from "./constants";
import { createMiddlewares } from "./middleware";

export async function createDevServer(
  config: InlineConfig
): Promise<ViteDevServer> {
  config = mergeConfig(config, presetViteConfig);
  const app = express();
  const vite = await createServer(config);
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, config));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
