import { join } from "path";
import { createLogger, createServer, type ViteDevServer } from "vite";
import type {
  DevContext,
  TinyPagesConfig,
  BuildContext,
} from "../../types/types";
import { presetPageConfig } from "./constants";
import { purgeComponentCache, render } from "./render/page";

let devContext: DevContext;
let vite: ViteDevServer;
let buildContext: BuildContext;

export async function createDevContext(
  config: TinyPagesConfig,
  createDevPlugins,
  source?: string
): Promise<[DevContext, ViteDevServer]> {
  devContext = {
    config,
    page: presetPageConfig,
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, devContext);
      },
      invalidate: (input: string) => purgeComponentCache(input),
      pageDir: join(config.vite.root, "pages"),
      stylesDir: join(config.vite.root, "styles"),
      configFile: source || "",
    },
  };

  const plugins = await createDevPlugins();
  if (devContext.config.vite.plugins) {
    devContext.config.vite.plugins.push(plugins);
    vite = await createServer({ ...devContext.config.vite });
  } else {
    vite = await createServer({
      ...devContext.config.vite,
      plugins,
    });
  }
  return [devContext, vite];
}

export async function createBuildContext(
  config: TinyPagesConfig,
  createBuildPlugins
): Promise<[BuildContext, ViteDevServer]> {
  buildContext = {
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      invalidate: (input: string) => purgeComponentCache(input),
      pageDir: join(config.vite.root, "pages"),
      stylesDir: join(config.vite.root, "styles"),
    },
    config,
    virtualModuleMap: new Map(),
    fileToHtmlMap: new Map(),
    fileToURLMap: new Map(),
    seenURLs: new Set(),
    postFS: {},
    isRebuild: false,
    isSmallPageBuild: false,
  };

  let plugins = await createBuildPlugins();

  if (buildContext.config.vite.plugins) {
    buildContext.config.vite.plugins.push(plugins);
    vite = await createServer({ ...buildContext.config.vite });
  } else {
    vite = await createServer({ ...buildContext.config.vite, plugins });
  }

  return [buildContext, vite];
}

type DevOrIso = "dev" | "iso";
type BuildOrDev<T extends DevOrIso> = T extends "dev"
  ? DevContext
  : BuildContext;

export function useContext<T extends DevOrIso>(type: T): BuildOrDev<T> {
  if (type === "dev") {
    //@ts-ignore
    return devContext;
  } else {
    if (buildContext) {
      //@ts-ignore
      return buildContext;
    } else {
      //@ts-ignore
      return devContext;
    }
  }
}

export function useVite(): ViteDevServer {
  return vite;
}
