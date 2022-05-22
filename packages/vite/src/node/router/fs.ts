import { existsSync, promises as fs } from "fs";
import { createRequire } from "module";
import { createRouter } from "radix3";
import type { PageCtx } from "../../types/types";
import { generateTypes, loadPaths } from "./utils";

let router;
const require = createRequire(import.meta.url);
const typesPath = require.resolve("tinypages/types");

async function boilerplate(pagesDir: string) {
  router = createRouter();
  const [addType, returnType] = generateTypes();
  await loadPaths(pagesDir, router, pagesDir, addType);
  Promise.resolve().then(async () => {
    const newTypes = returnType();
    if (!!newTypes) {
      const prevTypes = await fs.readFile(typesPath, {
        encoding: "utf-8",
      });
      const regex = /\/\*start\*\/[\s\S]*\/\*end\*\//;
      await fs.writeFile(typesPath, prevTypes.replace(regex, newTypes));
    }
  });
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
