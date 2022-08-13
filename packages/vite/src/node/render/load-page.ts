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
const parsedFiles: Map<string, any> = new Map();

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

async function buildLiquidPage(
  markdown: string,
  {
    isBuild,
    context,
    pageUID,
  }: { isBuild: boolean; context: Record<string, any>; pageUID: string }
) {
  let output;
  if (isBuild) {
    let parsedFile;
    if (parsedFiles.has(pageUID)) {
      parsedFile = parsedFiles.get(pageUID);
    } else {
      parsedFile = engine.parse(markdown);
      parsedFiles.set(pageUID, parsedFile);
    }
    output = await engine.render(parsedFile, context);
  } else {
    output = await engine.parseAndRender(markdown, context);
  }
  return output;
}

async function buildRoute({ fileURL, markdown, page, isBuild, hostname }) {
  let jsUrl = fileURL.replace(/\.md$/, ".js");
  if (!existsSync(jsUrl)) {
    let tsUrl = fileURL.replace(/\.md$/, ".ts");
    if (existsSync(tsUrl)) {
      fileURL = tsUrl;
    } else {
      let response = await buildLiquidPage(markdown, {
        isBuild,
        context: { BASE_URL: hostname },
        pageUID: fileURL,
      });
      return {
        markdown: response,
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
  markdown = await buildLiquidPage(markdown, {
    isBuild,
    pageUID: fileURL,
    context: Object.assign({}, data || {}, { BASE_URL: hostname }),
  });

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
    ops.push(
      buildRoute({
        fileURL,
        page,
        markdown,
        isBuild,
        hostname: config.hostname,
      })
    );
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

  let result = "";

  output.reverse().forEach(({ markdown }, idx) => {
    if (!result) {
      result = markdown;
    } else {
      result = result.replace(
        /\<Outlet( name=\"(.*?)\")?\/\>/,
        (_, __, animation_name) =>
          `<div depth="${idx + 1}" ${
            animation_name ? `class_name="${animation_name}"` : ""
          }">` +
          markdown +
          "</div>"
      );
    }
  });

  return result;
}

export function purgeLoaderCache(fileId: string) {
  fileLoader.delete(fileId);
}
