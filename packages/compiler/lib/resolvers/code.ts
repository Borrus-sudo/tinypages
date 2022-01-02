import katexRenderer from "./helpers/katex";
export default function (code: string, lang: string) {
  switch (lang) {
    case "mermaid":
      break;
    case "katex":
      return katexRenderer(code, false);
    case "katex-mhcem":
      return katexRenderer(code, true);
    default:
      break;
  }
}
