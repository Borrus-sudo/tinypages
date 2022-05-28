import { createRouter } from "radix3";
import type { PageCtx } from "../../../types/types";
import { loadPaths } from "./utils";

let router;

async function boilerplate(pagesDir: string) {
  router = createRouter();
  await loadPaths(pagesDir, router, pagesDir);
}

export async function fsRouter(pagesDir: string) {
  await boilerplate(pagesDir);
  return (url: string, originalUrl: string): PageCtx => {
    const result = router.lookup(url);
    if (!!result) {
      return { url: result.payload, params: result.params, originalUrl };
    }
    return { url: "404", originalUrl, params: {} };
  };
}

export async function refreshRouter(pagesDir: string) {
  await boilerplate(pagesDir);
}
