import { readdirSync } from "fs";
import path from "path";

interface Node {
  name: string;
  children: Record<string, Node> | { type: "deadend" };
}

type AST = Record<string, Node>;
type CacheInfo = {
  fallback: string;
  dynamicParams: { name: string; isDir: boolean }[];
};

export class Radix {
  private baseDir: string;
  private ast: AST = {};
  private cache: Map<number, CacheInfo> = new Map();
  private collectLoaders: string[];
  constructor(_baseDir: string) {
    this.baseDir = _baseDir;
  }
  loadPaths(
    givenDir: string = this.baseDir,
    parentDirent: Record<string, Node> = this.ast,
    nestedDep = 1
  ) {
    const dirents = readdirSync(givenDir);
    let isDir = false;
    const toCache: CacheInfo = {
      fallback: "",
      dynamicParams: [],
    };
    for (let dirent of dirents) {
      if (!/\..*?$/.test(dirent)) {
        isDir = true;
        // this is a folder
        const folderAst: AST = {};
        const folderPath = path.join(givenDir, dirent);
        this.loadPaths(folderPath, folderAst, ++nestedDep);
        if (dirent.startsWith("__")) {
          for (let subDirent in folderAst) {
            parentDirent[subDirent] = folderAst[subDirent];
          }
        } else {
          parentDirent[dirent] = {
            name: folderPath,
            children: folderAst,
          };
        }
      } else if (dirent.endsWith(".md")) {
        isDir = false;
        // we construct the dirent;
        if (dirent.match(/\./g).length > 1) {
          let parentToSub = parentDirent;
          for (let subDirent of dirent.split(".")) {
            if (subDirent === "md") {
              //@ts-ignore
              parentToSub.children = { type: "deadend" };
              break;
            }
            parentToSub[subDirent] = {
              name: path.join(givenDir, dirent),
              children: {},
            };
            parentToSub = parentToSub[subDirent].children as AST;
          }
        } else {
          parentDirent[dirent] = {
            name: path.join(givenDir, dirent),
            children: {
              type: "deadend",
            },
          };
        }
      } else if (dirent.endsWith(".ts") || dirent.endsWith(".js")) {
        this.collectLoaders.push(path.join(givenDir, dirent));
        continue;
      }
      if (dirent.startsWith("404") || dirent.startsWith("[...")) {
        toCache.fallback = dirent;
      } else if (dirent.startsWith("$")) {
        toCache.dynamicParams.push({
          name: dirent,
          isDir,
        });
      }
      if (toCache.fallback || toCache.dynamicParams.length > 0) {
        this.cache.set(nestedDep, toCache);
      }
    }
  }
  display() {
    console.log(this.ast);
  }
  query() {}
}
