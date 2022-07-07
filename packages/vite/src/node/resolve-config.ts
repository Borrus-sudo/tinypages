import { createDefu } from "defu";
import { loadConfig } from "unconfig";
import { mergeConfig } from "vite";
import type { TinyPagesConfig, UserTinyPagesConfig } from "../../types/types";
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
      cwd: cliViteConfig.root,
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
    defaultModulesConfig: {
      image: {},
      icons: {
        defaultIconsStyles: {},
      },
      unocss: {},
    },
    modules: [],
    hostname: "http://localhost:3003/",
    isSmallPageBuild: false,
    useExperimentalImportMap: false,
  });

  config.compiler.icons = config.modules.icons;
  config.compiler.defaultIconsStyles = config.modules.icons.defaultIconsStyles;
  config.vite.base = config.hostname;

  return { config, filePath: sources[0] } as {
    config: TinyPagesConfig;
    filePath: string;
  };
}
