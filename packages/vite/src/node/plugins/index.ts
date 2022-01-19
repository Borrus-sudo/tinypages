import ssrFetch from "./ssrFetch";
import injectClient from "./injectClient";
import hmr from "./handleHmr";
import type { Bridge } from "../../types";

export function createPlugins(bridge: Bridge) {
  return [injectClient(), ssrFetch(), hmr(bridge)];
}
