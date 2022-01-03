import katexRenderer from "./helpers/katex";
import highlighter from "./helpers/highlight";
export default function (
  code: string,
  lang: string,
  options: { inlineRender?: boolean }
) {
  switch (lang) {
    case "mermaid":
      break;
    case "katex":
      return katexRenderer(code, {
        type: "default",
        inlineRender: !!options.inlineRender,
      });
    case "katex-mhcem":
      return katexRenderer(code, {
        type: "mhcem",
        inlineRender: !!options.inlineRender,
      });
    default:
      return highlighter(code, lang);
  }
}
