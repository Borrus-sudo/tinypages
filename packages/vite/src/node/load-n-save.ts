import { Cache } from "./swr-cache";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export async function createCaches(root: string, isBuild: boolean) {
  const cacheFolder = path.join(root, ".tinypages");
  if (!existsSync(cacheFolder)) {
    await fs.mkdir(path.join(root, ".tinypages"));
  }
  const islands_cache = new Cache<string, string>(
    path.join(cacheFolder, "cache_islands.json")
  );
  const markdown_cache = new Cache<string, string>(
    path.join(cacheFolder, ".tinypages/cache_markdown.json")
  );
  await Promise.all([markdown_cache.hydrate(), islands_cache.hydrate()]);
  process.on("exit", () => {
    markdown_cache.save(isBuild);
    islands_cache.save(isBuild);
  });
  return {
    islands_cache,
    markdown_cache,
  };
}
