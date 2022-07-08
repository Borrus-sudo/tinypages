import type { Plugin } from "vite";
import { useContext } from "../../context";
import { htmlNormalizeURL } from "../../utils";
import path from "path";

export default function (): Plugin {
  const buildContext = useContext("iso");
  return {
    name: "vite-tinypages-gen-config",
    apply: "build",
    config() {
      const input = {};
      buildContext.fileToHtmlMap.forEach((html, { url }) => {
        const normalizedUrl = htmlNormalizeURL(url);
        const resolvedUrl = path.join(
          buildContext.config.vite.root,
          normalizedUrl
        );
        input[normalizedUrl.replace(/\//g, "-").slice(1)] = resolvedUrl;
        buildContext.virtualModuleMap.set(resolvedUrl, html);
      });
      return {
        build: {
          rollupOptions: {
            input,
          },
          target: "es2020",
          emptyOutDir: !buildContext.isRebuild,
        },
      };
    },
  };
}
