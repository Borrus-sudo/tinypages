import hasher from "node-object-hash";
import type { ModuleNode, Logger, ViteDevServer } from "vite";
import type { ComponentRegistration, Page } from "../../types";
import { normalize, relative } from "path";

export const hashIt = hasher({ sort: false, coerce: true });

export const isParentJSX = (node: ModuleNode, page: Page) => {
  for (let module of node.importedModules) {
    const fileId = normalize(module.file);
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
  server.ws.send({
    type: "custom",
    event: "reload:page",
  });
};

export const generateVirtualEntryPoint = (
  components: ComponentRegistration,
  root: string
) => {
  const importMap: Map<string, string> = new Map();
  const imports = Object.keys(components).map((uid: string, idx) => {
    const mod = components[uid];
    if (!importMap.has(uid)) {
      importMap.set(uid, `comp${idx}`);
      return `import comp${idx} from ${relative(root, mod.path)};`;
    }
  });
  imports.push(`import hydrate from "tinypages/client";`);
  imports.push(`import "uno.css"`);
  let code = `
  ${imports.join("\n")}
  (async()=>{
    await hydrate({
     ${Object.keys(components)
       .map((uid: string) => {
         return uid + ":" + importMap.get(uid);
       })
       .join(",")}
    });
  })();
  `;
  return code;
};
