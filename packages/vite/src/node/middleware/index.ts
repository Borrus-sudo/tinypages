import errorMiddleware from "./error";
import routerMiddleware from "./router";

export function createMiddlewares() {
  return [routerMiddleware(), errorMiddleware()];
}
