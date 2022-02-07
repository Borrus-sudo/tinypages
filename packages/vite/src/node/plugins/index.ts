import type { ResolvedConfig } from "../../types";
import hmr from "./handleHmr";
import ssrFetch from "./ssrFetch";
import unocss from "@unocss/vite";
import IconPlugin from "./icons";

export async function createPlugins(ctx: ResolvedConfig) {
  return [
    unocss(<{}>{
      inspector: true,
      mode: "dist-chunk",
      ...(ctx.config.compiler.unocss || {}),
    }),
    IconPlugin(ctx),
    ssrFetch(ctx),
    await hmr(ctx),
  ];
}
