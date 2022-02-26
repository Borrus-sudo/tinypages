import express from "express";
import { ViteDevServer } from "vite";
import { TinyPagesConfig } from "../types";
import { createContext } from "./createContext";
import { createMiddlewares } from "./middleware";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  const [ctx, vite] = await createContext(config, source);

  const app = express();
  vite.watcher.add(ctx.utils.pageDir);

  if (source) vite.moduleGraph.createFileOnlyEntry(source);
  if ((config.middlewares.pre?.length ?? -1) > 0)
    app.use(config.middlewares.pre);

  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));

  if ((config.middlewares.post?.length ?? -1) > 0)
    app.use(config.middlewares.post);

  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
