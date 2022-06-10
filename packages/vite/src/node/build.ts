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
import { readFileSync } from "fs";
import path from "path";
import { v4 as uuid } from "@lukeed/uuid";
import { polyfill } from "@astropub/webapi";
import ora from "ora";

function analyzeUrls(html: string) {
  const res = [];
  html.replace(/\<a href\=\"(.*?)\"/gi, (_, url) => {
    //TODO: improve this? seems hacky
    res.push(url);
    return "";
  });
  return res;
}

export async function build(
  config: TinyPagesConfig,
  urls: string[],
  isGrammarCheck: boolean,
  zeroJS: boolean
) {
  const [buildContext, vite] = await createBuildContext(
    config,
    createBuildPlugins
  );
  const spinner = ora();
  spinner.text = "Building pages!";
  spinner.color = "yellow";

  const router = await fsRouter(buildContext.utils.pageDir);
  const fileToLoaderMap: Map<string, { default: Function } | boolean> =
    new Map();
  const engine = new Liquid({
    extname: ".md",
  });

  async function buildPage(pageCtx: PageCtx) {
    let { url, params } = pageCtx;
    let compileThis = "";
    let fileLoader = fileToLoaderMap.get(url);
    let loader;
    let markdown = readFileSync(url, { encoding: "utf-8" });

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
      utils: buildContext.utils, //@ts-ignore
      page,
      config: buildContext.config,
    });

    const newlyFoundUrls = analyzeUrls(appHtml);

    if (isGrammarCheck) {
      buildContext.fileToHtmlMap.set(
        { filePath: url, url: pageCtx.originalUrl },
        appHtml
      );
      return newlyFoundUrls;
    }

    if (Object.keys(page.global.components).length > 0) {
      const virtualModuleId =
        "/" + Vite.normalizePath(url).replace(/\.md$/, ".js");

      page.meta.head.script.push({
        type: "module",
        src: virtualModuleId,
        innerHTML: undefined,
      });

      buildContext.virtualModuleMap.set(
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
    buildContext.fileToHtmlMap.set(
      { filePath: url, url: pageCtx.originalUrl },
      output
    );
    return newlyFoundUrls;
  }

  polyfill(global, {
    exclude: "window document",
  });

  async function buildPages(urls) {
    let buildsOps = [];
    urls.forEach((url) => {
      const normalizedUrl = normalizeUrl(url);
      const res = router(normalizedUrl.replace(/\.md$/, ""), url);
      if (res.url === "404") {
        buildContext.utils.consola.error(new Error(`404 ${url} not found`));
      } else {
        buildsOps.push(buildPage(res));
      }
    });

    const output = await Promise.allSettled(buildsOps);
    const moarUrls = [];
    output.forEach((curr) =>
      curr.status === "fulfilled" ? moarUrls.push(...curr.value) : 0
    );

    if (moarUrls.length > 0) {
      await buildPages(moarUrls);
    }
  }

  spinner.start();
  await buildPages(urls);
  spinner.succeed("Pages built!");
  await vite.close();

  if (!isGrammarCheck && !zeroJS) {
    let inputOptions = {};
    buildContext.fileToHtmlMap.forEach((html, { url }) => {
      const normalizedUrl = normalizeUrl(url).replace(/\.md$/, ".html");
      const resolvedUrl = path.join(
        buildContext.config.vite.root,
        normalizedUrl
      );
      inputOptions[uuid()] = resolvedUrl;
      buildContext.virtualModuleMap.set(resolvedUrl, html);
    });
    const build = buildContext.config.vite.build;
    if (!build.rollupOptions) {
      build.rollupOptions = {};
    }
    build.target = "es2020";
    build.rollupOptions.input = inputOptions;
    await Vite.build(buildContext.config.vite);
  }

  return buildContext.fileToHtmlMap;
}
