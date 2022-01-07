import * as emoji from "node-emoji";
import type { Config, Plugin } from "../types";
import { PluginCode } from "./code";
import iconsRenderer from "./helpers/icons";

export function PluginText(): Plugin {
  let codeTransformer = PluginCode();
  let config: Config;
  return {
    defineConfig(_config) {
      config = _config;
      codeTransformer = PluginCode();
      codeTransformer.defineConfig(config);
    },
    transform(id: string, payload: string) {
      if (id === "text" || id === "html")
        return payload.replace(
          /(::(.*?)::)|(`(.*?)`)|(:(.*?):)/g,
          (payload) => {
            if (
              (payload.includes("<") || payload.includes(">")) &&
              !payload.startsWith("`")
            ) {
              return payload;
            }
            if (payload.startsWith("::")) {
              payload =
                iconsRenderer(payload.slice(2, -2), {
                  config,
                }) || payload;
            } else if (payload.startsWith("`")) {
              let [lang, ...code] = payload.slice(1, -1).split(" ");
              codeTransformer.tapArgs("code", [code.join(" "), lang]);
              payload = codeTransformer.transform("codespan", payload);
            } else {
              payload = emoji.get(payload);
            }
            return payload;
          }
        );
      return payload;
    },
  };
}
