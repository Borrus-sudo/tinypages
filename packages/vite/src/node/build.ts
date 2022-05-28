import * as Vite from "vite";
import type { PageCtx, ReducedPage, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { normalizeUrl } from "./utils";
import { createBuildPlugins } from "./plugins/build";
import { Liquid } from "liquidjs";
import { existsSync } from "fs";
import { compile } from "@tinypages/compiler";
import { render } from "./render/page";
import { appendPrelude } from "./render/render-utils";
import { generateVirtualEntryPoint } from "./plugins/plugin-utils";
import { readFile } from "fs/promises";

export async function build(config: TinyPagesConfig, urls: string[]) {
  const [ctx, vite] = await createBuildContext(config, createBuildPlugins);
  const router = await fsRouter(ctx.utils.pageDir);
  const fileToLoaderMap: Map<string, { default: Function } | boolean> =
    new Map();
  const engine = new Liquid();

  async function performOp(pageCtx) {
    let { url, params } = pageCtx;
    let compileThis = "";
    let fileLoader = fileToLoaderMap.get(url);
    let loader;
    let markdown = await readFile(url, { encoding: "utf-8" });

    if (typeof fileLoader === "boolean") {
      // does not exist
      compileThis = markdown;
    } else {
      if (typeof fileLoader === "undefined") {
        let jsUrl = url.replace(/\.md$/, ".js");
        if (!existsSync(jsUrl)) {
          let tsUrl = url.replace(/\.md$/, ".ts");
          if (existsSync(tsUrl)) {
            loader = (await vite.ssrLoadModule(tsUrl)) as {
              default: Function;
            };
          } else {
            fileToLoaderMap.set(url, false);
            compileThis = markdown;
          }
        } else {
          loader = (await vite.ssrLoadModule(jsUrl)) as {
            default: Function;
          };
        }
      }
    }

    let ssrProps = {};
    if (loader) {
      fileToLoaderMap.set(url, loader);
      const data = await loader.default(params);
      compileThis = await engine.parseAndRender(markdown, data);
      ssrProps = data?.ssrProps ?? {};
    }

    const [rawHtml, meta] = await compile(compileThis, config.compiler, url);
    const page: ReducedPage = {
      meta,
      pageCtx,
      global: {
        components: {},
        ssrProps,
      },
    };

    const appHtml = await render(rawHtml, vite, {
      utils: ctx.utils,
      page: page,
      config: ctx.config,
    });

    if (Object.keys(page.global.components).length > 0) {
      const virtualModuleId =
        "/" + Vite.normalizePath(url).replace(/\.md$/, ".js");

      page.meta.head.script.push({
        type: "module",
        src: virtualModuleId,
        innerHTML: undefined,
      });

      ctx.virtualModuleMap.set(
        virtualModuleId,
        generateVirtualEntryPoint(
          page.global.components,
          config.vite.root,
          true
        )
      );
    } else {
      page.meta.head.script.push({
        type: "module",
        src: "/uno:only",
        innerHTML: undefined,
      });
    }
    const output = appendPrelude(appHtml, page);
    ctx.fileToHtmlMap.set(url, output);
  }

  let doAll = [];
  urls.forEach((url) => {
    const normalizedUrl = normalizeUrl(url);
    const res = router(normalizedUrl.replace(/\.md$/, ""), url);
    if (res.url === "404") {
      ctx.utils.consola.error(new Error(`404 ${url} not found`));
    } else {
      doAll.push(performOp(res));
    }
  });

  await Promise.all(doAll);
  console.log(ctx.fileToHtmlMap);
}
