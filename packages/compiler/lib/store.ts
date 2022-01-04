import type { Config } from "./types";

let config: Config = {};
let head = [];
let shikiInstance = {};
export default {
  returnConfig(): Config {
    return config;
  },
  assignConfig(newConfig: Config) {
    Object.assign(config, newConfig);
    if (config.headTags) head.push(...config.headTags);
  },
  returnShikiInstance() {
    return shikiInstance;
  },
  assignShikiInstance(newInstance) {
    Object.assign(shikiInstance, newInstance);
  },
  addToHead(newHead) {
    head.push(newHead);
  },
  returnHead() {
    return head;
  },
};
