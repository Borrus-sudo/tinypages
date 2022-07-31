import { murmurHash } from "ohash";
import { renderCodeToHTML, runTwoSlash } from "shiki-twoslash";

const entryMap = new Map<string, string>();

export function renderTwoSlash({
  persistentCache,
  code,
  lang,
  highlighter,
  entryId,
  options,
}) {
  const hash: string = murmurHash(code).toString();
  if (persistentCache.has(hash)) {
    return persistentCache.get(hash);
  } else {
    const twoslash = runTwoSlash(
      (entryMap.get(entryId) + "\n" + code).trim(),
      lang
    );
    const result = renderCodeToHTML(
      twoslash.code,
      lang,
      { twoslash: true, ...options },
      null,
      highlighter,
      twoslash
    );
    persistentCache.set(hash, result);
    return result;
  }
}

export function addMainIncludeTwoSlash(code: string, name: string) {
  const lines: string[] = [];
  code.split("\n").forEach((line) => {
    if (line.trim().startsWith("// -")) {
      const number = line.split("// -")[1].trim();
      entryMap.set(name + "-" + number, lines.join("\n"));
    } else {
      lines.push(line);
    }
  });
  entryMap.set(name, lines.join("\n"));
}

export function renderShiki({
  persistentCache,
  highlighter,
  code,
  options,
  lang,
}) {
  const hash = murmurHash(code).toString();
  if (persistentCache.has(hash)) {
    return persistentCache.get(hash);
  } else {
    const result = highlighter.codeToHtml(code, { lang, ...options });
    persistentCache.set(hash, result);
    return result;
  }
}
