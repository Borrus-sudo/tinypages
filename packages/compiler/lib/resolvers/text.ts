import * as emoticon from "node-emoji";
import iconsTransformer from "./helpers/icons";
import codeTransformer from "./code";
import store from "../store";

const config = store.returnConfig();

export default function (payload: string) {
  const emojiTransformedText = emoticon.emojify(payload);
  const iconsTransformedText = emojiTransformedText.replace(
    /::([\s\S]*?)::/g,
    (fullText, payload) => {
      const iconSvg = iconsTransformer(payload);
      return iconSvg === "" ? fullText : iconSvg;
    }
  );
  if (!!config.renderKatex)
    return iconsTransformedText.replace(/`(.*?)`/g, (_fullText, payload) => {
      let [type, ...code] = payload.split(" ");
      return codeTransformer(code.join(" "), type, { inlineRender: true });
    });
  else return iconsTransformedText;
}
