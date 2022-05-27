import express from "express";
import errorMiddleware from "./error";
import ssrMiddleware from "./ssr";
import unlighthouseMiddleware from "./unlighthouse";

export async function createMiddlewares() {
  const router = express.Router();
  router.use(unlighthouseMiddleware());
  router.use(await ssrMiddleware());
  router.use(errorMiddleware());
  return router;
}
