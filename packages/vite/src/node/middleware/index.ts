import express from "express";
import errorMiddleware from "./error";
import routerMiddleware from "./router";

export function createMiddlewares() {
  const router = express.Router();
  router.use(routerMiddleware());
  router.use(errorMiddleware());
  return router;
}
