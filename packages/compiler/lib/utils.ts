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

export function Spy(
  target: Object,
  Handler: {
    methodReturn: (key: string | symbol, n: any) => any;
    methodArguments: (key: string | symbol, n: any[]) => any[];
  }
) {
  const proto = Object.getPrototypeOf(target);
  const keys = Reflect.ownKeys(proto);
  const transformed = {};
  keys.forEach((key) => {
    const { value } = Reflect.getOwnPropertyDescriptor(proto, key);
    transformed[key] = function (...n) {
      const args = Handler.methodArguments(key, n);
      const returnVal = value.apply(target, args);
      return Handler.methodReturn(key, returnVal);
    };
  });
  transformed["options"] = target["options"];
  return transformed;
}

export { tags } from "./tags";
