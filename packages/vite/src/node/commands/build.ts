import { build } from "../build";
import { cleanOptions, reportString, GlobalCLIOptions } from "./common";
import type { BuildOptions } from "vite";
import path from "path";
import fs from "fs/promises";

export async function buildAction(
  root: string,
  options: BuildOptions & GlobalCLIOptions & { grammar?: boolean; ci?: boolean }
) {
  try {
    if (root.startsWith(".")) {
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
    const renderedFiles = await build(
      {
        config: cliViteOptions,
        rebuild: false,
      },
      options.ci
    );
    if (options.grammar) {
      const { reporter } = await import("vfile-reporter");
      const { html } = await import("alex");
      const msgs = [];
      renderedFiles.forEach((userHtml, { url }) => {
        const res = html({
          value: userHtml,
          path: path.join(root, "dist", url),
          messages: [],
        });
        const msg = reporter(res);
        if (options.ci) {
          msgs.push(msg);
        } else {
          console.error(reporter(res));
        }
      });
      await fs.writeFile(
        path.join(root, "dist", "analytics.json"),
        JSON.stringify({
          report: msgs,
        })
      );
    }
  } catch (e) {
    console.log(reportString);
    console.error(e);
  }
}
