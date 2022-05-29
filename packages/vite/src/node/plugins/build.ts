import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import IconPlugin from "./isomorphic/icons";
import MarkdownBuildPlugin from "./build/markdown-build";

export async function createBuildPlugins() {
  const { config } = useContext("iso");
  return [
    MarkdownBuildPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...(config.modules.unocss || {}),
    }),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    IconPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
  ];
}
