import katex from "katex";
import { createRequire } from "module";
import type { Config } from "../../../types/types";

const require = createRequire(import.meta.url);
export default function (
  content: string,
  ctx: { type: string; inlineRender: boolean; config: Config }
): string {
  if (ctx.type === "katex-mhcem") {
    require("katex/contrib/mhchem");
  } //@ts-ignore
  ctx.config.katex.displayMode = !ctx.inlineRender;
  return katex.renderToString(
    content,
    ctx.config.katex || { throwOnError: false }
  );
}
