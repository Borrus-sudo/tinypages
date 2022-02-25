import express from "express";
import { ViteDevServer } from "vite";
import type { ResolvedConfig } from "../../types";
import errorMiddleware from "./error";
import resolveClientMiddleware from "./resolveClient";
import ssrMiddleware from "./ssr";

export async function createMiddlewares(
  vite: ViteDevServer,
  ctx: ResolvedConfig
) {
  const router = express.Router();

  router.use(resolveClientMiddleware(vite));
  router.use(await ssrMiddleware(vite, ctx));
  router.use(errorMiddleware(ctx));

  return router;
}
