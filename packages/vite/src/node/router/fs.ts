import path from "path";
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

export function normalizeUrl(url: string): string {
  let normalizedUrl = url.endsWith("/")
    ? url + "index.md"
    : /\..*?$/.test(url)
    ? url
    : url + ".md";
  normalizedUrl = normalizedUrl.replace(/\.html$/, ".md");
  const result = router.lookup(normalizedUrl);
  if (!!result) {
    return normalizedUrl;
  } else {
    // time to do some checking.
    let newUrlToCheck;
    if (normalizedUrl.endsWith("index.md")) {
      // if the url is /page/index.md, we check if /page.md exists
      newUrlToCheck = path.dirname(normalizedUrl) + ".md";
    } else {
      // if the url is /page.md, we check if /page/index.md exists.
      newUrlToCheck = normalizedUrl.split(".md")[0] + "/index.md";
    }
    const doesItExist = router.lookup(newUrlToCheck); // if it does, return the new URL
    if (!!doesItExist) {
      return newUrlToCheck;
    }
  }
  return normalizedUrl; //normal fallback situation. 404 handles ahead
}

export function refreshRouter(pagesDir: string) {
  boilerplate(pagesDir);
}
