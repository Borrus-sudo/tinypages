import UnoCSSPlugin from "@unocss/vite";
import { useContext } from "../context";
import IconPlugin from "./icons";
import HmrPlugin from "./jsxHmr";
import MarkdownPlugin from "./markdown";
import DataFetchPlugin from "./ssrFetch";
import Inspect from "vite-plugin-inspect";

export async function createPlugins() {
  const { config } = useContext();
  const plugins = [
    Inspect(),
    MarkdownPlugin(),
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "global",
      ...(config.compiler.unocss || {}),
    }),
    IconPlugin(),
    DataFetchPlugin(),
    await HmrPlugin(),
  ];
  return plugins;
}
