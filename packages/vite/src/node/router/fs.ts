import { existsSync } from "fs";
import * as path from "path";
import { loadPaths } from "./utils";
import { createRouter } from "radix3";

export async function fsRouter(root: string) {
  const fsPath = path.join(root, "pages");
  if (existsSync(fsPath)) {
    const router = createRouter();
    await loadPaths(router, fsPath);
    return (url: string): Record<string, string> => {
      const normalizedUrl = url.endsWith("/")
        ? url + "index.md"
        : !/\.(.*?)$/.test(url)
        ? url + ".md"
        : url;
      url = path.join(fsPath, normalizedUrl);
      const result = router.lookup(url);
      if (!!result) {
        return { ...result.params };
      }
      return { url: "404" };
    };
  }
  return (): Record<string, string> => ({
    url: "404",
  });
}
