import type { Logger, ModuleNode, ViteDevServer } from "vite";
import type { Page } from "../../../types/types";
import kleur from "kleur";
import path from "path";

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
  logger.info(kleur.yellow(`Page reload: ${file}`), {
    timestamp: true,
    clear: true,
  });
  server.moduleGraph.invalidateAll();
  server.ws.send({
    type: "custom",
    event: "reload:page",
  });
}

export { hash } from "ohash";
