import { join } from "path";
import { createLogger, createServer, mergeConfig, ViteDevServer } from "vite";
import { RenderFunction, ResolvedConfig, TinyPagesConfig } from "../types";
import { presetPageConfig } from "./constants";
import { createPlugins } from "./plugins";
import { deepCopy } from "./utils";
// import { polyfill } from "@astropub/webapi";

let ctx: ResolvedConfig;
let vite: ViteDevServer;

export async function createContext(
  config: TinyPagesConfig,
  source: string
): Promise<[ResolvedConfig, ViteDevServer]> {
  let render: RenderFunction;
  let invalidate: (input: string) => void;
  ctx = {
    config,
    page: deepCopy(presetPageConfig),
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await render(html, vite, ctx);
      },
      invalidate(comp: string) {
        invalidate(comp);
      },
      pageDir: join(config.vite.root, "pages"),
      configFile: source || "",
    },
  };
  const plugins = await createPlugins();
  //@ts-ignore
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });
  vite = await createServer(ctx.config.vite);
  const { render: renderFunction, invalidate: invalidateFunction } =
    await vite.ssrLoadModule(
      require.resolve("tinypages/entry-server").replace(".js", ".mjs")
    );
  render = renderFunction;
  invalidate = invalidateFunction;
  return [ctx, vite];
}
export function useContext(): ResolvedConfig {
  return ctx;
}

export function useVite(): ViteDevServer {
  return vite;
}
