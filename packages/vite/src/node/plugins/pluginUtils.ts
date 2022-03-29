import * as path from "path";
import type { Logger, ModuleNode, ViteDevServer } from "vite";
import { normalizePath as viteNormalizePath } from "vite";
import type { ComponentRegistration, Page } from "../../types/types";

export { hash } from "ohash";
export const isParentJSX = (node: ModuleNode, page: Page) => {
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
};

export const reload = (file: string, server: ViteDevServer, logger: Logger) => {
  logger.info(`Page reload: ${file}`, {
    timestamp: true,
  });
  server.moduleGraph.invalidateAll();
  server.ws.send({
    type: "custom",
    event: "reload:page",
  });
};

export const generateVirtualEntryPoint = (
  components: ComponentRegistration,
  root: string,
  isBuild: boolean
) => {
  const importMap: Map<string, string> = new Map();
  const resolve = (p: string) => viteNormalizePath(path.relative(root, p));
  let usesLazy = false;
  const imports = Object.keys(components).map((uid: string, idx) => {
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
  if (!isBuild) {
    imports.unshift(`import "preact/debug"`);
  }
  imports.push(
    `import ${usesLazy ? "{hydrate,lazy}" : "hydrate"} from "tinypages/client";`
  );
  imports.push(`import "uno.css";`);

  const moduleMapStr = Object.keys(components)
    .map((uid: string) => {
      const left = `'${uid}'`;

      const right = components[uid].lazy
        ? `lazy(()=>import("${resolve(components[uid].path)}"))`
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
};
