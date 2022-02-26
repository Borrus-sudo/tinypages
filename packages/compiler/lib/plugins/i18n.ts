import type { Config, Plugin } from "../../types/types";

export function PluginI18n(): Plugin {
  let config: Config;
  return {
    name: "core:i18n",
    defineConfig(_config) {
      config = _config;
    },
    transform() {},
  };
}
