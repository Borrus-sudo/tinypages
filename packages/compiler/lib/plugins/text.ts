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
          /(::(.*?)::)|(`[\s\S]*`)|(:(.*?):)/g,
          (payload: string) => {
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
            } else if (payload.startsWith("```")) {
              const [lang, ...code] = payload.slice(3, -3).split("\n");
              codeTransformer.tapArgs("code", [code.join("\n"), lang]);
              payload = codeTransformer.transform("code", payload) || payload;
            } else if (payload.startsWith("`")) {
              codeTransformer.tapArgs("codespan", [payload.slice(1, -1)]);
              payload =
                codeTransformer.transform("codespan", payload) || payload;
            } else {
              payload = emoji.get(payload);
            }
            return payload;
          }
        );
    },
  };
}
