import * as emoji from "node-emoji";
import iconsTransformer from "./helpers/icons";
import codeTransformer from "./code";

export default function (payload: string) {
  return payload.replace(/(::(.*?)::)|(`(.*?)`)|(:(.*?):)/g, (payload) => {
    if (payload.includes("<") || payload.includes(">")) {
      return payload;
    }
    if (payload.startsWith("::")) {
      const iconSvg = iconsTransformer(payload.slice(2, -2));
      return !!iconSvg ? iconSvg : payload;
    } else if (payload.startsWith("`")) {
      let [lang, ...code] = payload.slice(1, -1).split(" ");
      const codeTransform = codeTransformer(code.join(" "), lang, {
        inlineRender: true,
      });
      return !!codeTransform ? codeTransform : payload;
    } else {
      return emoji.get(payload);
    }
  });
}
