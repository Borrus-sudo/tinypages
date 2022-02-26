import { join } from "path";
import { createLogger, createServer, ViteDevServer } from "vite";
import { RenderFunction, ResolvedConfig, TinyPagesConfig } from "../types";
import { createPlugins } from "./plugins";

let ctx: ResolvedConfig;
export async function createContext(
  config: TinyPagesConfig,
  source: string
): Promise<[ResolvedConfig, ViteDevServer]> {
  let renderFunction: RenderFunction;
  let invalidate: (param: string) => void;
  const vite = await createServer(ctx.config.vite);
  ctx = {
    config,
    page: {
      currentUrl: "",
      pageCtx: { url: "" },
      sources: [],
      prevHash: "",
      global: {},
      //@ts-ignore
      meta: {},
      //@ts-ignore
      head: {},
    },
    utils: {
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string) {
        return await renderFunction(html, vite, ctx);
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
  [renderFunction, invalidate] = (
    await vite.ssrLoadModule(
      require.resolve("tinypages/entry-server").replace(".js", ".mjs")
    )
  ).createRender();
  return [ctx, vite];
}
export function useContext(): ResolvedConfig {
  return ctx;
}
