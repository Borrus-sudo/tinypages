import UnoCSSPlugin from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import ImagePlugin from "vite-plugin-image-presets";
import { useContext } from "../context";
import AutoImportPluginOptions from "./isomorphic/auto-import";
import DecoratorPlugin from "./dev/decorators";
import IconPlugin from "./isomorphic/icons";

export async function createBuildPlugins() {
  const { config } = useContext("iso");
  return [
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...(config.modules.unocss || {}),
    }),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    DecoratorPlugin(),
    IconPlugin(),
    AutoImport(AutoImportPluginOptions(config.vite.root)),
  ];
}
