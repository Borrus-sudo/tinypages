import katex from "katex";
import { createRequire } from "module";
import type { Config } from "../../../types/types";

const require = createRequire(import.meta.url);
export default function (
  content: string,
  context: { type: string; inlineRender: boolean; config: Config }
): string {
  if (context.type === "katex-mhcem") {
    require("katex/contrib/mhchem");
  } //@ts-ignore
  context.config.katex.displayMode = !context.inlineRender;
  return katex.renderToString(
    content,
    context.config.katex || { throwOnError: false }
  );
}
