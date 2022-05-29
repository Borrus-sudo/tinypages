import type { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const { virtualModuleMap } = useContext("iso");
  return {
    name: "vite-tinypages-icons",
    enforce: "pre",
    apply: "build",
    resolveId(id: string) {
      return virtualModuleMap.has(id) ? id : undefined;
    },
    load(id: string) {
      return virtualModuleMap.get(id);
    },
  };
}
