import { loadConfig } from "unconfig";
import { mergeConfig } from "vite";
import type { TinyPagesConfig, UserTinyPagesConfig } from "../types/types";
import { presetCompilerConfig, presetViteConfig } from "./constants";
const defu = require("defu");

export async function resolveConfig(
  cliViteConfig
): Promise<{ config: TinyPagesConfig; filePath: string }> {
  let config,
    sources = [""];
  if (cliViteConfig.config) {
    let { config: c, sources: s } = await loadConfig<UserTinyPagesConfig>({
      sources: [
        {
          files: "tinypages.config",
          // default extensions
          extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
        },
      ],
    });
    (config = c), (sources = s);
  }
  delete cliViteConfig["config"];

  const ext = defu.extend((obj, key, value) => {
    if (key === "vite") {
      obj[key] =
        typeof obj[key] === "object"
          ? mergeConfig(presetViteConfig, mergeConfig(obj[key], cliViteConfig))
          : value;
      return true;
    } else if (key === "resolveUnoCSS") {
      obj[key] = true;
      return true;
    }
  });

  config = ext(config, {
    compiler: presetCompilerConfig,
    vite: mergeConfig(presetViteConfig, cliViteConfig),
    middlewares: {
      pre: [],
      post: [],
    },
    modules: {
      image: {},
      icons: {},
      unocss: {},
    },
  });
  //@ts-ignore
  config.compiler.icons = config.modules.icons;
  return { config, filePath: sources[0] } as {
    config: TinyPagesConfig;
    filePath: string;
  };
}
