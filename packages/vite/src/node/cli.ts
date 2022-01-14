import cac from "cac";
import * as Colors from "picocolors";
import * as Vite from "vite";

console.log(Colors.cyan(`tinypages ${require("../../package.json").version}`));

const cli = cac("tinypages");

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

cli
  .option("-c, --config <file>", `[string] use specified config file`)
  .option("--base <path>", `[string] public base path (default: /)`)
  .option("-l, --logLevel <level>", `[string] info | warn | error | silent`)
  .option("--clearScreen", `[boolean] allow/disable clear screen when logging`)
  .option("-d, --debug [feat]", `[string | boolean] show debug logs`)
  .option("-f, --filter <filter>", `[string] filter debug logs`)
  .option("-m, --mode <mode>", `[string] set env mode`);

// dev
cli
  .command("[root]")
  .alias("start")
  .alias("dev")
  .option("--host [host]", `[string] specify hostname`)
  .option("--port <port>", `[number] specify port`)
  .option("--https", `[boolean] use TLS + HTTP/2`)
  .option("--open [path]", `[boolean | string] open browser on startup`)
  .option("--cors", `[boolean] enable CORS`)
  .option("--strictPort", `[boolean] exit if specified port is already in use`)
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
        const { createDevServer } = require("./dev.js");
        const server = await createDevServer({
          root,
          base: options.base,
          mode: options.mode,
          configFile: options.config,
          logLevel: options.logLevel,
          clearScreen: options.clearScreen,
          server: cleanOptions(options),
        });

        const info = server.config.logger.info;
        info(
          Colors.cyan(
            `\n  vite v${require("tinypages/package.json").version}`
          ) + Colors.green(` dev server running at:\n`),
          {
            clear: !server.config.logger.hasWarned,
          }
        );
      } catch (e) {
        Vite.createLogger(options.logLevel).error(
          Colors.red(`error when starting dev server:\n${e.stack}`),
          { error: e }
        );
        process.exit(1);
      }
    }
  );

// // build
// cli
//   .command("build [root]")
//   .option("--target <target>", `[string] transpile target (default: 'modules')`)
//   .option("--outDir <dir>", `[string] output directory (default: dist)`)
//   .option(
//     "--assetsDir <dir>",
//     `[string] directory under outDir to place assets in (default: _assets)`
//   )
//   .option(
//     "--assetsInlineLimit <number>",
//     `[number] static asset base64 inline threshold in bytes (default: 4096)`
//   )
//   .option(
//     "--ssr [entry]",
//     `[string] build specified entry for server-side rendering`
//   )
//   .option(
//     "--sourcemap",
//     `[boolean] output source maps for build (default: false)`
//   )
//   .option(
//     "--minify [minifier]",
//     `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
//       `or specify minifier to use (default: esbuild)`
//   )
//   .option("--manifest", `[boolean] emit build manifest json`)
//   .option("--ssrManifest", `[boolean] emit ssr manifest json`)
//   .option(
//     "--emptyOutDir",
//     `[boolean] force empty outDir when it's outside of root`
//   )
//   .option("-w, --watch", `[boolean] rebuilds when modules have changed on disk`)
//   .action(async (root: string, options: Vite.BuildOptions & GlobalCLIOptions) => {
//     const { build } = await import("./build");
//     const buildOptions: Vite.BuildOptions = cleanOptions(options);

//     try {
//       await build({
//         root,
//         base: options.base,
//         mode: options.mode,
//         configFile: options.config,
//         logLevel: options.logLevel,
//         clearScreen: options.clearScreen,
//         build: buildOptions,
//       });
//     } catch (e) {
//       Vite.createLogger(options.logLevel).error(
//         colors.red(`error during build:\n${e.stack}`),
//         { error: e }
//       );
//       process.exit(1);
//     }
//   });

// // optimize
// cli
//   .command("optimize [root]")
//   .option(
//     "--force",
//     `[boolean] force the optimizer to ignore the cache and re-bundle`
//   )
//   .action(
//     async (root: string, options: { force?: boolean } & GlobalCLIOptions) => {
//       const { optimizeDeps } = await import("./optimizer");
//       try {
//         const config = await resolveConfig(
//           {
//             root,
//             base: options.base,
//             configFile: options.config,
//             logLevel: options.logLevel,
//           },
//           "build",
//           "development"
//         );
//         await optimizeDeps(config, options.force, true);
//       } catch (e) {
//         Vite.createLogger(options.logLevel).error(
//           colors.red(`error when optimizing deps:\n${e.stack}`),
//           { error: e }
//         );
//         process.exit(1);
//       }
//     }
//   );

// cli
//   .command("preview [root]")
//   .option("--host [host]", `[string] specify hostname`)
//   .option("--port <port>", `[number] specify port`)
//   .option("--strictPort", `[boolean] exit if specified port is already in use`)
//   .option("--https", `[boolean] use TLS + HTTP/2`)
//   .option("--open [path]", `[boolean | string] open browser on startup`)
//   .action(
//     async (
//       root: string,
//       options: {
//         host?: string | boolean;
//         port?: number;
//         https?: boolean;
//         open?: boolean | string;
//         strictPort?: boolean;
//       } & GlobalCLIOptions
//     ) => {
//       try {
//         const server = await preview({
//           root,
//           base: options.base,
//           configFile: options.config,
//           logLevel: options.logLevel,
//           mode: options.mode,
//           preview: {
//             port: options.port,
//             strictPort: options.strictPort,
//             host: options.host,
//             https: options.https,
//             open: options.open,
//           },
//         });
//         server.printUrls();
//       } catch (e) {
//         Vite.createLogger(options.logLevel).error(
//           colors.red(`error when starting preview server:\n${e.stack}`),
//           { error: e }
//         );
//         process.exit(1);
//       }
//     }
//   );

cli.help();
cli.version(require("../../package.json").version);
cli.parse();
