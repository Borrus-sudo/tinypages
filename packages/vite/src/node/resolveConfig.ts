import { createDefu } from "defu";
import { loadConfig } from "unconfig";
import { mergeConfig } from "vite";
import type { TinyPagesConfig, UserTinyPagesConfig } from "../types/types";
import { presetCompilerConfig, presetViteConfig } from "./constants";

export async function resolveConfig(
  cliViteConfig
): Promise<{ config: TinyPagesConfig; filePath: string }> {
  let config;
  let sources = [""];

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

  const ext = createDefu((obj, key, value) => {
    if (key === "vite") {
      //@ts-ignore
      obj[key] =
        typeof obj[key] === "object"
          ? mergeConfig(presetViteConfig, mergeConfig(obj[key], cliViteConfig))
          : value;
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
      icons: {
        defaultIconsStyles: {
          width: "1em",
          height: "1em",
          viewBox: "0 0 24 24",
        },
      },
      unocss: {},
      unlightouse: {},
    },
  });

  config.compiler.icons = config.modules.icons;
  config.compiler.defaultIconsStyles = config.modules.icons.defaultIconsStyles;
  config.compiler.defaultBase64IconsStyles =
    config.modules.icons.defaultIconsStyles;

  return { config, filePath: sources[0] } as {
    config: TinyPagesConfig;
    filePath: string;
  };
}
