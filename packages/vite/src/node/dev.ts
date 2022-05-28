import express from "express";
import { type ViteDevServer, normalizePath as viteNormalizePath } from "vite";
import type { TinyPagesConfig } from "../../types/types";
import { createDevContext } from "./context";
import { createMiddlewares } from "./middleware";
import { createDevPlugins } from "./plugins/dev";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  const [context, vite] = await createDevContext(
    config,
    createDevPlugins,
    source
  );

  const app = express();

  if ((config.middlewares.pre?.length ?? -1) > 0)
    app.use(config.middlewares.pre);

  app.use(vite.middlewares);
  app.use(await createMiddlewares());

  if ((config.middlewares.post?.length ?? -1) > 0)
    app.use(config.middlewares.post);

  app.listen(3003, () => {
    context.utils.consola.info("Server running at http://localhost:3003");
  });

  vite.watcher.add(viteNormalizePath(context.utils.pageDir));

  return vite;
}
