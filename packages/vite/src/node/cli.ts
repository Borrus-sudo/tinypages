import cac from "cac";
import { join } from "path";
import * as Colors from "picocolors";
import * as Vite from "vite";
import { TinyPagesConfig } from "../types";
import { resolveConfig } from "./resolveConfig";

interface GlobalCLIOptions {
  "--"?: string[];
  c?: boolean | string;
  config?: string;
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

export function cli() {
  console.log(
    Colors.cyan(`tinypages ${require("../../package.json").version}`)
  );
  const cli = cac("tinypages");
  cli
    .option("-c, --config <file>", `[string] use specified config file`)
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
        try {
          const { createDevServer } = require(require
            .resolve("tinypages/server")
            .replace(".js", ".mjs"));
          if (root.startsWith(".")) {
            root = join(process.cwd(), root);
          }
          // never give configFileOption to vite as tinypages will auto-resolve the config
          const cliViteOptions = {
            root,
            base: options.base,
            mode: options.mode,
            logLevel: options.logLevel,
            clearScreen: options.clearScreen,
            server: cleanOptions(options),
          };
          const { config, filePath } = await resolveConfig(cliViteOptions);
          const server = await createDevServer(config, filePath);
          const info = server.config.logger.info;
          info(
            Colors.cyan(
              `\n  vite v${require("tinypages/package.json").version}`
            ) + Colors.green(` dev server running at: `),
            {
              clear: !server.config.logger.hasWarned,
            }
          );
        } catch (e) {
          process.exit(1);
        }
      }
    );

  cli.help();
  cli.version(require("../../package.json").version);
  cli.parse();
}

export function defineConfig(config: TinyPagesConfig) {
  return config;
}

cli();
