import UnoCSSPlugin from "@unocss/vite";
import { useContext } from "../context";
import IconPlugin from "./icons";
import HmrPlugin from "./jsxHmr";
import MarkdownPlugin from "./markdown";
import DataFetchPlugin from "./ssrFetch";
import InspectPlugin from "vite-plugin-inspect";
import ImagePlugin from "vite-plugin-image-presets";
import PrefreshPlugin from "@prefresh/vite";

export async function createPlugins() {
  const { config } = useContext();
  const plugins = [
    InspectPlugin(),
    DataFetchPlugin(),
    MarkdownPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...(config.modules.unocss || {}),
    }),
    ImagePlugin(config.modules.image.presets, config.modules.image.options),
    IconPlugin(),
    HmrPlugin(),
    PrefreshPlugin(),
  ];
  return plugins;
}
