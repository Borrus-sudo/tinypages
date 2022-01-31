import { loadConfig } from "unconfig";
import { mergeConfig } from "vite";
import type { TinyPagesConfig } from "../types";
import { presetCompilerConfig, presetViteConfig } from "./constants";

export async function resolveConfig(
  cliViteConfig
): Promise<{ config: TinyPagesConfig; filePath: string }> {
  let { config, sources } = await loadConfig<TinyPagesConfig>({
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
    };
  } else {
    config.vite = mergeConfig(
      presetViteConfig,
      mergeConfig(config.vite, cliViteConfig)
    );
  }
  return { config, filePath: sources[0] };
}
