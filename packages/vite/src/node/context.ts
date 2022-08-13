import path from "path";
import { createLogger, createServer, type ViteDevServer } from "vite";
import type {
  DevContext,
  TinyPagesConfig,
  BuildContext,
} from "../../types/types";
import { presetPageConfig } from "./constants";
import { purgeComponentCache, render, giveComponentCache } from "./render/page";
import { createCaches } from "./load-n-save";
import { pluginKit } from "./plugin";

let devContext: DevContext;
let vite: ViteDevServer;
let buildContext: BuildContext;

export async function createDevContext(
  config: TinyPagesConfig,
  createDevPlugins,
  source?: string
): Promise<[DevContext, ViteDevServer]> {
  const { islands_cache, markdown_cache } = await createCaches(
    config.vite.root,
    false
  );
  giveComponentCache(islands_cache);
  devContext = {
    config,
    page: presetPageConfig,
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, devContext);
      },
      invalidate: (input: string) => purgeComponentCache(input),
      pageDir: path.join(config.vite.root, "pages"),
      stylesDir: path.join(config.vite.root, "styles"),
      i18nDir: path.join(config.vite.root, "locales"),
      currI18n: "",
      configFile: source || "",
      markdown_cache,
      kit: pluginKit(config.modules),
    },
  };

  /**
   * Hook: defineConfig (dev)
   */
  await devContext.utils.kit.defineConfig(config);

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
      pageDir: path.join(config.vite.root, "pages"),
      stylesDir: path.join(config.vite.root, "styles"),
      i18nDir: path.join(config.vite.root, "locales"),
      kit: pluginKit(config.modules),
    },
    config,
    virtualModuleMap: new Map([
      [
        "/uno:only.js",
        "import 'uno.css';import {router} from 'million/router';router('body')",
      ],
    ]),
    fileToHtmlMap: new Map(),
    fileToURLMap: new Map(),
    seenURLs: new Set(),
    postFS: {},
    isRebuild: false,
    isSmallPageBuild: false,
  };

  /**
   * Hook: defineConfig build
   */
  await buildContext.utils.kit.defineConfig(config);

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
