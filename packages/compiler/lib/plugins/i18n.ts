import type { Config, Plugin } from "../types";

export function PluginI18n(): Plugin {
  let config: Config;
  return {
    defineConfig(_config) {
      config = _config;
    },
    transform() {},
  };
}
