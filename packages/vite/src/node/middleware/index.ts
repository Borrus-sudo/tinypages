import express from "express";
import { InlineConfig, ViteDevServer } from "vite";
import errorMiddleware from "./error";
import resolveClientMiddleware from "./resolveClient";
import ssrMiddleware from "./ssr";

export async function createMiddlewares(
  vite: ViteDevServer,
  config: InlineConfig
) {
  const router = express.Router();
  router.use(resolveClientMiddleware(vite));
  router.use(await ssrMiddleware(vite, config));
  router.use(errorMiddleware(config));
  return router;
}
