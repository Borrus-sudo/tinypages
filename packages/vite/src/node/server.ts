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
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  app.use(createMiddlewares(vite, config));
  return vite;
}
