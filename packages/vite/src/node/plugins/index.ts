import UnoCSSPlugin from "@unocss/vite";
import { useContext } from "../context";
import IconPlugin from "./icons";
import HmrPlugin from "./jsxHmr";
import DataFetchPlugin from "./ssrFetch";
import MarkdownPlugin from "./markdown";

export async function createPlugins() {
  const { config } = useContext();
  return [
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "dist-chunk",
      ...(config.compiler.unocss || {}),
    }),
    MarkdownPlugin(),
    IconPlugin(),
    DataFetchPlugin(),
    await HmrPlugin(),
  ];
}
