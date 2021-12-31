import type { Config } from "./types";
let config: Config = {};

export default {
  returnConfig(): Config {
    return config;
  },
  mutateConfig(newConfig: Config) {
    config = Object.assign({}, newConfig);
  },
};
