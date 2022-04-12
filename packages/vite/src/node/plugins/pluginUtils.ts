import { existsSync } from "fs";
import * as path from "path";
import type { Logger, ModuleNode, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { ComponentRegistration, Page } from "../../types/types";

export function isParentJSX(node: ModuleNode, page: Page) {
  for (let module of node.importedModules) {
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
  let usesLazy = false;
  let hasLazyComponent = false;
  let imports = [
    isBuild ? "" : `import "preact/debug"`,
    `import "uno.css";`,
    `import hydrate from "tinypages/client";`,
  ];
  let compImports = Object.keys(components).map((uid: string, idx) => {
    const mod = components[uid];
    if (components[uid].lazy) {
      usesLazy = true;
    }
    if (!importMap.has(uid)) {
      if (!components[uid].lazy) {
        importMap.set(uid, `comp${idx}`);
        return `import comp${idx} from "/${resolve(mod.path)}";`;
      }
    }
  });
  if (usesLazy) {
    imports.push(`import {lazy,Suspense} from "preact/compat"`);
    if (existsSync(path.join(root, "components/Loading.jsx"))) {
      hasLazyComponent = true;
      imports.push(`import Loading from "/components/Loading.jsx";`);
    }
  }
  imports.push(...compImports);

  const moduleMapStr = Object.keys(components)
    .map((uid: string) => {
      const left = `'${uid}'`;
      if (components[uid].lazy) {
        imports.push(
          `const CompLazy${uid}=lazy(()=>import("${resolve(
            components[uid].path
          )}"))`
        );
      }
      const right = components[uid].lazy
        ? `<Suspense fallback={${
            hasLazyComponent ? "<Loading/>" : "<div>Loading ...</div>"
          }}><CompLazy${uid}/></Suspense>`
        : importMap.get(uid);

      return `${left}: ${right}`;
    })
    .join(",");

  return `
  ${imports.join("\n")}
  (async()=>{
    await hydrate({
     ${moduleMapStr}
    });
  })();
  `;
}

export { hash } from "ohash";
