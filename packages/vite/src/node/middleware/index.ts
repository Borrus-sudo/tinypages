import express from "express";
import errorMiddleware from "./error";
import routerMiddleware from "./router";
import unlighthouseMiddleware from "./unlighthouse";

export function createMiddlewares() {
  const router = express.Router();

  router.use(unlighthouseMiddleware());
  router.use(routerMiddleware());
  router.use(errorMiddleware());

  return router;
}
