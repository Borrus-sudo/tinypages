import type { Plugin } from "vite";
import { useContext } from "../../context";

/**
 * ----------------------------------------------------------------------------------------------------------------------
 * Build optimizations(1) for tinypages.
 * - By default preact + tinypages + million code will be put in a vendor chunk.
 * - Commomly used components (used > 3 unique pages) will be auto split into new chunks.
 * - The initial base bundle may be optimized by directly loading preact,million from cdn for extremely small page build
 *   - Heuristics for finding a small page build:
 *       - For each page, sum of individual tld component's tree depth is less than a certain threshold. (not very accurate)
 *       - No. of unique pages < certain threshold (5 atm)
 * ----------------------------------------------------------------------------------------------------------------------
 * ----------------
 * --- UNIQUE PAGE : A dynamic file path links to multiple urls, hence multiple output files. But the unique page count
 *                   shall increment by one even if the dynamic file path links to multiple urls.
 * ---------------
 */
export default function (): Plugin {
  const buildContext = useContext("iso");
  const deps = ["preact", "million/router", "preact/hooks"];
  return {
    name: "vite-tinypages-handle-chunks",
    apply: "build",

    configResolved(config) {
      /**
       * Input and Output options are strictly in control of the framework.
       */
      const rollup = config.build.rollupOptions;
      rollup.output = {
        chunkFileNames: "[name].js",
        entryFileNames: "[name].js",
      };
      rollup.output.manualChunks = (chunk) => {
        if (chunk.includes("node_modules")) {
          return "vendor";
        }
      };
    },
    resolveId(id: string) {
      return deps.includes(id) && buildContext.isSmallPageBuild ? id : "";
    },
    load(id: string) {
      if (!deps.includes(id) || !buildContext.isSmallPageBuild) {
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
