import cac from "cac";
import { join } from "path";
import * as Vite from "vite";
import type { UserTinyPagesConfig } from "../../types/types";
import { resolveConfig } from "./resolve-config";

interface GlobalCLIOptions {
  "--"?: string[];
  c?: boolean | string;
  config?: boolean;
  base?: string;
  l?: Vite.LogLevel;
  logLevel?: Vite.LogLevel;
  clearScreen?: boolean;
  d?: boolean | string;
  debug?: boolean | string;
  f?: string;
  filter?: string;
  m?: string;
  mode?: string;
}

function cleanOptions<Options extends GlobalCLIOptions>(
  options: Options
): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options };
  delete ret["--"];
  delete ret.c;
  delete ret.config;
  delete ret.base;
  delete ret.l;
  delete ret.logLevel;
  delete ret.clearScreen;
  delete ret.d;
  delete ret.debug;
  delete ret.f;
  delete ret.filter;
  delete ret.m;
  delete ret.mode;
  return ret;
}

const reportString =
  "Internal server error: This is an internal server error. Please report it at: https://github.com/Borrus-sudo/tinypages/issues ";

export function cli() {
  const cli = cac("tinypages");
  cli
    .option("-c, --config", `[boolean] use specified config file`)
    .option("--base <path>", `[string] public base path (default: /)`)
    .option("-l, --logLevel <level>", `[string] info | warn | error | silent`)
    .option(
      "--clearScreen",
      `[boolean] allow/disable clear screen when logging`
    )
    .option("-d, --debug [feat]", `[string | boolean] show debug logs`)
    .option("-f, --filter <filter>", `[string] filter debug logs`)
    .option("-m, --mode <mode>", `[string] set env mode`);

  // dev
  cli
    .command("[root]")
    .alias("dev")
    .alias("serve")
    .alias("start")
    .option("--host [host]", `[string] specify hostname`)
    .option("--port <port>", `[number] specify port`)
    .option("--https", `[boolean] use TLS + HTTP/2`)
    .option("--open [path]", `[boolean | string] open browser on startup`)
    .option("--cors", `[boolean] enable CORS`)
    .option(
      "--strictPort",
      `[boolean] exit if specified port is already in use`
    )
    .option(
      "--force",
      `[boolean] force the optimizer to ignore the cache and re-bundle`
    )
    .action(
      async (
        root: string = process.cwd(),
        options: Vite.ServerOptions & GlobalCLIOptions
      ) => {
        const { createDevServer } = await import("./dev");
        try {
          if (root.startsWith("./")) {
            root = join(process.cwd(), root);
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
          process.exit(1);
        }
      }
    );

  cli
    .command("build [root]", "build for production")
    .option(
      "--target <target>",
      `[string] transpile target (default: 'modules')`
    )
    .option("--outDir <dir>", `[string] output directory (default: dist)`)
    .option(
      "--assetsDir <dir>",
      `[string] directory under outDir to place assets in (default: assets)`
    )
    .option(
      "--assetsInlineLimit <number>",
      `[number] static asset base64 inline threshold in bytes (default: 4096)`
    )
    .option(
      "--ssr [entry]",
      `[string] build specified entry for server-side rendering`
    )
    .option(
      "--sourcemap",
      `[boolean] output source maps for build (default: false)`
    )
    .option(
      "--minify [minifier]",
      `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
        `or specify minifier to use (default: esbuild)`
    )
    .option("--manifest [name]", `[boolean | string] emit build manifest json`)
    .option("--ssrManifest [name]", `[boolean | string] emit ssr manifest json`)
    .option(
      "--force",
      `[boolean] force the optimizer to ignore the cache and re-bundle (experimental)`
    )
    .option(
      "--emptyOutDir",
      `[boolean] force empty outDir when it's outside of root`
    )
    .option(
      "-w, --watch",
      `[boolean] rebuilds when modules have changed on disk`
    )
    .action(
      async (
        root: string = process.cwd(),
        options: Vite.BuildOptions & GlobalCLIOptions
      ) => {
        const { build } = await import("./build");
        try {
          if (root.startsWith("./")) {
            root = join(process.cwd(), root);
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
          const { config } = await resolveConfig(cliViteOptions);
          await build(config, ["/", "/qEWtDHOhuYyafXk6"]);
        } catch (e) {
          console.log(reportString);
          console.error(e);
          process.exit(1);
        }
      }
    );

  cli.command("check").action(() => {});

  cli.help();
  cli.version("1.0.0");
  cli.parse();
}

export function defineConfig(config: UserTinyPagesConfig) {
  return config;
}

export type { Params } from "../../types/params";
export type { UserPageContext } from "../../types/types";
