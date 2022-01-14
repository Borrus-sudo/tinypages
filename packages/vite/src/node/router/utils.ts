import { promises as fs, existsSync } from "fs";
import * as path from "path";
export async function loadPaths(dir: string): Promise<string[]> {
  let result: string[] = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      result.push(...(await loadPaths(path.join(dir, dirent.name))));
    } else {
      result.push(path.join(dir, dirent.name));
    }
  }

  return result;
}
