import * as Vite from "vite";
import type { PageCtx, ReducedPage, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { htmlNormalizeURL } from "./utils";
import { createBuildPlugins } from "./plugins/build";
import { writeFileSync } from "fs";
import { compile } from "@tinypages/compiler";
import { render } from "./render/page";
import {
  appendPrelude,
  appendPreludeRebuild,
  generateVirtualEntryPoint,
} from "./render/render-utils";
import path from "path";
import { polyfill } from "@astropub/webapi";
import ora from "ora";
import { loadPage } from "./render/load-page";
import htmlMinifier from "html-minifier";
import sitemap from "vite-plugin-pages-sitemap";

function analyzeUrls(html: string, hostname) {
  const res = [];
  html.replace(/\<a.*?href\=\"(.*?)\"/gi, (_, url) => {
    if (_.includes("ignore:link")) {
      return _;
    } else if (!url.startsWith(hostname) && url.includes("http")) {
      return _;
    }
    res.push(url);
    return _;
  });
  return res;
}

type Marker = {
  path: string;
  lazy: boolean;
  uid: string;
};

function analyzeIslandMarkers(html: string): [string, Marker[]] {
  const markers = [];
  html = html.replace(
    /\<island\-marker\>([\s\S]*)\<\/island\-marker\>/g,
    (_, marker) => {
      const metaData = JSON.parse(marker);
      markers.push(metaData);
      return "";
    }
  );
  return [html, markers];
}

type Params = {
  config: TinyPagesConfig;
  urls: string[];
  isGrammarCheck: boolean;
  rebuild: boolean;
};

const markdownCompilerCache: Map<string, string> = new Map();

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
    const { filePath: url } = pageCtx;
    const global = {
      ssrProps: {},
      components: {},
    };

    const buildLiquid = await loadPage(
      url,
      { reloads: [], global, pageCtx }, // quick workaround to make build and dev to be compatible
      true
    );

    const [rawHtml, meta] = await compile(
      buildLiquid,
      config.compiler,
      markdownCompilerCache
    );
    const page: ReducedPage = {
      meta,
      pageCtx,
      global,
    };

    let appHtml = await render(
      rawHtml,
      vite,
      {
        utils: buildContext.utils, //@ts-ignore
        page,
        config: buildContext.config,
      },
      true
    );

    if (isGrammarCheck) {
      buildContext.fileToHtmlMap.set(
        { filePath: url, url: pageCtx.originalUrl },
        appHtml
      );
      return analyzeUrls(appHtml, buildContext.config.hostname);
    }

    if (page.meta.feeds.atom) {
      const atomUrl = new URL(
        buildContext.config.hostname,
        htmlNormalizeURL(pageCtx.originalUrl).replace(/\.html$/, "ATOM.xml")
      ).href;
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
      const rssUrl = new URL(
        buildContext.config.hostname,
        htmlNormalizeURL(pageCtx.originalUrl).replace(/\.html$/, "RSS.xml")
      ).href;
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
        otherUrls: fileToUrlMap.get(pageCtx.filePath),
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

        const [markerFreeHTML, markers] = analyzeIslandMarkers(appHtml);
        appHtml = markerFreeHTML;

        if (!buildContext.virtualModuleMap.has(virtualModuleId)) {
          markers.forEach((marker) => {
            page.global.components[marker.uid] = {
              path: marker.path,
              lazy: marker.lazy,
            };
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

    return rebuild ? [] : analyzeUrls(appHtml, buildContext.config.hostname);
  }

  polyfill(global, {
    exclude: "window document",
  });

  async function buildPages(urls: string[], history: string[]) {
    let buildsOps = [];
    urls.forEach((url) => {
      const res = router(url);
      if (res.filePath === "404") {
        buildContext.utils.consola.error(new Error(`404 ${url} not found`));
      } else {
        if (fileToUrlMap.has(res.filePath)) {
          fileToUrlMap.set(res.filePath, [
            ...fileToUrlMap.get(res.filePath),
            res.originalUrl,
          ]);
        } else {
          fileToUrlMap.set(res.filePath, [res.originalUrl]);
        }
        resolvedUrls.push(url);
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
  await vite.close();
  spinner.succeed("Pages rendered. Building JS!");

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

  return buildContext.fileToHtmlMap;
}
