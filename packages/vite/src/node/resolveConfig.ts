import { loadConfig } from "unconfig";
import { mergeConfig } from "vite";
import type { TinyPagesConfig } from "../types";
import { presetCompilerConfig, presetViteConfig } from "./constants";

export async function resolveConfig(
  cliViteConfig
): Promise<{ config: TinyPagesConfig; filePath: string }> {
  let { config, sources } = await loadConfig<Partial<TinyPagesConfig>>({
    sources: [
      {
        files: "tinypages.config",
        // default extensions
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
      },
    ],
  });
  if (!config) {
    config = {
      compiler: presetCompilerConfig,
      vite: mergeConfig(presetViteConfig, cliViteConfig),
      middlewares: {
        pre: [],
        post: [],
      },
    };
  } else {
    if (!config.compiler) config.compiler = presetCompilerConfig;
    if (!config.middlewares) config.middlewares = { pre: [], post: [] };
    config.vite = mergeConfig(
      presetViteConfig,
      mergeConfig(config.vite || {}, cliViteConfig)
    );
  }
  return { config, filePath: sources[0] } as {
    config: TinyPagesConfig;
    filePath: string;
  };
}
