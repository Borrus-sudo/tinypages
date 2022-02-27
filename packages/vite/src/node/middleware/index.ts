import express from "express";
import { ViteDevServer } from "vite";
import errorMiddleware from "./error";
import ssrMiddleware from "./ssr";

export async function createMiddlewares(vite: ViteDevServer) {
  const router = express.Router();
  router.use(await ssrMiddleware(vite));
  router.use(errorMiddleware());
  return router;
}
