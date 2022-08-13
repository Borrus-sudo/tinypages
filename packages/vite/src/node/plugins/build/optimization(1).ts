import type { Plugin } from "vite";
import { useContext } from "../../context";

/**
 * ----------------------------------------------------------------------------------------------------------------------
 * Build optimizations(1) for tinypages.
 * - By default preact + tinypages + million code will be put in a vendor chunk.
 * - Commomly used components (used > 3 unique pages) will be auto split into new chunks.
 * - The initial base bundle may be optimized by directly loading preact,million from cdn for extremely small page build
 * - Edit: the user should decided whether the build is a smallPageBuild, for there are no accurate ways of finding that
 *   with code atm.
 */
export default function (): Plugin {
  const buildContext = useContext("iso");
  const deps = ["preact", "million/router", "preact/hooks"];
  return {
    name: "vite-tinypages-handle-chunks",
    apply: "build",
    enforce: "pre",
    configResolved(config) {
      /**
       * Input and Output options are strictly in control of the framework.
       */
      const rollup = config.build.rollupOptions;
      if (buildContext.config.useExperimentalImportMap) {
        rollup.output = {
          chunkFileNames: "[name].js",
          entryFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        };
      } else {
        rollup.output = {};
      }
      rollup.output.manualChunks = (chunk) => {
        if (chunk.includes("node_modules")) {
          return "vendor";
        }
      };
    },
    resolveId(id: string) {
      return deps.includes(id) && buildContext.config.isSmallPageBuild
        ? id
        : undefined;
    },
    load(id: string) {
      if (!deps.includes(id) || !buildContext.config.isSmallPageBuild) {
        return;
      }
      if (id === "preact") {
        return `export * from "https://esm.sh/v86/preact@10.8.2/es2022/preact.js";`;
      } else if (id === "preact/hooks") {
        return `export * from "https://esm.sh/v86/preact@10.8.2/es2022/hooks.js"`;
      } else {
        return `export { router } from 'https://unpkg.com/million/dist/router.mjs';`;
      }
    },
  };
}
