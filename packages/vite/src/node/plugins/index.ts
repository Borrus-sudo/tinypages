import ssrFetch from "./ssrFetch";
import injectClient from "./injectClient";
import hmr from "./handleHmr";
import type { Bridge, ResolvedConfig } from "../../types";

export async function createPlugins(ctx: ResolvedConfig) {
  return [injectClient(), ssrFetch(ctx), await hmr(ctx)];
}
