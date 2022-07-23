import * as Vite from "vite";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { createBuildPlugins } from "./plugins/build";
import { writeFileSync } from "fs";
import { polyfill } from "@astropub/webapi";
import sitemap from "vite-plugin-pages-sitemap";
import { resolveConfig } from "./resolve-config";
import path from "path";
import { buildPage } from "./build-utils";

type Params = {
  config: Object & { root: string };
  rebuild: boolean;
};

export async function build({ config: cliViteConfig, rebuild }: Params) {
  let ctx, urls, vite;
  const [routerQuery, router] = fsRouter(
    path.join(cliViteConfig.root, "pages")
  );

  await Promise.all([
    async () => {
      const { config } = await resolveConfig(cliViteConfig);
      const [_ctx, _vite] = await createBuildContext(
        config,
        createBuildPlugins
      );
      _ctx.isRebuild = rebuild;
      ctx = _ctx;
      vite = _vite;
      polyfill(global, {
        exclude: "window document",
      });
    },
    async () => {},
  ]);

  async function buildPages(urls: string[]) {
    let ops = [];
    urls.forEach((url) => {
      const res = routerQuery(url);
      ctx.seenURLs.push(url);
      if (res.filePath === "404") {
        ctx.utils.logger.error(`404 ${url} not found`);
      } else {
        if (ctx.fileToUrlMap.has(res.filePath)) {
          ctx.fileToUrlMap.set(res.filePath, [
            ...ctx.fileToUrlMap.get(res.filePath),
            res.originalUrl,
          ]);
        } else {
          ctx.fileToUrlMap.set(res.filePath, [res.originalUrl]);
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

  await buildPages(urls);
  await Promise.all([Vite.build(ctx.config.vite), vite.close()]);

  if (!rebuild) {
    //@ts-ignore
    sitemap.default({
      routes: [...ctx.seenURLs].map((route) => route.replace(/\.md$/, ".html")),
      hostname: ctx.config.hostname,
    });
  }

  Object.keys(ctx.postFS).forEach((path) => {
    writeFileSync(path, ctx.postFS[path]);
  });

  return ctx.fileToHtmlMap;
}
