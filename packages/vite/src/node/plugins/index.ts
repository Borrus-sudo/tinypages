import type { ResolvedConfig } from "../../types";
import hmr from "./handleHmr";
import ssrFetch from "./ssrFetch";
import unocss from "@unocss/vite";

export async function createPlugins(ctx: ResolvedConfig) {
  return [
    unocss(<{}>{
      inspector: true,
      mode: "dist-chunk",
      ...(ctx.config.compiler.unocss || {}),
    }),
    ssrFetch(ctx),
    await hmr(ctx),
  ];
}
