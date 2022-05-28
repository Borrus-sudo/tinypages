import type { Plugin } from "vite";
import { useContext } from "../../context";

export default function (): Plugin {
  const { config, virtualModuleMap, fileToHtmlMap } = useContext("iso");
  return {
    name: "vite-tinypages-icons",
    buildStart() {
      console.log("Build started");
    },
  };
}
