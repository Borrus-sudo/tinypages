import { readdirSync } from "fs";
import * as path from "path";
import { normalizePath } from "vite";

function transformDynamicArgs(input: string) {
  const output = input
    .replace(/\/\[\.\.\..*\]\..*/g, "/**")
    .replace(/\/\[(.*)\]\//g, "/:$1/")
    .replace(/\/\[(.*)\]\./g, "/:$1.")
    .replace(/\/\_\_.*?\//g, "$1/")
    .replace(/\/404\.md$/, "/**")
    .replace(/\.md$/, "");
  return output;
}

export function loadPaths(root: string, router, dir: string) {
  const dirents = readdirSync(dir);
  for (let dirent of dirents) {
    if (!/\..*?/.test(dirent)) {
      loadPaths(root, router, path.join(dir, dirent));
    } else if (dirent.endsWith(".md")) {
      let filePath = path.join(dir, dirent);
      let url = normalizePath(filePath.split(root)[1]);
      const output = transformDynamicArgs(url);
      router.insert(output, { payload: filePath });
    }
  }
}
