import { existsSync } from "fs";
import * as path from "path";
import { loadPaths } from "./utils";

export async function fsRouter(root: string) {
  const fsPath = path.join(root, "pages");
  if (existsSync(fsPath)) {
    const paths = await loadPaths(fsPath);
    return (url: string): Record<string, string> => {
      const slicedUrl = path
        .normalize(
          url.endsWith("/")
            ? url + "index.md"
            : !url.endsWith(".md")
            ? url + ".md"
            : url
        )
        .split(path.sep);
      for (let possiblePath of paths) {
        let idx = 0;
        let matchableString = possiblePath.split(fsPath)[1];
        let score = 0;
        let possiblePageCtx = {
          url: possiblePath,
        };
        for (let segment of matchableString.split(path.sep)) {
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
