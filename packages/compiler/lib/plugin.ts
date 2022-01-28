import type { Meta, Plugin } from "./types";

export default async function createHandler(plugins: Plugin[], meta: Meta) {
  await Promise.all(
    [...plugins].map((p) => (p.getReady ? p.getReady() : null))
  );
  return {
    methodReturn(info, payload) {
      plugins.forEach((plugin) => {
        payload = plugin.transform(info.propName, payload, meta) || payload;
      });
      return payload;
    },
    methodArguments(info, args) {
      plugins.forEach((plugin) => {
        if (plugin.tapArgs) plugin.tapArgs(info.propName, [...args]);
      });
      return args;
    },
  };
}
