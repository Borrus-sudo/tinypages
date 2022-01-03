import type { Config } from "./types";

let config: Config = {};
let head = [];
let shikiInstance = null;
export default {
  returnConfig(): Config {
    return config;
  },
  assignConfig(newConfig: Config) {
    Object.assign(config, newConfig);
  },
  returnShikiInstance(): Config {
    return config;
  },
  assignShikiInstance(newInstance) {
    shikiInstance = newInstance;
  },
  addToHead(newHead) {
    head = [...newHead];
  },
  returnHead() {
    return head;
  },
};
