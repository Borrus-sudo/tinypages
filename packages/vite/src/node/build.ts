import * as Vite from "vite";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { createBuildPlugins } from "./plugins/build";
import { writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { polyfill } from "@astropub/webapi";
import sitemap from "vite-plugin-pages-sitemap";
import { resolveConfig } from "./resolve-config";
import path from "path";
import { buildPage } from "./build-utils";
import { BuildContext } from "../../types/types";
import kleur from "kleur";

type Params = {
  config: Object & { root: string };
  rebuild: boolean;
};

interface Cache {
  fileToURLMap: Map<string, string>;
}

export async function build({ config: cliViteConfig, rebuild }: Params) {
  let ctx: BuildContext, urls, vite, artifact: Cache;
  let routerQuery;

  await Promise.all([
    async () => {
      [routerQuery] = fsRouter(path.join(cliViteConfig.root, "pages"));
      polyfill(global, {
        exclude: "window document",
      });
      const { config } = await resolveConfig(cliViteConfig);
      const [_ctx, _vite] = await createBuildContext(
        config,
        createBuildPlugins
      );
      _ctx.isRebuild = rebuild;
      ctx = _ctx;
      vite = _vite;
    },
    async () => {
      // load urls
    },
    async () => {
      artifact = JSON.parse(
        await readFile(path.join(cliViteConfig.root, ".tinypages/cache.json"), {
          encoding: "utf-8",
        })
      );
    },
  ]);

  async function buildPages(urls: string[]) {
    let ops = [];
    urls.forEach((url) => {
      const res = routerQuery(url);
      ctx.seenURLs.add(url);
      if (res.filePath === "404") {
        ctx.utils.logger.error(kleur.red(`404 ${url} not found`));
      } else {
        // file to url map is loaded from the build artifact
        if (
          ctx.fileToURLMap.has(res.filePath) &&
          !ctx.fileToURLMap.get(res.filePath).includes(res.originalUrl)
        ) {
          ctx.fileToURLMap.set(res.filePath, [
            ...ctx.fileToURLMap.get(res.filePath),
            res.originalUrl,
          ]);
        } else {
          ctx.fileToURLMap.set(res.filePath, [res.originalUrl]);
        }
      }
      ops.push(buildPage(res));
    });

    const newPossibleUrls = await Promise.all(ops);
    const newUrls = [];
    newPossibleUrls.flat().forEach((url) => {
      if (!ctx.seenURLs.has(url)) {
        newUrls.push(url);
        ctx.seenURLs.add(url);
      }
    });

    if (newUrls.length > 0) {
      await buildPages(newUrls);
    }
  }

  if (rebuild) {
    //@ts-ignore
    ctx.fileToURLMap = artifact.fileToURLMap;
  }
  await buildPages(urls);
  await Promise.all([Vite.build(ctx.config.vite), vite.close()]);

  const sitemapConfig = ctx.config.defaultModulesConfig.sitemap;
  //@ts-ignore
  sitemap.default({
    routes: [...ctx.seenURLs]
      .filter((url) => !sitemapConfig.exclude.includes(url))
      .map((route) => route.replace(/\.md$/, ".html"))
      .concat(sitemapConfig.include),
    hostname: ctx.config.hostname,
    changefreq: sitemapConfig.changefreq,
    lastmod: sitemapConfig.lastmod,
    priority: sitemapConfig.priority,
  });

  Object.keys(ctx.postFS).forEach((path) => {
    writeFileSync(path, ctx.postFS[path]);
  });

  return ctx.fileToHtmlMap;
}
