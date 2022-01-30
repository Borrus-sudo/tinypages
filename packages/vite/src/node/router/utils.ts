import { promises as fs } from "fs";
import * as path from "path";

export async function loadPaths(dir: string): Promise<string[]> {
  let result: string[] = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  let folderLoadPaths = [];
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      folderLoadPaths.push(loadPaths(path.join(dir, dirent.name)));
    } else {
      result.push(path.join(dir, dirent.name));
    }
  }
  const folderStructures = await Promise.all(folderLoadPaths);
  result.push(...folderStructures.flat());
  return result;
}
