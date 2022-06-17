import type { Plugin } from "vite";
import { useContext } from "../../context";

/**
 * ----------------------------------------------------------------------------------------------------------------------
 * Build optimizations(1) for tinypages.
 * - By default preact + tinypages + million code will be put in a vendor chunk.
 * - Commomly used components (used > 3 unique pages) will be auto split into new chunks.
 * - The initial base bundle may be optimized by directly loading preact,million from cdn for extremely small page build
 *   - Heuristics for finding a small page build:
 *       - For each page, sum of individual tld component's tree multiplied by their source size less than
 *         a certain threshold.
 *       - No. of unique pages < certain threshold (5 atm)
 * ----------------------------------------------------------------------------------------------------------------------
 * ----------------
 * --- UNIQUE PAGE : A dynamic file path links to multiple urls, hence multiple output files. But the unique page count
 *                   shall increment by one even if the dynamic file path links to multiple urls.
 * ---------------
 */
export default function (): Plugin {
  const buildContext = useContext("iso");
  return {
    name: "vite-tinypages-handle-chunks",
    apply: "build",
    config(config) {},
    resolveId(id: string) {
      return id === "preact" ? id : undefined;
    },
  };
}
