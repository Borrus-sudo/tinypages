import { h } from "preact";
import Helmet from "preact-helmet";
import { Page } from "../types/types";
import renderToString from "preact-render-to-string";
import { createHash } from "crypto";

export function appendPrelude(content: string, page: Page) {
  const keys = Object.keys(page.global);
  if (keys.length > 0) {
    const clone = deepCopy(page.global);
    keys.forEach((key) => {
      delete clone[key].error;
      delete clone[key].path;
      delete clone[key].lazy;
      delete clone[key].props["no:hydrate"];
      delete clone[key].props["client:only"];
      delete clone[key].props["lazy:load"];
    });
    const scriptTag = `
    window.pageCtx=${JSON.stringify(page.pageCtx)};
    window.globals=${JSON.stringify(clone)};
  `.trim();
    page.meta.head.script.push({
      type: "text/javascript",
      innerHTML: scriptTag,
    });
  }

  const vnode = h(Helmet, page.meta.head, null);
  const string = renderToString(vnode); // renderToString the head to make Helmet.rewind work
  console.log("head", string);

  const HelmetHead = Helmet.rewind();
  const html = String.raw`
      <!doctype html>
      <html${HelmetHead.htmlAttributes.toString()}>
          <head>
              ${HelmetHead.title.toString()}
              ${HelmetHead.meta.toString()}
              ${HelmetHead.link.toString()}
              ${HelmetHead.script.toString()}
              ${HelmetHead.noscript.toString()}
              ${HelmetHead.base.toString()}
              ${HelmetHead.style.toString()}
              ${page.meta.headTags.join("\n")}
          </head>
          <body>
              <div id="app">
                  ${content}
              </div>
          </body>
      </html>
  `.trim();
  return html;
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function hash(content: string) {
  return createHash("md5").update(content).digest("hex");
}

export function normalizeUrl(url: string) {
  let normalizedUrl = url.endsWith("/")
    ? url + "index.md"
    : !/\.(.*?)$/.test(url)
    ? url + ".md"
    : url;
  normalizedUrl = normalizedUrl.replace(/\.html$/, ".md");
  return normalizedUrl;
}
