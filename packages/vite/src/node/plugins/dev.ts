import PrefreshPlugin from "@prefresh/vite";
import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import InspectPlugin from "vite-plugin-inspect";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import DecoratorPlugin from "./dev/sub-island-hydration";
import HmrPlugin from "./dev/hmr";
import MarkdownPlugin from "./dev/markdown-dev";
import SvgResolverPlugin from "./isomorphic/svg-resolver";
import LazyDecoratorPlugin from "./isomorphic/lazy-decorator";

export async function createDevPlugins() {
  const { config } = useContext("dev");
  return [
    InspectPlugin(),
    MarkdownPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...config.defaultModulesConfig.unocss,
    }),
    SvgResolverPlugin(),
    ImagePlugin(
      config.defaultModulesConfig.image.presets,
      config.defaultModulesConfig.image.options
    ),
    LazyDecoratorPlugin(),
    DecoratorPlugin(),
    HmrPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
    // PrefreshPlugin(),
  ];
}
