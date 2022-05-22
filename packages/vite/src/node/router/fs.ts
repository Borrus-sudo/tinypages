import { existsSync } from "fs";
import { createRouter } from "radix3";
import type { PageCtx } from "../../../types/types";
import { loadPaths } from "./utils";

let router;

async function boilerplate(pagesDir: string) {
  router = createRouter();
  await loadPaths(pagesDir, router, pagesDir);
}

export async function fsRouter(pagesDir: string) {
  if (existsSync(pagesDir)) {
    await boilerplate(pagesDir);
    return (url: string): PageCtx => {
      const result = router.lookup(url);
      if (!!result) {
        return { url: result.payload, params: result.params, originalUrl: url };
      }
      return { url: "404", originalUrl: url };
    };
  }
  return (): PageCtx => ({
    url: "404",
    originalUrl: "",
  });
}

export async function refreshRouter(pagesDir: string) {
  await boilerplate(pagesDir);
}
