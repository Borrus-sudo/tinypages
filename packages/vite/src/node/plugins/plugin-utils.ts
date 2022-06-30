import * as path from "path";
import type { Logger, ModuleNode, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { ComponentRegistration, Page } from "../../../types/types";

export function isParentJSX(node: ModuleNode, page: Page) {
  for (let module of node.importers) {
    const fileId = path.normalize(module.file);
    if (
      (module.file.endsWith(".jsx") || module.file.endsWith(".tsx")) &&
      page.sources.includes(fileId)
    ) {
      return [true, fileId];
    }
    const res = isParentJSX(module, page);
    if (res[0]) {
      return res;
    }
  }
  return [false, ""];
}

export function reload(file: string, server: ViteDevServer, logger: Logger) {
  logger.info(`Page reload: ${file}`, {
    timestamp: true,
    clear: true,
  });
  server.moduleGraph.invalidateAll();
  server.ws.send({
    type: "custom",
    event: "reload:page",
  });
}

export function generateVirtualEntryPoint(
  components: ComponentRegistration,
  root: string,
  isBuild: boolean
) {
  const importMap: Map<string, string> = new Map();
  const resolve = (p: string) => viteNormalizePath(path.relative(root, p));
  let imports = [
    isBuild ? "" : `import "preact/debug"`,
    isBuild ? "" : `import "uno.css";`,
    `import hydrate from "tinypages/client";`,
    isBuild ? "" : `import "tinypages/hmr";`,
    isBuild ? `import {router} from "million/router"` : "",
  ];
  let compImports = Object.keys(components).map((uid: string, idx) => {
    const mod = components[uid];
    if (!importMap.has(uid)) {
      if (!components[uid].lazy) {
        importMap.set(uid, `comp${idx}`);
        return `import comp${idx} from "/${resolve(mod.path)}";`;
      }
    }
  });

  imports.push(...compImports);

  const moduleMapStr = Object.keys(components)
    .map((uid: string) => {
      const left = `'${uid}'`;
      const right = components[uid].lazy
        ? `import("/${resolve(components[uid].path)}")`
        : importMap.get(uid);

      return `${left}: ${right}`;
    })
    .join(",");

  return `
  ${imports.join("\n")}
  ${isBuild ? "router('body');" : ""}
  (async()=>{
    await hydrate({
     ${moduleMapStr}
    });
  })();
  `;
}

export { hash } from "ohash";
