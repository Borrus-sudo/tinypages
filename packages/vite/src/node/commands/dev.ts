import { createDevServer } from "../dev";
import { resolveConfig } from "../resolve-config";
import path from "path";
import { cleanOptions, reportString, GlobalCLIOptions } from "./common";
import type { ServerOptions } from "vite";

export async function devAction(
  root: string,
  options: ServerOptions & GlobalCLIOptions
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
      server: cleanOptions(options),
      config: options.config,
    };
    const { config, filePath } = await resolveConfig(cliViteOptions);
    await createDevServer(config, filePath);
  } catch (e) {
    console.log(reportString);
    console.error(e);
  }
}
