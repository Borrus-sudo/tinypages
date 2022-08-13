import { murmurHash } from "ohash";
import { uid } from "uid";

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function hash(content: string) {
  return murmurHash(content);
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

export function htmlNormalizeURL(input: string) {
  let normalizedUrl = input.endsWith("/")
    ? input + "index.html"
    : /\..*?$/.test(input)
    ? input
    : input + ".html";
  return normalizedUrl.replace(/\..*?$/, ".html");
}

export async function replaceAsync(str, regex, aReplacer) {
  const substrs = [];
  let match;
  let i = 0;
  while ((match = regex.exec(str)) !== null) {
    // put non matching string
    substrs.push(str.slice(i, match.index));
    // call the async replacer function with the matched array spreaded
    substrs.push(aReplacer(...match));
    i = regex.lastIndex;
  }
  // put the rest of str
  substrs.push(str.slice(i));
  // wait for aReplacer calls to finish and join them back into string
  return (await Promise.all(substrs)).join("");
}

export function uuid() {
  return uid(5);
}

export function runOnExit(fn: () => void) {
  process.on("SIGINT", fn);
  process.on("SIGTERM", fn);
  process.on("exit", fn);
}

export const uidMap: Map<string, string> = new Map();
