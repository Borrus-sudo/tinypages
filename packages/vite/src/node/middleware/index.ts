import express from "express";
import { ViteDevServer } from "vite";
import { Bridge, TinyPagesConfig } from "../../types";
import errorMiddleware from "./error";
import resolveClientMiddleware from "./resolveClient";
import ssrMiddleware from "./ssr";

export async function createMiddlewares(
  vite: ViteDevServer,
  config: TinyPagesConfig,
  bridge: Bridge
) {
  const router = express.Router();
  router.use(resolveClientMiddleware(vite));
  router.use(await ssrMiddleware(vite, config, bridge));
  router.use(errorMiddleware(config));
  return router;
}
