import { polyfill } from "@astropub/webapi";
import { join } from "path";
import {
  createLogger,
  createServer,
  mergeConfig,
  type ViteDevServer,
} from "vite";
import type {
  ResolvedConfig,
  TinyPagesConfig,
  BuildContext,
} from "../../types/types";
import { presetPageConfig } from "./constants";
import { createDevPlugins } from "./plugins";
import { createBuildPlugins } from "./plugins";
import { invalidate, render } from "./render/markdown";
import { createConsola, deepCopy } from "./utils";

let devCtx: ResolvedConfig;
let vite: ViteDevServer;
let buildCtx: BuildContext;

export async function createDevContext(
  config: TinyPagesConfig,
  source?: string
): Promise<[ResolvedConfig, ViteDevServer]> {
  devCtx = {
    config,
    page: deepCopy(presetPageConfig),
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, devCtx);
      },
      invalidate: (input: string) => invalidate(input),
      pageDir: join(config.vite.root, "pages"),
      stylesDir: join(config.vite.root, "styles"),
      configFile: source || "",
      consola: createConsola(),
    },
  };

  const plugins = await createDevPlugins(); //@ts-ignore
  devCtx.config.vite = mergeConfig(devCtx.config.vite, { plugins });
  vite = await createServer(devCtx.config.vite);

  polyfill(global, {
    exclude: "window document",
  });

  return [devCtx, vite];
}

export async function createBuildContext(
  config: TinyPagesConfig
): Promise<[BuildContext, ViteDevServer]> {
  const buildPlugins = await createBuildPlugins();
  let resolvedBuildConfig = mergeConfig(config, { plugins: buildPlugins });
  vite = await createServer(resolvedBuildConfig);
  return [
    {
      utils: {
        logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
        async render(html: string) {
          return html;
        },
        invalidate: (input: string) => invalidate(input),
        pageDir: join(config.vite.root, "pages"),
        stylesDir: join(config.vite.root, "styles"),
        consola: createConsola(),
      },
      config,
      pages: {
        uriToBuiltHTML: new Map(),
        virtualEntryPoint: new Map(),
      },
    },
    vite,
  ];
}

type DevOrIso = "dev" | "iso";
type BuildOrDev<T extends DevOrIso> = T extends "dev"
  ? ResolvedConfig
  : BuildContext;

export function useContext<T extends DevOrIso>(type: T): BuildOrDev<T> {
  if (type === "dev") {
    //@ts-ignore
    return devCtx;
  } else {
    //@ts-ignore
    return buildCtx;
  }
}

export function useVite(): ViteDevServer {
  return vite;
}
