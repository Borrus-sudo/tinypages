import { h } from "preact";
import Helmet from "preact-helmet";
import { Page } from "../types";
import renderToString from "preact-render-to-string";

export function appendPrelude(content: string, page: Page) {
  const scriptTag = `
    window.pageCtx=${JSON.stringify(page.pageCtx)};
    window.globals=${JSON.stringify(page.global)};
  `.trim();
  page.meta.head.script.push({
    type: "text/javascript",
    innerHTML: scriptTag,
  });

  // render head to string;
  // to make Helmet.rewind work
  const stuff = renderToString(h(Helmet, page.meta.head, null));
  console.log(stuff);
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
