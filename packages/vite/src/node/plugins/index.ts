import PrefreshPlugin from "@prefresh/vite";
import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import InspectPlugin from "vite-plugin-inspect";
import { useContext } from "../context";
import AutoImportPluginOptions from "./auto-import";
import DecoratorPlugin from "./decorators";
import IconPlugin from "./icons";
import HmrPlugin from "./hmr";
import MarkdownPlugin from "./markdown";

export async function createPlugins() {
  const { config } = useContext();
  return [
    InspectPlugin(),
    MarkdownPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...(config.modules.unocss || {}),
    }),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    DecoratorPlugin(),
    IconPlugin(),
    HmrPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
    PrefreshPlugin(),
  ];
}
