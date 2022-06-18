import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import IconPlugin from "./isomorphic/icons";
import MarkdownBuildPlugin from "./build/build-meta";
import SvgResolverPlugin from "./isomorphic/svg-resolver";
import GenConfigPlugin from "./build/gen-config";
import LazyDecoratorPlugin from "./isomorphic/lazy-decorator";

export async function createBuildPlugins() {
  const { config } = useContext("iso");
  return [
    GenConfigPlugin(),
    SvgResolverPlugin(),
    MarkdownBuildPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...config.modules.unocss,
    }),
    IconPlugin(),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    LazyDecoratorPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
  ];
}
