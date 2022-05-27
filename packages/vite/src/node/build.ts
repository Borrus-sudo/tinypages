import { build as viteBuild } from "vite";
import type { PageCtx, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { normalizeUrl } from "./utils";

export async function build(config: TinyPagesConfig, urls: string[]) {
  const [ctx, vite] = await createBuildContext(config);
  const router = await fsRouter(ctx.utils.pageDir);
  const urlPageCtxMap: Map<string, PageCtx> = new Map();
  const fileToUrlMap: Map<string, Set<string>> = new Map();

  urls.forEach((url) => {
    const normalizedUrl = normalizeUrl(url);
    const res = router(normalizedUrl.replace(/\.md$/, ""), url);
    if (res.url === "404") {
      ctx.utils.consola.error(new Error(`404 ${url} not found`));
    } else {
      urlPageCtxMap.set(url, res);
      if (fileToUrlMap.has(res.url)) {
        fileToUrlMap.set(res.url, fileToUrlMap.get(res.url).add(url));
      }
    }
  });
}
