import path from "path";
import { useVite, useContext } from "../context";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { Liquid } from "liquidjs";
import * as Filters from "@11ty/eleventy-plugin-rss";
import kleur from "kleur";

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

async function buildRoute({ fileURL, markdown, page, isBuild }) {
  let jsUrl = fileURL.replace(/\.md$/, ".js");
  if (!existsSync(jsUrl)) {
    let tsUrl = fileURL.replace(/\.md$/, ".ts");
    if (existsSync(tsUrl)) {
      fileURL = tsUrl;
    } else {
      return {
        markdown,
        data: {},
      };
    }
  } else {
    fileURL = jsUrl;
  }

  const { utils } = useContext("iso");
  const vite = useVite();

  // some fields for page are polyfilled during build for this func to be isomorphic
  if (!page.reloads.includes(fileURL)) page.reloads.push(fileURL);

  let data;
  let loader;

  let { originalUrl } = page.pageCtx;

  if (fileLoader.has(fileURL)) {
    loader = fileLoader.get(fileURL);
  } else {
    loader = (await vite.ssrLoadModule(fileURL)).default;
    fileLoader.set(fileURL, loader);
  }

  data = await loader({
    ...page.pageCtx.params,
    __serve__: !isBuild,
    __url__: originalUrl,
  });

  if (!isBuild) {
    // no console clutter during build
    utils.logger.info(kleur.bold().bgBlue().white("State loaded!"));
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

export async function loadPage(fileURL: string, page, isBuild: boolean) {
  const { utils, config } = useContext("iso");
  const ops = [];

  do {
    // the main page is added to reloads too, so that a fileOnlyEntry of it can be made. It shall be picked up by
    // pageCtx.filePath change first and hence reload won't happen directly.
    page.reloads.push(fileURL);
    const markdown = await readFile(fileURL, { encoding: "utf-8" });
    ops.push(buildRoute({ fileURL, page, markdown, isBuild }));
    if (path.dirname(fileURL) === utils.pageDir) {
      // to prevent recursion
      if (fileURL === path.join(utils.pageDir, "root.md")) {
        break;
      }
      fileURL = path.join(utils.pageDir, "root.md");
    } else {
      fileURL = path.dirname(fileURL) + ".md";
    }
  } while (existsSync(fileURL));

  const output: { markdown: string; data: Object }[] = await Promise.all(ops);

  let toCompile = "",
    accumulatedData = {};

  output.reverse().forEach(({ markdown, data }, idx) => {
    if (!toCompile) {
      toCompile = markdown;
    } else {
      toCompile = toCompile.replace(
        /\<Outlet name=\"(.*?)\"\/\>/,
        (_, animation_name) =>
          `<p>|SDIV${idx}||${animation_name}|</p>\n` +
          markdown +
          "\n<p>|EDIV|</p>"
      );
    }
    accumulatedData = { ...data, ...accumulatedData };
  });

  const result = await engine.parseAndRender(toCompile, {
    ...accumulatedData,
    ssrProps: page.global.ssrProps,
    BASE_URL: config.hostname,
  });

  return result;
}

export function purgeLoaderCache(fileId: string) {
  fileLoader.delete(fileId);
}
