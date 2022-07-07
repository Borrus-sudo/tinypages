import type { Plugin } from "vite";
import { hash } from "../../utils";

/**
 * Currently the content hash invalidation works using import maps under an experimental flag.
 */

export default function (): Plugin {
  return {
    name: "vite-tinypages-content-hash",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const editThisLater = [];
      const importMap = {
        imports: {},
      };
      for (let chunkKey in bundle) {
        const chunk = bundle[chunkKey];
        if (chunk.fileName.endsWith(".html")) {
          // we need to inject here later sourcemap here.
          editThisLater.push(chunk);
          continue;
        } //@ts-ignore
        const digest = hash(chunk.code || "");
        const extname = chunkKey.slice(chunkKey.lastIndexOf("."));
        chunk.fileName = chunk.fileName.replace(
          extname,
          `.${digest}.${extname}`
        );
        importMap.imports["/" + chunkKey] = chunkKey.replace(
          extname,
          `.${digest}.${extname}`
        );
      }
      editThisLater.forEach((chunk) => {
        chunk.code = chunk?.code.replace(
          "<head>",
          `<head><script type="importmap">${JSON.stringify(importMap)}</script>`
        );
      });
    },
  };
}
