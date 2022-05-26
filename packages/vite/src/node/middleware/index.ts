import express from "express";
import errorMiddleware from "./error";
import ssrMiddleware from "./ssr";
import redirectMiddleware from "./redirect";

export async function createMiddlewares() {
  const router = express.Router();
  router.use(redirectMiddleware());
  router.use(await ssrMiddleware());
  router.use(errorMiddleware());
  return router;
}
