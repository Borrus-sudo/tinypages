import type { Config } from "../../types";
import * as katex from "katex";

export default function (
  content: string,
  ctx: { type: string; inlineRender: boolean; config: Config }
): string {
  if (ctx.type === "katex-mhcem") {
    require("katex/contrib/mhchem");
  }
  //@ts-ignore
  ctx.config.katex.displayMode = !ctx.inlineRender;
  return katex.renderToString(
    content,
    ctx.config.katex || { throwOnError: false }
  );
}
