import { h } from "preact";
import Helmet from "preact-helmet";
import { Page } from "../types";

export function appendPrelude(content: string, page: Page) {
  h(Helmet, page.head, []);
  const HelmetHead = Helmet.rewind();
  const scriptTag = `
      <script>
        window.pageCtx=${JSON.stringify(page.pageCtx)};
        window.globals=${JSON.stringify(page.global, ["props", "error"])};
      </script>`.trim();
  page.head.script.push({
    type: "text/javascript",
    innerHTML: scriptTag,
  });
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
