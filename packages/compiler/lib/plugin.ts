import type { Meta, Plugin } from "../types/types";

export default async function createHandler(
  plugins: Plugin[],
  meta: Meta,
  persistentCache: Map<string, string>
) {
  await Promise.all(
    [...plugins].map((p) => (p.getReady ? p.getReady() : null))
  );
  return {
    methodReturn(info, payload) {
      plugins.forEach((plugin) => {
        payload =
          plugin?.transform(info, payload, { meta, persistentCache }) ??
          payload;
      });
      return payload;
    },
    methodArguments(info, args) {
      plugins.forEach((plugin) => {
        if (plugin.tapArgs) args = plugin.tapArgs(info, [...args]) ?? args;
      });
      return args;
    },
  };
}
