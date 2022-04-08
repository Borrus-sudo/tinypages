import express from "express";
import errorMiddleware from "./error";
import ssrMiddleware from "./ssr";

export async function createMiddlewares() {
  const router = express.Router();
  router.use(await ssrMiddleware());
  router.use(errorMiddleware());
  return router;
}
