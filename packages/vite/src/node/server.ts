import compileMarkdown from "@tinypages/compiler";
import express from "express";
import {
  createLogger,
  createServer,
  mergeConfig,
  normalizePath,
  ViteDevServer,
} from "vite";
import {
  Meta,
  RenderFunction,
  ResolvedConfig,
  TinyPagesConfig,
} from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";
import crypto from "crypto";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  let renderFunction: RenderFunction;
  let invalidateFunction: (param: string) => void;
  let cache: Map<string, [string, Meta]> = new Map();
  let md5;

  let ctx: ResolvedConfig = {
    config,
    bridge: {
      currentUrl: "",
      preservedScriptGlobal: "",
      pageCtx: {},
      sources: [],
      prevHash: "",
      configFile: source || "",
    },
    utils: {
      async compile(input: string) {
        md5 = crypto.createHash("md5");
        md5.update(input);
        const hash = md5.digest("hex");
        if (cache.has(hash)) {
          return JSON.parse(JSON.stringify(cache.get(hash)));
        }
        const result = await compileMarkdown(input, config.compiler);
        cache.set(hash, JSON.parse(JSON.stringify(result)));
        md5.end();
        return result;
      },
      logger: createLogger(config.vite.logLevel, { prefix: "[tinypages]" }),
      async render(html: string, meta: Meta, pageCtx: Record<string, string>) {
        return await renderFunction(
          {
            root: config.vite.root,
            vite,
            compile: async (input: string) => {
              return await compileMarkdown(input, config.compiler);
            },
            html,
            meta,
            pageCtx,
          },
          ctx
        );
      },
      invalidate(componentPath: string) {
        invalidateFunction(componentPath);
      },
      normalize(file: string) {
        return normalizePath(file);
      },
    },
  };
  const plugins = await createPlugins(ctx);
  //@ts-ignore
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });

  const app = express();
  const vite = await createServer(config.vite);

  if (source) vite.moduleGraph.createFileOnlyEntry(source);

  [renderFunction, invalidateFunction] = (
    await vite.ssrLoadModule(
      require.resolve("tinypages/entry-server").replace(".js", ".mjs")
    )
  ).createRender();
  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));
  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
