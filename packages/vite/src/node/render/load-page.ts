import path from "path";
import { useVite, useContext } from "../context";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { Liquid } from "liquidjs";
import * as Filters from "@11ty/eleventy-plugin-rss";

const { utils } = useContext("iso");
const ssrTimestampCache = new Map();
const propsCache = new Map();
const engine = new Liquid({
  cache: true,
});
const fileLoader: Map<string, Function> = new Map();

engine.filters.create("dateToRfc3339", Filters.dateToRfc3339);
engine.filters.create("dateToRfc822", Filters.dateToRfc822);
engine.filters.create(
  "getNewestCollectionItemDate",
  Filters.getNewestCollectionItemDate
);
engine.filters.create("absoluteUrl", Filters.absoluteUrl);
engine.filters.create(
  "convertHtmlToAbsoluteUrls",
  Filters.convertHtmlToAbsoluteUrls
);

async function buildRoute({ fileURL, markdown, page, isBuild }) {
  const vite = useVite();
  let jsUrl = fileURL.replace(/\.md$/, ".js");
  if (!existsSync(jsUrl)) {
    let tsUrl = fileURL.replace(/\.md$/, ".ts");
    if (existsSync(tsUrl)) {
      fileURL = tsUrl;
    } else {
      return markdown;
    }
  } else {
    fileURL = jsUrl;
  }

  if (!page.reloads.includes(fileURL)) page.reloads.push(fileURL);
  let data;

  /**
   * caching strategy for better hmr during dev
   */
  let { originalUrl } = page.pageCtx;
  let currTimestamp = new Date().getTime();

  if (isBuild || !ssrTimestampCache.has(originalUrl)) {
    // it is imperative to use originalUrl

    //boilerplate stuff
    let loader;
    if (isBuild) {
      if (fileLoader.has(fileURL)) {
        loader = fileLoader.get(fileURL);
      } else {
        loader = (await vite.ssrLoadModule(fileURL)).default;
        fileLoader.set(fileURL, loader);
      }
    } else {
      loader = (await vite.ssrLoadModule(fileURL)).default;
    }
    data = await loader(page.pageCtx.params);

    if (!isBuild) {
      utils.consola.success("State loaded!");
      ssrTimestampCache.set(originalUrl, currTimestamp);
      propsCache.set(originalUrl, data);
    }
  } else {
    const prevTimestamp = ssrTimestampCache.get(originalUrl) ?? 0;
    const offset = 120 * 1000;

    // cache expired
    if (currTimestamp - prevTimestamp > offset) {
      // boilerplate stuff
      const { default: loader } = await vite.ssrLoadModule(fileURL);
      data = await loader(page.pageCtx.params);
      utils.consola.success("State loaded!");

      ssrTimestampCache.set(originalUrl, new Date().getTime()); // for better accuracy this is being done
      propsCache.set(originalUrl, data);
    } else {
      utils.consola.success("State loaded from cache!");
      data = propsCache.get(originalUrl);
    }
  }

  page.global.ssrProps = data?.ssrProps || {};

  const builtMarkdown = await engine.parseAndRender(markdown, data);
  return builtMarkdown;
}

export async function loadPage(fileURL: string, page, isBuild: boolean) {
  const ops = [];
  do {
    page.reloads.push(fileURL);
    const markdown = await readFile(fileURL);
    ops.push(buildRoute({ fileURL, page, markdown, isBuild }));
    if (path.dirname(fileURL) === utils.pageDir) {
      fileURL = path.join(utils.pageDir, "root.md");
    } else {
      fileURL = path.dirname(fileURL) + ".md";
    }
  } while (existsSync(fileURL));
  const output: string[] = await Promise.all(ops);
  const result = output
    .reverse()
    .slice(1)
    .reduce(
      (prevValue, thisValue) => prevValue.replace("<Outlet/>", thisValue),
      output[0]
    );
  return result;
}