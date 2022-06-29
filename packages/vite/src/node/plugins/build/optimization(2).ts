import type { Plugin } from "vite";
import { useContext } from "../../context";

/**
 * Build optimizations(2) for tinypages.
 * - The optimization is aimed to prevent cascading hash invalidation which is a very prevalent problem for content based
 * sites.
 * - The solution for this is yet to be decided. The first approach is with import maps (low support). The second one is with
 *   PWA but might hurt base JS bundle size more.
 */

export default function (): Plugin {
  const buildContext = useContext("iso");
  return {
    name: "vite-tinypages-content-hash",
    apply: "build",
    generateBundle(_, bundle) {
      console.log(bundle);
    },
  };
}
