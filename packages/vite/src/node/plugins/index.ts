import UnoCSSPlugin from "@unocss/vite";
import { useContext } from "../createContext";
import IconPlugin from "./icons";
import HmrPlugin from "./jsxHmr";
import DataFetchPlugin from "./ssrFetch";

export async function createPlugins() {
  const { config } = useContext();
  return [
    UnoCSSPlugin(<{}>{
      inspector: true,
      mode: "dist-chunk",
      ...(config.compiler.unocss || {}),
    }),
    IconPlugin(),
    DataFetchPlugin(),
    await HmrPlugin(),
  ];
}
