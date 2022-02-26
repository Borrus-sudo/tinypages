import type { Meta, Plugin } from "../types/types";

export function wrapObject(styles: Record<string, string>) {
  Object.keys(styles).forEach((key) => {
    styles[key] = `"${styles[key]}"`;
  });
  return styles;
}

export function orderPlugins(corePlugins: Plugin[], userPlugins: Plugin[]) {
  let postPlugins = [];
  userPlugins.flat().forEach((plugin) => {
    if (!plugin.enforce) {
      corePlugins.push(plugin);
    } else if (plugin.enforce === "pre") {
      corePlugins.unshift(plugin);
    } else {
      postPlugins.push(plugin);
    }
  });
  return [...corePlugins, ...postPlugins];
}

export async function postTransform(
  payload: string,
  plugins: Plugin[],
  meta: Meta
) {
  for (let plugin of plugins) {
    if (plugin.postTransform) {
      payload = await plugin.postTransform(payload, meta);
    }
  }
  return payload;
}
