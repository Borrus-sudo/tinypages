import { join } from "path";
import { createLogger, createServer, ViteDevServer, mergeConfig } from "vite";
import { RenderFunction, ResolvedConfig, TinyPagesConfig } from "../types";
import { createPlugins } from "./plugins";

let ctx: ResolvedConfig;

export async function createContext(
  config: TinyPagesConfig,
  source: string
): Promise<[ResolvedConfig, ViteDevServer]> {
  let render: RenderFunction;
  let invalidate: (input: string) => void;
  const head = {
    base: {},
    htmlAttributes: {},
    link: [],
    meta: [],
    noscript: [],
    script: [],
    style: [],
    title: "",
    titleAttributes: {},
  };

  ctx = {
    config,
    page: {
      pageCtx: { url: "" },
      sources: [],
      prevHash: "",
      global: {},
      meta: {
        styles: "",
        components: [],
        headTags: [],
        head,
        grayMatter: "",
      },
    },
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
  const vite = await createServer(ctx.config.vite);
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
