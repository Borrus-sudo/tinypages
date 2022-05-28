import { polyfill } from "@astropub/webapi";
import { join } from "path";
import { createLogger, createServer, type ViteDevServer } from "vite";
import type {
  ResolvedConfig,
  TinyPagesConfig,
  BuildContext,
} from "../../types/types";
import { presetPageConfig } from "./constants";
import { invalidate, render } from "./render/markdown";
import { createConsola, deepCopy } from "./utils";

let devCtx: ResolvedConfig;
let vite: ViteDevServer;
let buildCtx: BuildContext;

export async function createDevContext(
  config: TinyPagesConfig,
  createDevPlugins,
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

  const plugins = await createDevPlugins();

  if (devCtx.config.vite.plugins) {
    devCtx.config.vite.plugins.push(plugins);
    vite = await createServer({ ...devCtx.config.vite });
  } else {
    vite = await createServer({ ...devCtx.config.vite, plugins });
  }

  setTimeout(() => {
    polyfill(global, {
      exclude: "window document",
    });
  }, 0);

  return [devCtx, vite];
}

export async function createBuildContext(
  config: TinyPagesConfig,
  createBuildPlugins
): Promise<[BuildContext, ViteDevServer]> {
  buildCtx = {
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
  };

  let plugins = await createBuildPlugins();

  if (buildCtx.config.vite.plugins) {
    buildCtx.config.vite.plugins.push(plugins);
    vite = await createServer({ ...buildCtx.config.vite });
  } else {
    vite = await createServer({ ...buildCtx.config.vite, plugins });
  }

  return [buildCtx, vite];
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
    if (buildCtx) {
      //@ts-ignore
      return buildCtx;
    } else {
      //@ts-ignore
      return devCtx;
    }
  }
}

export function useVite(): ViteDevServer {
  return vite;
}
