import { existsSync } from "fs";
import * as path from "path";
import { loadPaths } from "./utils";

export async function fsRouter(root: string) {
  const fsPath = path.join(root, "pages");
  if (existsSync(fsPath)) {
    const paths = await loadPaths(fsPath);
    return (url: string): Record<string, string> => {
      const normalizedUrl = url.endsWith("/")
        ? url + "index.md"
        : !/\.(.*?)$/.test(url)
        ? url + ".md"
        : url;
      url = path.join(fsPath, normalizedUrl);
      const slicedUrl = url.split(path.sep);

      for (let possiblePath of paths) {
        let idx = 0;
        let score = 0;
        let possiblePageCtx = {
          url: possiblePath,
        };
        if (url === possiblePath) {
          return possiblePageCtx;
        }
        for (let segment of possiblePath.split(path.sep)) {
          if (segment === slicedUrl[idx]) {
            score++;
          } else if (segment.startsWith("[") && segment.endsWith("]")) {
            possiblePageCtx[segment.slice(1, -1)] = slicedUrl[idx];
            score++;
          }
          idx++;
        }
        if (score === slicedUrl.length) {
          return possiblePageCtx;
        }
      }
      return { url: "404" };
    };
  }
  return (): Record<string, string> => ({
    url: "404",
  });
}
