import PrefreshPlugin from "@prefresh/vite";
import UnoCSSPlugin from "@unocss/vite";
import ImagePlugin from "vite-plugin-image-presets";
import InspectPlugin from "vite-plugin-inspect";
import { useContext } from "../context";
import IconPlugin from "./icons";
import HmrPlugin from "./jsxHmr";
import MarkdownPlugin from "./markdown";
import UnlighthousePlugin from "@unlighthouse/vite";

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
    IconPlugin(),
    HmrPlugin(),
    PrefreshPlugin(),
    UnlighthousePlugin(config.modules.unlighthouse),
  ];
}
