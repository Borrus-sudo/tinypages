import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import MarkdownBuildPlugin from "./build/build-meta";
import SvgResolverPlugin from "./isomorphic/svg-resolver";
import GenConfigPlugin from "./build/gen-config";
import LazyDecoratorPlugin from "./isomorphic/lazy-decorator";
import Optimization2Plugin from "./build/optimization(2)";
import { RebuildPlugin } from "./build/rebuild";

export async function createBuildPlugins() {
  const { config } = useContext("iso");
  return [
    GenConfigPlugin(),
    MarkdownBuildPlugin(),
    RebuildPlugin(),
    SvgResolverPlugin(),
    Optimization2Plugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...config.modules.unocss,
    }),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    LazyDecoratorPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
  ];
}
