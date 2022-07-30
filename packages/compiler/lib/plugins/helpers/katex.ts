import katex from "katex";
import { createRequire } from "module";
import { murmurHash } from "ohash";
import type { Config } from "../../../types/types";

const require = createRequire(import.meta.url);
export default function (
  content: string,
  context: {
    type: string;
    inlineRender: boolean;
    config: Config;
    persistentCache: Map<string, string>;
  }
): string {
  const hash = murmurHash(content).toString();
  if (context.persistentCache.has(hash)) {
    return context.persistentCache.get(hash);
  }
  if (context.type === "katex-mhcem") {
    require("katex/contrib/mhchem");
  } //@ts-ignore
  context.config.katex.displayMode = !context.inlineRender;
  const result = katex.renderToString(
    content,
    context.config.katex || { throwOnError: false }
  );
  context.persistentCache.set(hash, result);
  return result;
}
