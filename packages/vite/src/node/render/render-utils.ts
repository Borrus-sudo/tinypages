import type { Head } from "@tinypages/compiler";
import { existsSync } from "fs";
import path from "path";
import type { Page } from "../../../types/types";
import { createElement } from "../utils";
import { useContext } from "../context";

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

export function appendPrelude(content: string, page: Page) {
  const { utils } = useContext();
  page.meta.head.script.push({
    src: undefined,
    type: "text/javascript",
    innerHTML: `
    window.pageCtx=${JSON.stringify(page.pageCtx)};
    window.ssrProps=${JSON.stringify(page.global.ssrProps)}
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
