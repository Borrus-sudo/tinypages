import katexRenderer from "./helpers/katex";
import highlighter from "./helpers/highlight";
import store from "../store";

const config = store.returnConfig();
export default function (
  code: string,
  lang: string,
  options: { inlineRender?: boolean }
) {
  switch (lang) {
    case "mermaid":
      if (!!config.renderMermaid) return "";
      break;
    case "katex":
      if (!!config.renderKatex)
        return katexRenderer(code, {
          type: "default",
          inlineRender: !!options.inlineRender,
        });
      break;
    case "katex-mhcem":
      if (!!config.renderKatex)
        return katexRenderer(code, {
          type: "mhcem",
          inlineRender: !!options.inlineRender,
        });
      break;
    default:
      return highlighter(code, lang);
  }
  return "";
}
