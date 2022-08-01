import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import MarkdownBuildPlugin from "./build/build-meta";
import SvgResolverPlugin from "./isomorphic/svg-resolver";
import GenConfigPlugin from "./build/gen-config";
import LazyDecoratorPlugin from "./isomorphic/lazy-decorator";
import Optimization1Plugin from "./build/optimization(1)";
import Optimization2Plugin from "./build/optimization(2)";
import SubIslandPartialHydrationPlugin from "./build/sub-island-hydration";
import { RebuildPlugin } from "./build/rebuild";

export async function createBuildPlugins() {
  const { config, isRebuild } = useContext("iso");
  return [
    GenConfigPlugin(),
    MarkdownBuildPlugin(),
    RebuildPlugin(),
    SvgResolverPlugin(),
    Optimization1Plugin(),
    !isRebuild
      ? UnoCSSPlugin(<{}>{
          inspector: false,
          mode: "global",
          ...config.defaultModulesConfig.unocss,
        })
      : null,
    SubIslandPartialHydrationPlugin(),
    ImagePlugin(
      config.defaultModulesConfig.image.presets,
      config.defaultModulesConfig.image.options
    ),
    LazyDecoratorPlugin(),
    config.useExperimentalImportMap ? Optimization2Plugin() : null,
    AutoImport(AutoImportPluginOptions(config.vite.root)),
  ];
}
