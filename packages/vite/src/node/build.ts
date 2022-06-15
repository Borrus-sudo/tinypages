import * as Vite from "vite";
import type { PageCtx, ReducedPage, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { normalizeUrl } from "./utils";
import { createBuildPlugins } from "./plugins/build";
import { Liquid } from "liquidjs";
import { existsSync, writeFileSync } from "fs";
import { compile } from "@tinypages/compiler";
import { render } from "./render/page";
import { appendPrelude } from "./render/render-utils";
import { generateVirtualEntryPoint } from "./plugins/plugin-utils";
import { readFileSync } from "fs";
import path from "path";
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

type Params = {
  config: TinyPagesConfig;
  urls: string[];
  isGrammarCheck: boolean;
  zeroJS: boolean;
};

export async function build({ config, urls, isGrammarCheck, zeroJS }: Params) {
  const [buildContext, vite] = await createBuildContext(
    config,
    createBuildPlugins
  );
  const postFs = {};
  const spinner = ora();
  spinner.text = "Building pages!";
  spinner.color = "yellow";

  const router = await fsRouter(buildContext.utils.pageDir);
  const fileToLoaderMap: Map<string, { default: Function } | boolean> =
    new Map();
  const engine = new Liquid({
    extname: ".md",
    root: path.join(config.vite.root, "pages"),
    layouts: path.join(config.vite.root, "layouts"),
  });

  async function buildPage(pageCtx: PageCtx) {
    let { url, params } = pageCtx;
    let compileThis = "";
    let cachedLoader = fileToLoaderMap.get(url);
    let loader;
    let markdown = readFileSync(url, { encoding: "utf-8" });

    if (typeof cachedLoader === "boolean") {
      // does not exist
      compileThis = markdown;
    } else {
      if (typeof cachedLoader === "undefined") {
        let jsUrl = url.replace(/\.md$/, ".js");
        if (!existsSync(jsUrl)) {
          let tsUrl = url.replace(/\.md$/, ".ts");
          if (existsSync(tsUrl)) {
            loader = (await vite.ssrLoadModule(tsUrl)) as {
              default: Function;
            };
            fileToLoaderMap.set(url, loader);
          } else {
            fileToLoaderMap.set(url, false);
            compileThis = markdown;
          }
        } else {
          loader = (await vite.ssrLoadModule(jsUrl)) as {
            default: Function;
          };
          fileToLoaderMap.set(url, loader);
        }
      } else {
        loader = cachedLoader;
      }
    }

    let ssrProps = {};
    if (loader) {
      const data = await loader.default(params);
      compileThis = await engine.parseAndRender(markdown, data);
      ssrProps = data?.ssrProps ?? {};
    }

    const [rawHtml, meta] = await compile(compileThis, config.compiler);
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

    if (page.meta.feeds.atom) {
      const atomUrl = normalizeUrl(pageCtx.originalUrl).replace(
        /\.md$/,
        "ATOM.xml"
      );
      const atomFSPath = path.join(
        buildContext.config.vite.root,
        "dist",
        atomUrl
      );
      postFs[atomFSPath] = page.meta.feeds.atom;
      page.meta.head.link.push({
        rel: "alternate",
        type: "application/rss+xml",
        title: "Subscribe to What's New!",
        href: atomUrl,
      });
    }
    if (page.meta.feeds.rss) {
      const rssUrl = normalizeUrl(pageCtx.originalUrl).replace(
        /\.md$/,
        "RSS.xml"
      );
      const rssFSPath = path.join(
        buildContext.config.vite.root,
        "dist",
        rssUrl
      );
      postFs[rssFSPath] = page.meta.feeds.atom;
      page.meta.head.link.push({
        rel: "alternate",
        type: "application/rss+xml",
        title: "Subscribe to What's New!",
        href: rssUrl,
      });
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

  async function buildPages(urls: string[], history: string[]) {
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
    const newHistory = [...history, ...urls];

    if (moarUrls.length > 0) {
      await buildPages(
        moarUrls.filter((currUrl) => !newHistory.includes(currUrl)),
        newHistory
      );
    }
  }

  spinner.start();
  await buildPages(urls, []);
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
      inputOptions[normalizedUrl.replace(/\//g, "-").slice(1)] = resolvedUrl;
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
  Object.keys(postFs).forEach((path) => {
    writeFileSync(path, postFs[path]);
  });
  return buildContext.fileToHtmlMap;
}
