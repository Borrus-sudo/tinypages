import * as katex from "katex";
import config from "../../config";

const katexConfig = config.returnConfig().katex || {
  throwOnError: false,
  displayMode: true,
};
export default function (content: string, isMhcem: boolean) {
  if (isMhcem) {
    require("katex/contrib/mhchem");
  }
  return katex.renderToString(content, katexConfig);
}
