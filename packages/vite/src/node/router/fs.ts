import { existsSync, promises as fs } from "fs";
import { createRouter } from "radix3";
import type { PageCtx } from "../../types";
import { generateTypes, loadPaths } from "./utils";

let router;
const typesPath = require.resolve("tinypages/types");

const boilerplate = async (pagesDir: string) => {
  router = createRouter();
  const [addType, returnType] = generateTypes();
  await loadPaths(pagesDir, router, pagesDir, addType);
  const newTypes = returnType();
  if (!!newTypes) {
    const prevTypes = await fs.readFile(typesPath, {
      encoding: "utf-8",
    });
    const regex = /\/\*start\*\/[\s\S]*\/\*end\*\//;
    await fs.writeFile(typesPath, prevTypes.replace(regex, newTypes));
  }
};

export async function fsRouter(pagesDir: string) {
  if (existsSync(pagesDir)) {
    await boilerplate(pagesDir);
    return (url: string): PageCtx => {
      const normalizedUrl = url.endsWith("/")
        ? url + "index.md"
        : !/\.(.*?)$/.test(url)
        ? url + ".md"
        : url;
      const result = router.lookup(normalizedUrl);
      if (!!result) {
        return { url: result.payload, params: result.params };
      }
      return { url: "404" };
    };
  }
  return (): PageCtx => ({
    url: "404",
  });
}

export async function refreshRouter(pagesDir: string) {
  await boilerplate(pagesDir);
}
