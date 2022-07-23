import { readdirSync } from "fs";
import path from "path";

interface Node {
  path: string;
  children: Record<string, Node> | { type: "deadend" };
  template?: string;
}

type AST = Record<string, Node>;
type CacheInfo = {
  fallback: string;
  dynamicFiles: { name: string; isDir: boolean }[];
};

interface QueryReturnType {
  filePath: string;
  template: string;
  params: Record<string, string>;
}

function stripExtension(i: string) {
  return i.slice(0, i.indexOf("."));
}

export class Radix {
  private baseDir: string;
  private ast: AST = {};
  private cache: Map<number, CacheInfo> = new Map();
  private collectLoaders: string[] = [];
  private topLevelFallBack: string = "";
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
      dynamicFiles: [],
    };
    for (let dirent of dirents) {
      if (!/\..*?$/.test(dirent)) {
        isDir = true;
        // this is a folder
        const folderPath = path.join(givenDir, dirent);
        if (dirent.startsWith("__")) {
          this.loadPaths(folderPath, parentDirent, ++nestedDep);
        } else {
          const folderAst: AST = {};
          this.loadPaths(folderPath, folderAst, ++nestedDep);
          parentDirent[dirent] = {
            path: folderPath,
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
              path: path.join(givenDir, dirent),
              children: {},
            };
            parentToSub = parentToSub[subDirent].children as AST;
          }
        } else {
          const strippedEdition = stripExtension(dirent);
          if (parentDirent[strippedEdition]) {
            parentDirent[strippedEdition].template = path.join(
              givenDir,
              dirent
            );
          } else {
            parentDirent[strippedEdition] = {
              path: path.join(givenDir, dirent),
              children: {
                type: "deadend",
              },
            };
          }
        }
      } else if (dirent.endsWith(".ts") || dirent.endsWith(".js")) {
        this.collectLoaders.push(path.join(givenDir, dirent));
        continue;
      }
      if (dirent.startsWith("404") || dirent.startsWith("[...")) {
        /**
         * Fallbacks can't be folders
         */
        toCache.fallback = path.join(givenDir, dirent);
        if (nestedDep === 1) {
          this.topLevelFallBack = toCache.fallback;
        }
      } else if (dirent.startsWith("$")) {
        toCache.dynamicFiles.push({
          name: isDir ? dirent : stripExtension(dirent),
          isDir,
        });
      }
      if (toCache.fallback || toCache.dynamicFiles.length > 0) {
        this.cache.set(nestedDep, toCache);
      }
    }
  }
  query(url: string): QueryReturnType {
    url = url.endsWith("/") ? url + "index" : url;
    const segments = url.split("/").slice(1);
    const params = {};
    let dep = 1;
    let parent = this.ast;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let thisNode = parent[segment];
      if (!thisNode) {
        const { dynamicFiles } = this.cache.get(dep);
        dynamicFiles.forEach(({ isDir, name }) => {
          if (i === segments.length - 1) {
            if (!isDir) {
              thisNode = parent[name];
              params[name.slice(1)] = segment;
            }
          } else {
            if (isDir) {
              thisNode = parent[name];
              params[name.slice(1)] = segment;
            }
          }
        });
        // fallback case when we wanna access the index file of a dynamic param folder
        if (!thisNode) {
          const possibleDynamicFile = dynamicFiles.pop();
          if (possibleDynamicFile && possibleDynamicFile.isDir) {
            thisNode = parent[possibleDynamicFile.name];
          }
        }
      }
      if (!thisNode) {
        return {
          filePath: this.cache.get(dep)?.fallback || this.topLevelFallBack,
          params,
          template: "",
        };
      }
      if (thisNode.children.type === "deadend") {
        if (i !== segments.length - 1) {
          return {
            filePath: this.cache.get(dep)?.fallback || this.topLevelFallBack,
            params,
            template: "",
          };
        } else {
          return {
            filePath: thisNode.path,
            params,
            template: thisNode.template,
          };
        }
      }
      parent = thisNode.children as AST;
      dep++;
    }
  }
}
