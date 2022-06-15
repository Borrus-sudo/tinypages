import path from "path";
import { useVite, useContext } from "../context";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { Liquid } from "liquidjs";

const { utils } = useContext("iso");
const ssrTimestampCache = new Map();
const propsCache = new Map();
const engine = new Liquid({
  cache: true,
});

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
    const { default: loader } = await vite.ssrLoadModule(fileURL);
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

export async function loadPage(
  fileURL: string,
  page = {
    global: {},
    reloads: [],
  },
  isBuild: boolean
): Promise<string[]> {
  const vite = useVite();
  const toReload = []; // for dev hmr
  const ops = [];
  do {
    const parentPath = path.dirname(fileURL) + ".md";
    if (!existsSync(parentPath)) {
      break;
    }
    const markdown = await readFile(fileURL);
    ops.push(buildRoute({ fileURL, page, markdown, isBuild }));
    fileURL = parentPath;
  } while (path.dirname(fileURL) !== utils.pageDir);
  if (existsSync(path.join(utils.pageDir, "root.md"))) {
    const markdown = await readFile(path.join(utils.pageDir, "root.md"));
    ops.push(buildRoute({ fileURL, page, markdown, isBuild }));
  }
  return toReload;
}
