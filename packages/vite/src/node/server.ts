import compileMarkdown from "@tinypages/compiler";
import crypto from "crypto";
import express from "express";
import { join } from "path";
import { createLogger, createServer, mergeConfig, ViteDevServer } from "vite";
import {
  Meta,
  PageCtx,
  RenderFunction,
  ResolvedConfig,
  TinyPagesConfig,
} from "../types";
import { createMiddlewares } from "./middleware";
import { createPlugins } from "./plugins";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  let renderFunction: RenderFunction;
  let invalidate: (param: string) => void;
  let cache: Map<string, [string, Meta]> = new Map();
  let md5;

  let ctx: ResolvedConfig = {
    config,
    bridge: {
      currentUrl: "",
      preservedScriptGlobal: "",
      pageCtx: { url: "" },
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
      async render(html: string, meta: Meta, pageCtx: PageCtx) {
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
      invalidate(comp: string) {
        invalidate(comp);
      },
      pageDir: join(config.vite.root, "pages"),
    },
  };

  const plugins = await createPlugins(ctx);
  //@ts-ignore
  ctx.config.vite = mergeConfig(ctx.config.vite, { plugins });

  const app = express();
  const vite = await createServer(ctx.config.vite);

  vite.watcher.add(ctx.utils.pageDir);

  if (source) vite.moduleGraph.createFileOnlyEntry(source);

  [renderFunction, invalidate] = (
    await vite.ssrLoadModule(
      require.resolve("tinypages/entry-server").replace(".js", ".mjs")
    )
  ).createRender();

  if ((config.middlewares.pre?.length ?? -1) > 0)
    app.use(config.middlewares.pre);

  app.use(vite.middlewares);
  app.use(await createMiddlewares(vite, ctx));

  if ((config.middlewares.post?.length ?? -1) > 0)
    app.use(config.middlewares.post);

  app.listen(3003, () => {
    console.log("http://localhost:3003");
  });
  return vite;
}
