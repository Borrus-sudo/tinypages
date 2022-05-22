import express from "express";
import { type ViteDevServer, normalizePath as viteNormalizePath } from "vite";
import type { TinyPagesConfig } from "../types/types";
import { createContext } from "./context";
import { createMiddlewares } from "./middleware";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  const [ctx, vite] = await createContext(config, source);
  const app = express();

  vite.watcher.add(viteNormalizePath(ctx.utils.pageDir));
  // if the config file is reloaded, the users need to manually restart now

  if ((config.middlewares.pre?.length ?? -1) > 0)
    app.use(config.middlewares.pre);

  app.use(vite.middlewares);
  app.use(await createMiddlewares());

  if ((config.middlewares.post?.length ?? -1) > 0)
    app.use(config.middlewares.post);

  app.listen(3003, () => {
    ctx.utils.consola.info("Server running at http://localhost:3003");
  });
  return vite;
}
