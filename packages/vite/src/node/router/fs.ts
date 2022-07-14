import type { PageCtx } from "../../../types/types";
import { Radix } from "./radix";

let router: Radix;

function boilerplate(pagesDir: string) {
  router = new Radix(pagesDir);
  router.loadPaths();
}

export function fsRouter(pagesDir: string) {
  boilerplate(pagesDir);
  return (url: string): PageCtx => {
    const result = router.query(url);
    if (result.filePath) {
      return {
        filePath: result.filePath,
        params: result.params,
        originalUrl: url,
      };
    }
    return { filePath: "404", originalUrl: url, params: {} };
  };
}

export function refreshRouter(pagesDir: string) {
  boilerplate(pagesDir);
}
