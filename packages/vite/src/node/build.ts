import * as Vite from "vite";
import { createBuildContext } from "./context";
import { fsRouter } from "./router/fs";
import { createBuildPlugins } from "./plugins/build";
import { unlinkSync, writeFileSync } from "fs";
import { polyfill } from "@astropub/webapi";
import sitemap from "vite-plugin-pages-sitemap";
import { resolveConfig } from "./resolve-config";
import { createCaches } from "./load-n-save";
import { giveComponentCache } from "./render/page";
import path from "path";
import { buildPage } from "./build-utils";
import { BuildContext } from "../../types/types";
import kleur from "kleur";
import { Cache } from "./swr-cache";
import { loadConfig } from "unconfig";
import task from "tasuku";
import { htmlNormalizeURL } from "./utils";
import { options } from "preact";

type Params = {
  config: Object & { root: string };
  rebuild: boolean;
};

export async function build(
  { config: cliViteConfig, rebuild }: Params,
  isCI: boolean
) {
  let ctx: BuildContext, global_urls_store, vite;
  let markdown_cache: Cache<string, string>,
    islands_cache: Cache<string, string>;
  let routerQuery;
  const rebuildMeta = {
    seenURLS: new Set<string>(),
    fileToURLMap: new Map<string, string[]>(),
    remove: [],
  };
  const urls_cache = new Cache<string, string[]>(
    path.join(cliViteConfig.root, ".tinypages", "cache_urls.json")
  );

  const asyncOps = [
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
      let { config } = await loadConfig<{
        rebuild: () => Promise<{ new: string[]; remove: string[] }>;
        build: () => Promise<string[]>;
      }>({
        sources: [
          {
            files: "manifest",
            // default extensions
            extensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json", ""],
          },
        ],
        cwd: path.join(cliViteConfig.root, "pages"),
      });
      if (rebuild) {
        await urls_cache.hydrate();
        const urlsRebuild = await config.rebuild();
        if (!urlsRebuild.new) {
          urlsRebuild.new = [];
        }
        if (!urlsRebuild.remove) {
          urlsRebuild.remove = [];
        }
        global_urls_store = urlsRebuild.new;
        rebuildMeta.remove = urlsRebuild.remove;
        urlsRebuild.new.forEach((_) => {
          rebuildMeta.seenURLS.add(_);
        });
        rebuildMeta.fileToURLMap = urls_cache.return();
        for (let key of rebuildMeta.fileToURLMap.keys()) {
          const thisURLS = rebuildMeta.fileToURLMap
            .get(key)
            .filter((_) => !urlsRebuild.remove.includes(_));
          thisURLS.forEach((_) => {
            rebuildMeta.seenURLS.add(_);
          });
          rebuildMeta.fileToURLMap.set(key, thisURLS);
        }
      } else {
        global_urls_store = await config.build();
      }
    },
    async () => {
      let { islands_cache: islands, markdown_cache: markdown } =
        await createCaches(cliViteConfig.root, true);
      markdown_cache = markdown;
      islands_cache = islands;
      giveComponentCache(islands_cache);
    },
  ];

  if (isCI) {
    await Promise.all(asyncOps);
  } else {
    await Promise.all([
      task("🧾 Loading config!", async ({ setTitle }) => {
        await asyncOps[0]();
        setTitle("🧾 Config loaded!");
      }),
      task("🧐 Loading URls!", async ({ setTitle }) => {
        await asyncOps[1]();
        setTitle("🧐 URLs loaded!");
      }),
      task("📂 Loading cache!", async ({ setTitle }) => {
        await asyncOps[2]();
        setTitle("📂 Cache loaded!");
      }),
    ]);
  }

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
      ops.push(buildPage(res, markdown_cache));
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
    ctx.fileToURLMap = rebuildMeta.fileToURLMap;
    ctx.seenURLs = rebuildMeta.seenURLS;
  }

  const concurrentOps = [
    async () => {
      await buildPages(global_urls_store);
    },
    async () => {
      await vite.close();
      await Vite.build(ctx.config.vite);
      if (rebuild) {
        const outDir = path.join(cliViteConfig.root, "dist");
        rebuildMeta.remove.forEach((_) => {
          unlinkSync(path.join(outDir, htmlNormalizeURL(_)));
        });
      }
    },
    () => {
      const sitemapConfig = ctx.config.defaultModulesConfig.sitemap;
      //@ts-ignore
      sitemap.default({
        routes: [...ctx.seenURLs]
          .map((url) => url.split(".md")[0])
          .filter((url) => !sitemapConfig.exclude.includes(url))
          .concat(sitemapConfig.include)
          .map(
            (route) => route + (route.endsWith("/") ? "index.html" : ".html")
          ),
        hostname: ctx.config.hostname,
        changefreq: sitemapConfig.changefreq,
        lastmod: sitemapConfig.lastmod,
        priority: sitemapConfig.priority,
        dest: "dist", // since we are writing to disk after vite magic!
      });
      Object.keys(ctx.postFS).forEach((path) => {
        writeFileSync(path, ctx.postFS[path]);
      });
    },
  ];

  if (isCI) {
    await concurrentOps[0]();
    await concurrentOps[1]();
    concurrentOps[2]();
  } else {
    await task.group((task) => [
      task("🎯 Rendering pages!", async ({ setTitle }) => {
        await concurrentOps[0]();
        setTitle("🎯 Pages rendered!");
      }),
      task("Waiting for Task 1", async ({ setTitle }) => {
        setTitle("💎 Vite magic ongoing!");
        await concurrentOps[1]();
        setTitle("💎 Vite build successful!");
      }),
      task("Waiting for Task 2", async ({ setTitle }) => {
        setTitle("🗺 Writing sitemap");
        concurrentOps[2]();
        setTitle("🗺 Sitemap written");
      }),
    ]);
  }

  /**
   * rebuild is only partial and hence we will save previous stuff as well
   */

  markdown_cache.save(!rebuild);
  islands_cache.save(!rebuild);
  urls_cache.setCache(ctx.fileToURLMap);
  urls_cache.save(true); // the new cache is set to the latest defaults

  return ctx.fileToHtmlMap;
}
