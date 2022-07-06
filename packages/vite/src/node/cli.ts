import cac from "cac";
import type { UserTinyPagesConfig } from "../../types/types";

export async function cli() {
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
    .action((await import("./commands/dev")).devAction);

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
    .action((await import("./commands/build")).buildAction);

  cli
    .command("grammar:check [root]")
    .action((await import("./commands/grammar")).grammarAction);

  cli
    .command("rebuild [root]")
    .action((await import("./commands/rebuild")).rebuildAction);

  cli
    .command("lighthouse [root]")
    .option(
      "--build",
      "[boolean] build the website, in case files haven't been already built"
    )
    .action((await import("./commands/unlighthouse")).unlighthouseAction);

  cli.help();
  cli.version("1.0.0");
  cli.parse();
}

export function defineConfig(config: UserTinyPagesConfig) {
  return config;
}

export type { Params } from "../../types/params";
export type { UserPageContext } from "../../types/types";
