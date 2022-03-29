import consolaPkg from "consola";
import { murmurHash } from "ohash";
import { h } from "preact";
import Helmet from "preact-helmet";
import renderToString from "preact-render-to-string";
import env from "std-env";
import { Page } from "../types/types";

export function appendPrelude(content: string, page: Page) {
  const keys = Object.keys(page.global);

  if (keys.length > 0) {
    const clone = deepCopy(page.global);

    keys.forEach((key) => {
      // delete different tags which aren't needed on the server
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

  h(Helmet, page.meta.head, null);
  const string = renderToString(Helmet); // renderToString the head to make Helmet.rewind work
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
  return murmurHash(content);
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

export function createConsola() {
  const { Consola, BasicReporter, FancyReporter, LogLevel } =
    consolaPkg as unknown as typeof import("consola");

  //@ts-ignore
  let level = env.debug
    ? LogLevel.Debug //@ts-ignore
    : env.test
    ? LogLevel.Warn
    : LogLevel.Info;
  if (process.env.CONSOLA_LEVEL) {
    level = parseInt(process.env.CONSOLA_LEVEL) || level;
  }

  // Create new consola instance
  const consola = new Consola({
    level, //@ts-ignore
    reporters: [env.ci || env.test ? new BasicReporter() : new FancyReporter()],
  });
  return consola;
}
