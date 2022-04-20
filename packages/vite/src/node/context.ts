import { polyfill } from "@astropub/webapi";
import { join } from "path";
import { createLogger, createServer, mergeConfig, ViteDevServer } from "vite";
import { ResolvedConfig, TinyPagesConfig } from "../types/types";
import { presetPageConfig } from "./constants";
import { createPlugins } from "./plugins";
import { deepCopy, createConsola } from "./utils";
import { render, invalidate } from "./entry-server";

let ctx: ResolvedConfig;
let vite: ViteDevServer;

export async function createContext(
  config: TinyPagesConfig,
  source: string
): Promise<[ResolvedConfig, ViteDevServer]> {
  ctx = {
    config,
    page: deepCopy(presetPageConfig),
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, ctx);
      },
      invalidate: (input: string) => invalidate(input),
      pageDir: join(config.vite.root, "pages"),
      configFile: source || "",
      consola: createConsola(),
    },
  };

  const plugins = await createPlugins(); //@ts-ignore
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });
  vite = await createServer(ctx.config.vite);

  polyfill(global, {
    exclude: "window document",
  });

  return [ctx, vite];
}
export function useContext(): ResolvedConfig {
  return ctx;
}

export function useVite(): ViteDevServer {
  return vite;
}
