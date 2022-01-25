import type { ResolvedConfig } from "../../types";
import hmr from "./handleHmr";
import injectClient from "./injectClient";
import ssrFetch from "./ssrFetch";

export async function createPlugins(ctx: ResolvedConfig) {
  return [injectClient(), ssrFetch(ctx), await hmr(ctx)];
}
