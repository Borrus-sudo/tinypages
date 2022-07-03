import type { Plugin } from "vite";
import { findStaticImports, findDynamicImports } from "mlly";
import { hash } from "../../utils";

function stripImports(code: string) {
  const staticImports = findStaticImports(code);
  staticImports.forEach((importStatement) => {
    code = code.replace(
      code.slice(importStatement.start, importStatement.end),
      ""
    );
  });

  const dynamicImports = findDynamicImports(code);
  dynamicImports.forEach((importStatement) => {
    code = code.replace(
      code.slice(importStatement.start, importStatement.end),
      ""
    );
  });

  return code;
}

export default function (): Plugin {
  return {
    name: "vite-tinypages-content-hash",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      for (let chunkKey in bundle) {
        const chunk = bundle[chunkKey]; //@ts-ignore
        const digest = hash(stripImports(chunk.code || ""));
        chunk.fileName = chunk.fileName.replace(".js", `.${digest}.js`);
      }
    },
  };
}
