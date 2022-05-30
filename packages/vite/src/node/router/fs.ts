import { createRouter } from "radix3";
import type { PageCtx } from "../../../types/types";
import { loadPaths } from "./utils";

let router;

function boilerplate(pagesDir: string) {
  router = createRouter();
  loadPaths(pagesDir, router, pagesDir);
}

export function fsRouter(pagesDir: string) {
  boilerplate(pagesDir);
  return (url: string, originalUrl: string): PageCtx => {
    const result = router.lookup(url);
    if (!!result) {
      return { url: result.payload, params: result.params, originalUrl };
    }
    return { url: "404", originalUrl, params: {} };
  };
}

export function refreshRouter(pagesDir: string) {
  boilerplate(pagesDir);
}
