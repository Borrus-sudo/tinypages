import * as Vite from "vite";
import type { PageCtx, ReducedPage, TinyPagesConfig } from "../../types/types";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { normalizeUrl } from "./utils";
import { createBuildPlugins } from "./plugins/build";
import { writeFileSync } from "fs";
import { compile } from "@tinypages/compiler";
import { render } from "./render/page";
import { appendPrelude } from "./render/render-utils";
import { generateVirtualEntryPoint } from "./plugins/plugin-utils";
import path from "path";
import { polyfill } from "@astropub/webapi";
import ora from "ora";
import { loadPage } from "./render/load-page";

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

  async function buildPage(pageCtx: PageCtx) {
    const { url } = pageCtx;
    const global = {
      ssrProps: {},
      components: {},
    };
    const buildLiquid = await loadPage(
      url,
      { reloads: [], global, pageCtx }, // quick workaround to make build and dev to be compatible
      true
    );
    const [rawHtml, meta] = await compile(buildLiquid, config.compiler);
    const page: ReducedPage = {
      meta,
      pageCtx,
      global,
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
    await Vite.build(buildContext.config.vite);
  }
  Object.keys(postFs).forEach((path) => {
    writeFileSync(path, postFs[path]);
  });
  return buildContext.fileToHtmlMap;
}
