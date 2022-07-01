import type { Head } from "@tinypages/compiler";
import { existsSync } from "fs";
import path from "path";
import type { PageCtx, ReducedPage } from "../../../types/types";
import { createElement, htmlNormalizeURL } from "../utils";
import { useContext } from "../context";
import { readFileSync } from "fs";

function renderHead(head: Head, headTags) {
  const title = createElement("title", head.titleAttributes, head.title);
  const metas = head.meta.map((meta) => createElement("meta", meta, ""));
  const links = head.link.map((link) => createElement("link", link, ""));
  const scripts = head.script.map((script) =>
    createElement(
      "script",
      { type: script.type, src: script.src },
      script.innerHTML || ""
    )
  );
  const noscripts = head.noscript.map((noscript) =>
    createElement("noscript", {}, noscript.innerHTML || "")
  );
  const styles = head.style.map((style) =>
    createElement("style", { type: style.type }, style.cssText || "")
  );
  const bases = head.base.map((base) => createElement("base", base, ""));
  const renderedHead = createElement(
    "head",
    {},
    `
      ${title}
      ${metas.join("\n")}
      ${links.join("\n")}
      ${scripts.join("\n")}
      ${noscripts.join("\n")}
      ${bases.join("\n")}
      ${styles.join("\n")}
      ${headTags.join("\n")}
    `
  );
  return renderedHead;
}

export function appendPrelude(content: string, page: ReducedPage) {
  const { utils } = useContext("iso");
  page.meta.head.script.push({
    src: undefined,
    type: "text/javascript",
    innerHTML: `
    window.pageCtx=${JSON.stringify(page.pageCtx, (key, val) =>
      key === "url" ? undefined : val
    )};
    window.ssrProps=${JSON.stringify(page.global.ssrProps)};
    `,
  });
  const cssUrl = page.pageCtx.url
    .replace(/\.md$/, ".css")
    .replace(path.sep + "pages" + path.sep, path.sep + "styles" + path.sep);
  const globalUrl = path.join(utils.stylesDir, "global.css");
  if (existsSync(globalUrl)) {
    page.meta.head.link.push({
      rel: "stylesheet",
      href: `/styles/global.css`,
    });
  }
  if (existsSync(cssUrl)) {
    page.meta.head.link.push({
      rel: "stylesheet",
      href: `/styles/${path.basename(cssUrl)}`,
    });
  }

  const renderedHead = renderHead(page.meta.head, page.meta.headTags);
  const pageHtml = createElement(
    "html",
    page.meta.head.htmlAttributes,
    `${renderedHead}
      <body>
        <div id="app">
            ${content}
        </div>
      </body>`
  );
  const html = `<!doctype html>\n${pageHtml}`;
  return html;
}

type P = {
  url: string;
  root: string;
  appHtml: string;
  ssrProps: Record<string, string>;
  head: Head;
  pageCtx: PageCtx;
  otherUrls: string[]; // for new dynamic pages, we need to pick up information from previously built pages
};

export function appendPreludeRebuild({
  url,
  root,
  appHtml,
  head,
  ssrProps,
  otherUrls,
  pageCtx,
}: P) {
  let normalizedUrl;
  let toReadPath;
  /**
   * For the rebuild strategy to work for new dynamic urls for the same file paths.
   */
  const all = [url, ...otherUrls];
  do {
    normalizedUrl = htmlNormalizeURL(all.shift());
    toReadPath = path.join(root, "dist", normalizedUrl);
  } while (existsSync(toReadPath));

  const artifact = readFileSync(toReadPath, { encoding: "utf-8" });
  const artifactHead = artifact.match(/\<head\>([\s\S]*)\<\/head\>/)[0];
  const title = createElement("title", head.titleAttributes, head.title);
  const metas = head.meta.map((meta) => createElement("meta", meta, ""));
  const renderedHead = artifactHead
    .replace(/\<meta.*?\/\>/, "")
    .replace(/\<title\>.*?\<\/title\>/, "")
    .replace(
      /window.ssrProps\=(.*?)\;/,
      `window.ssrProps=${JSON.stringify(ssrProps)};`
    )
    .replace(
      // to work universally for both changed and newly added page to a dynamic file path.
      /window.pageCtx\=(.*?)\;/,
      `window.pageCtx=${JSON.stringify(pageCtx, (key, val) =>
        key === "url" ? undefined : val
      )}`
    )
    .replace("<head>", `<head>${title}\n${metas.join("\n")}`);

  const output = createElement(
    "html",
    head.htmlAttributes,
    `${renderedHead}
    <body>
      <div id="app">
        ${appHtml}
      </div>
    </body>`
  );
  return output;
}
