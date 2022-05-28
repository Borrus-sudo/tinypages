import { promises as fs } from "fs";
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

export async function loadPaths(
  root: string,
  router,
  dir: string
): Promise<void> {
  const dirents = await fs.readdir(dir);
  const promises = [];
  for (let dirent of dirents) {
    if (!/\..*?/.test(dirent)) {
      promises.push(loadPaths(root, router, path.join(dir, dirent)));
    } else if (/\.md$/.test(dirent)) {
      let filePath = path.join(dir, dirent);
      let url = normalizePath(filePath.split(root)[1]);
      const output = transformDynamicArgs(url);
      router.insert(output, { payload: filePath });
    }
  }
  await Promise.all(promises);
}
