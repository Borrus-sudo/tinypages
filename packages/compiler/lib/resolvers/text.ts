import * as emoji from "node-emoji";
import iconsTransformer from "./helpers/icons";
import codeTransformer from "./code";

export default function (payload: string) {
  return payload.replace(
    /(::(.*?)::)|(`(.*?)`)|(:(.*?):)/g,
    (_fullText, ...payload) => {
      if (payload[1]) {
        const iconSvg = iconsTransformer(payload[1]);
        return iconSvg === "" ? payload[0] : iconSvg;
      } else if (payload[3]) {
        let [lang, ...code] = payload[3].split(" ");
        const codeTransform = codeTransformer(code.join(" "), lang, {
          inlineRender: true,
        });
        codeTransform ? codeTransform : payload[2];
      } else if (payload[5]) {
        return emoji.get(payload[5]);
      }
    }
  );
}
