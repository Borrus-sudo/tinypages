import { Head } from "@tinypages/compiler";
import consolaPkg from "consola";
import { murmurHash } from "ohash";
import type { Page } from "../../types/types";

function renderHead(head: Head, headTags) {
  const title = createElement("title", head.titleAttributes, head.title);
  const metas = head.meta.map((meta) => createElement("meta", meta, ""));
  const links = head.link.map((link) => createElement("link", link, ""));
  const scripts = head.script.map((script) =>
    createElement(
      "script",
      { type: script.type, src: script.src },
      script.innerHTML
    )
  );
  const noscripts = head.noscript.map((noscript) =>
    createElement("noscript", {}, noscript.innerHTML)
  );
  const styles = head.style.map((style) =>
    createElement("style", { type: style.type }, style.cssText)
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

export function appendPrelude(content: string, page: Page) {
  page.meta.head.script.push({
    src: undefined,
    type: "text/javascript",
    innerHTML: `
    window.pageCtx=${JSON.stringify(page.pageCtx)};
    window.ssrProps=${JSON.stringify(page.global.ssrProps)}
    `,
  });
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

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function hash(content: string) {
  return murmurHash(content);
}

export function normalizeUrl(url: string) {
  let normalizedUrl = url.endsWith("/")
    ? url + "index.md"
    : url.replace(/\.html$/, ".md");
  return normalizedUrl;
}

export function createConsola() {
  const { Consola, FancyReporter, LogLevel } =
    consolaPkg as unknown as typeof import("consola");

  const consola = new Consola({
    level: LogLevel.Debug,
    reporters: [new FancyReporter()],
  });

  return consola;
}

export function isUpperCase(input: string) {
  return input.toUpperCase() === input;
}

export function createElement(
  tag: string,
  params: Record<string, any>,
  content: string
) {
  const paramsString = Object.keys(params).reduce((prev, curr) => {
    if (typeof params[curr] === "undefined") {
      return prev;
    } else {
      if (params[curr] === null) {
        return `${prev} ${curr}`;
      } else {
        return `${prev} ${curr}="${params[curr]}"`;
      }
    }
  }, "");
  return `<${tag} ${paramsString}>${content}</${tag}>`;
}
