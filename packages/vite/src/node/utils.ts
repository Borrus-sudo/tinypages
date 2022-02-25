import Helmet from "preact-helmet";

export function appendPrelude(content: string, headTags, styles: string) {
  const head = Helmet.rewind();
  const html = String.raw`
      <!doctype html>
      <html${head.htmlAttributes.toString()}>
          <head>
              ${head.title.toString()}
              ${head.meta.toString()}
              ${head.link.toString()}
              ${headTags.join("\n")}
          </head>
          <style>${styles}</style>
          <body>
              <div id="app">
                  ${content}
              </div>
          </body>
      </html>
  `;
  return html;
}
