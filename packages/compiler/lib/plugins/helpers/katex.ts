import * as katex from "katex";
import store from "../../store";

const config = store.returnConfig();

export default function (
  content: string,
  options: { type: "default" | "mhcem"; inlineRender: boolean }
): string {
  if (options.type === "mhcem") {
    require("katex/contrib/mhchem");
  }
  //@ts-ignore
  config.katex.displayMode = !options.inlineRender;
  return katex.renderToString(content, config.katex || { throwOnError: false });
}
