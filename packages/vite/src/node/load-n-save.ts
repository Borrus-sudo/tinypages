import { Cache } from "./swr-cache";
import path from "path";

export async function createCaches(root: string) {
  const islands_cache = new Cache<string, { html: string }>(
    path.join(root, ".tinypages/cache_islands.json")
  );
  const markdown_cache = new Cache<string, string>(
    path.join(root, ".tinypages/cache_markdown.json")
  );
  await Promise.all([markdown_cache.hydrate(), islands_cache.hydrate()]);
  process.on("exit", async () => {
    await Promise.all([markdown_cache.save(), islands_cache.save()]);
  });
  return {
    islands_cache,
    markdown_cache,
  };
}
