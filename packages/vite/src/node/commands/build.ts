import { build } from "../build";
import { cleanOptions, reportString, GlobalCLIOptions } from "./common";
import type { BuildOptions } from "vite";
import { resolveConfig } from "../resolve-config";
import path from "path";
import fs from "fs/promises";

export async function buildAction(
  root: string,
  options: BuildOptions & GlobalCLIOptions
) {
  try {
    if (root.startsWith("./")) {
      root = path.join(process.cwd(), root);
    }
    // hijack the configFileOption for tinypages' config system
    const cliViteOptions = {
      root,
      base: options.base,
      mode: options.mode,
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      build: cleanOptions(options),
      config: true,
    };
    await build({
      config: cliViteOptions,
      rebuild: false,
    });
  } catch (e) {
    console.log(reportString);
    console.error(e);
  }
}
