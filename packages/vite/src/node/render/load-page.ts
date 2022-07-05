import path from "path";
import { useVite, useContext } from "../context";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { Liquid } from "liquidjs";
import * as Filters from "@11ty/eleventy-plugin-rss";

const ssrTimestampCache = new Map();
const propsCache = new Map();
const engine = new Liquid({
  cache: true,
  tagDelimiterLeft: "{%",
  tagDelimiterRight: "%}",
  outputDelimiterLeft: "{{",
  outputDelimiterRight: "}}",
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

async function buildRoute({ fileURL, markdown, page, isBuild, paginate }) {
  const { utils, config } = useContext("iso");
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
    data = await loader(page.pageCtx.params, paginate);

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
      data = await loader(page.pageCtx.params, paginate);
      utils.consola.success("State loaded!");

      ssrTimestampCache.set(originalUrl, new Date().getTime()); // for better accuracy this is being done
      propsCache.set(originalUrl, data);
    } else {
      utils.consola.success("State loaded from cache!");
      data = propsCache.get(originalUrl);
    }
  }

  if (typeof page.global.ssrProps === "object" && data.ssrProps) {
    page.global.ssrProps = { ...page.global.ssrProps, ...data.ssrProps };
  } else {
    page.global.ssrProps = data?.ssrProps || {};
  }

  /**
   * Combine all the ssrProps in page.global, and delete from individual data.
   */
  delete data["ssrProps"];

  return { markdown, data };
}

export async function loadPage(
  fileURL: string,
  page,
  isBuild: boolean,
  paginate: { prev: string[]; next: string[] }
) {
  const { utils, config } = useContext("iso");

  const ops = [];
  do {
    page.reloads.push(fileURL);
    const markdown = await readFile(fileURL, { encoding: "utf-8" });
    ops.push(buildRoute({ fileURL, page, markdown, isBuild, paginate }));
    if (path.dirname(fileURL) === utils.pageDir) {
      fileURL = path.join(utils.pageDir, "root.md");
    } else {
      fileURL = path.dirname(fileURL) + ".md";
    }
  } while (existsSync(fileURL));

  const output: { markdown: string; data: Object }[] = await Promise.all(ops);

  let toCompile = "",
    accumulatedData = {};

  output.reverse().forEach(({ markdown, data }) => {
    if (!toCompile) {
      toCompile = markdown;
    } else {
      toCompile = toCompile.replace("<Outlet/>", markdown);
    }
    accumulatedData = { ...data, ...accumulatedData };
  });

  const result = engine.parseAndRender(toCompile, {
    ...accumulatedData,
    ssrProps: page.global.ssrProps,
    BASE_URL: config.hostname,
  });
  return result;
}
