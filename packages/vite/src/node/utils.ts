import consolaPkg from "consola";
import { murmurHash } from "ohash";

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function hash(content: string) {
  return murmurHash(content);
}

export function normalizeUrl(url: string) {
  let normalizedUrl = url.endsWith("/")
    ? url + "index.md"
    : /\..*?$/.test(url)
    ? url
    : url + ".md";
  return normalizedUrl.replace(/\.html$/, ".md");
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
  if (["meta", "link", "base"].includes(tag)) {
    return `<${tag} ${paramsString}>`;
  }
  return `<${tag} ${paramsString}>${content}</${tag}>`;
}
