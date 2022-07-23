import { compile } from "@tinypages/compiler";
import htmlMinifier from "html-minifier";
import path from "path";
import * as Vite from "vite";
import type { PageCtx, ReducedPage } from "../../types/types";
import { useContext, useVite } from "./context";
import { loadPage } from "./render/load-page";
import { render } from "./render/page";
import {
  appendPrelude,
  appendPreludeRebuild,
  generateVirtualEntryPoint,
} from "./render/render-utils";
import { htmlNormalizeURL } from "./utils";

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

const markdownCompilerCache: Map<string, string> = new Map();

export async function buildPage(pageCtx: PageCtx) {
  const ctx = useContext("iso");
  const vite = useVite();
  const { filePath } = pageCtx;
  const global = {
    ssrProps: {},
    components: {},
  };

  const buildLiquid = await loadPage(
    filePath,
    { reloads: [], global, pageCtx }, // quick workaround to make build and dev to be compatible
    true
  );

  const [rawHtml, meta] = await compile(
    buildLiquid,
    ctx.config.compiler,
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
      utils: ctx.utils, //@ts-ignore
      page,
      config: ctx.config,
    },
    true
  );

  //   if (isGrammarCheck) {
  //     buildContext.fileToHtmlMap.set(
  //       { filePath: url, url: pageCtx.originalUrl },
  //       appHtml
  //     );
  //     return analyzeUrls(appHtml, buildContext.config.hostname);
  //   }

  if (page.meta.feeds.atom) {
    const atomUrl = new URL(
      ctx.config.hostname,
      htmlNormalizeURL(pageCtx.originalUrl).replace(/\.html$/, "ATOM.xml")
    ).href;
    const atomFSPath = path.join(ctx.config.vite.root, "dist", atomUrl);
    ctx.postFS[atomFSPath] = page.meta.feeds.atom;
    page.meta.head.link.push({
      rel: "alternate",
      type: "application/rss+xml",
      title: "Subscribe to What's New!",
      href: atomUrl,
    });
  }
  if (page.meta.feeds.rss) {
    const rssUrl = new URL(
      ctx.config.hostname,
      htmlNormalizeURL(pageCtx.originalUrl).replace(/\.html$/, "RSS.xml")
    ).href;
    const rssFSPath = path.join(ctx.config.vite.root, "dist", rssUrl);
    ctx.postFS[rssFSPath] = page.meta.feeds.atom;
    page.meta.head.link.push({
      rel: "alternate",
      type: "application/rss+xml",
      title: "Subscribe to What's New!",
      href: rssUrl,
    });
  }

  let output: string;
  if (ctx.isRebuild) {
    output = appendPreludeRebuild({
      url: pageCtx.originalUrl,
      root: ctx.config.vite.root,
      appHtml,
      head: page.meta.head,
      ssrProps: page.global.ssrProps,
      otherUrls: ctx.fileToURLMap.get(pageCtx.filePath),
      pageCtx,
    });
  } else {
    if (Object.keys(page.global.components).length > 0) {
      const virtualModuleId =
        "/" + Vite.normalizePath(filePath).replace(/\.md$/, ".js");

      page.meta.head.script.push({
        type: "module",
        src: virtualModuleId,
        innerHTML: undefined,
      });

      const [markerFreeHTML, markers] = analyzeIslandMarkers(appHtml);
      appHtml = markerFreeHTML;

      if (!ctx.virtualModuleMap.has(virtualModuleId)) {
        markers.forEach((marker) => {
          page.global.components[marker.uid] = {
            path: marker.path,
            lazy: marker.lazy,
          };
        });
        ctx.virtualModuleMap.set(
          virtualModuleId,
          generateVirtualEntryPoint(
            page.global.components,
            ctx.config.vite.root,
            true
          )
        );
      }
    }
    output = appendPrelude(appHtml, page);
  }

  ctx.fileToHtmlMap.set(
    { filePath: filePath, url: pageCtx.originalUrl },
    htmlMinifier.minify(output, {
      collapseWhitespace: true,
      caseSensitive: true,
      collapseInlineTagWhitespace: false,
      minifyJS: true,
      minifyCSS: true,
    })
  );

  return ctx.isRebuild ? [] : analyzeUrls(appHtml, ctx.config.hostname);
}
