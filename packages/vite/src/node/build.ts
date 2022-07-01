import * as Vite from "vite";
import type { PageCtx, ReducedPage, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { htmlNormalizeURL, normalizeUrl } from "./utils";
import { createBuildPlugins } from "./plugins/build";
import { writeFileSync } from "fs";
import { compile } from "@tinypages/compiler";
import { render } from "./render/page";
import { appendPrelude, appendPreludeRebuild } from "./render/render-utils";
import { generateVirtualEntryPoint } from "./plugins/plugin-utils";
import path from "path";
import { polyfill } from "@astropub/webapi";
import ora from "ora";
import { loadPage } from "./render/load-page";
import htmlMinifier from "html-minifier";
import sitemap from "vite-plugin-pages-sitemap";

function analyzeUrls(html: string) {
  const res = [];
  html.replace(/\<a href\=\"(.*?)\"/gi, (_, url) => {
    //TODO: improve this? seems hacky
    res.push(url);
    return "";
  });
  return res;
}

function isSmallPageBuild(map: Map<string, string[]>, frequencyTable) {
  if (map.size < 3) {
    if (frequencyTable) {
    }
    return true;
  }
}

function genPaginate({ fileURL, url, map }) {
  const urls: string[] = map.get(fileURL);
  const index = urls.findIndex((curr) => url === curr);
  return {
    prev: index === 0 ? null : urls.slice(0, index),
    next: index === urls.length ? null : urls.slice(index + 1),
  };
}

type Params = {
  config: TinyPagesConfig;
  urls: string[];
  isGrammarCheck: boolean;
  rebuild: boolean;
};

export async function build({ config, urls, isGrammarCheck, rebuild }: Params) {
  const [buildContext, vite] = await createBuildContext(
    config,
    createBuildPlugins
  );
  const postFs = {};
  const resolvedUrls = [];
  const fileToUrlMap: Map<string, string[]> = new Map();
  const spinner = ora();
  spinner.text = "Building pages!";
  spinner.color = "yellow";
  buildContext.isRebuild = rebuild;

  const router = await fsRouter(buildContext.utils.pageDir);

  async function buildPage(pageCtx: PageCtx) {
    const { url } = pageCtx;
    const global = {
      ssrProps: {},
      components: {},
    };

    const buildLiquid = await loadPage(
      url,
      { reloads: [], global, pageCtx }, // quick workaround to make build and dev to be compatible
      true,
      genPaginate({
        fileURL: pageCtx.url,
        url: pageCtx.originalUrl,
        map: fileToUrlMap,
      })
    );

    const [rawHtml, meta] = await compile(buildLiquid, config.compiler);
    const page: ReducedPage = {
      meta,
      pageCtx,
      global,
    };

    const appHtml = await render(
      rawHtml,
      vite,
      {
        utils: buildContext.utils, //@ts-ignore
        page,
        config: buildContext.config,
      },
      buildContext.frequencyTable
    );

    if (isGrammarCheck) {
      buildContext.fileToHtmlMap.set(
        { filePath: url, url: pageCtx.originalUrl },
        appHtml
      );
      return analyzeUrls(appHtml);
    }

    if (page.meta.feeds.atom) {
      const atomUrl = htmlNormalizeURL(pageCtx.originalUrl).replace(
        /\.html$/,
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
      const rssUrl = htmlNormalizeURL(pageCtx.originalUrl).replace(
        /\.html$/,
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

    let output: string;
    if (rebuild) {
      output = appendPreludeRebuild({
        url: pageCtx.originalUrl,
        root: buildContext.config.vite.root,
        appHtml,
        head: page.meta.head,
        ssrProps: page.global.ssrProps,
        otherUrls: fileToUrlMap.get(pageCtx.url),
        pageCtx,
      });
    } else {
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
      }
      output = appendPrelude(appHtml, page);
    }

    buildContext.fileToHtmlMap.set(
      { filePath: url, url: pageCtx.originalUrl },
      htmlMinifier.minify(output, {
        collapseWhitespace: true,
        caseSensitive: true,
        collapseInlineTagWhitespace: false,
        minifyJS: true,
        minifyCSS: true,
      })
    );

    return rebuild ? [] : analyzeUrls(appHtml);
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
        if (fileToUrlMap.has(res.url)) {
          fileToUrlMap.set(res.url, [
            ...fileToUrlMap.get(res.url),
            res.originalUrl,
          ]);
        } else {
          fileToUrlMap.set(res.url, [res.originalUrl]);
        }
        resolvedUrls.push(normalizedUrl);
        buildsOps.push(buildPage(res));
      }
    });

    const output = await Promise.allSettled(buildsOps);
    console.log(output);

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
  await vite.close();

  if (!isGrammarCheck) {
    await Vite.build(buildContext.config.vite);
    if (!rebuild) {
      //@ts-ignore
      sitemap.default({
        routes: resolvedUrls.map((route) => route.replace(/\.md$/, ".html")),
        hostname: config.hostname,
      });
    }
  }

  Object.keys(postFs).forEach((path) => {
    writeFileSync(path, postFs[path]);
  });

  spinner.succeed("Pages built!");

  return buildContext.fileToHtmlMap;
}
