import { polyfill } from "@astropub/webapi";
import { join } from "path";
import { createLogger, createServer, type ViteDevServer } from "vite";
import type {
  DevContext,
  TinyPagesConfig,
  BuildContext,
} from "../../types/types";
import { presetPageConfig } from "./constants";
import { invalidate, render } from "./render/page";
import { createConsola, deepCopy } from "./utils";

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
    page: deepCopy(presetPageConfig),
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, devContext);
      },
      invalidate: (input: string) => invalidate(input),
      pageDir: join(config.vite.root, "pages"),
      stylesDir: join(config.vite.root, "styles"),
      configFile: source || "",
      consola: createConsola(),
    },
  };

  const plugins = await createDevPlugins();

  if (devContext.config.vite.plugins) {
    devContext.config.vite.plugins.push(plugins);
    vite = await createServer({ ...devContext.config.vite });
  } else {
    vite = await createServer({ ...devContext.config.vite, plugins });
  }

  setTimeout(() => {
    polyfill(global, {
      exclude: "window document",
    });
  }, 0);

  return [devContext, vite];
}

export async function createBuildContext(
  config: TinyPagesConfig,
  createBuildPlugins
): Promise<[BuildContext, ViteDevServer]> {
  buildContext = {
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      invalidate: (input: string) => invalidate(input),
      pageDir: join(config.vite.root, "pages"),
      stylesDir: join(config.vite.root, "styles"),
      consola: createConsola(),
    },
    config,
    virtualModuleMap: new Map([["/uno:only", `import "uno.css"`]]),
    fileToHtmlMap: new Map(),
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
