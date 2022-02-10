import { promises as fs } from "fs";
import * as path from "path";

export async function loadPaths(router, dir: string): Promise<void> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  let folderLoadPaths = [];
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      folderLoadPaths.push(loadPaths(router, path.join(dir, dirent.name)));
    } else {
      router.insert(path.join(dir, dirent.name), {});
    }
  }
  await Promise.all(folderLoadPaths);
}
