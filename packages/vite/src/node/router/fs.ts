import { createRouter } from "radix3";
import type { PageCtx } from "../../../types/types";
import { loadPaths } from "./utils";
import { Radix } from "./radix";

let router;

function boilerplate(pagesDir: string) {
  router = createRouter();
  loadPaths(pagesDir, router, pagesDir);
}

export function fsRouter(pagesDir: string) {
  const radix = new Radix(pagesDir);
  radix.loadPaths();
  radix.display();
  boilerplate(pagesDir);
  return (url: string, originalUrl: string): PageCtx => {
    const result = router.lookup(url);
    if (!!result) {
      return { url: result.payload, params: result.params, originalUrl };
    }
    return { url: "404", originalUrl, params: {} };
  };
}

export function normalizeUrl(url: string): string {
  let normalizedUrl = url.endsWith("/")
    ? url + "index.md"
    : /\..*?$/.test(url)
    ? url
    : url + ".md";
  normalizedUrl = normalizedUrl.replace(/\.html$/, ".md");
  const result = router.lookup(normalizedUrl);
  if (!!!result) {
    if (!normalizedUrl.endsWith("index.md")) {
      let newUrlToCheck = normalizedUrl.split(".md")[0] + "/index.md";
      const result = router.lookup(newUrlToCheck);
      if (!!result) {
        return newUrlToCheck;
      }
    }
  }
  return normalizedUrl;
}

export function refreshRouter(pagesDir: string) {
  boilerplate(pagesDir);
}
