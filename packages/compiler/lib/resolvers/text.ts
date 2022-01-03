import * as emoticon from "node-emoji";
import iconsTransformer from "./helpers/icons";
import katexRenderer from "./helpers/katex";
import store from "../store";

const config = store.returnConfig();

export default function (payload: string) {
  const emojiTransformedText = emoticon.emojify(payload);
  const iconsTransformedText = emojiTransformedText.replace(
    /::([\s\S]*?)::/g,
    (fullText, payload, ...args) => {
      const iconSvg = iconsTransformer(payload);
      return iconSvg === "" ? fullText : iconSvg;
    }
  );
  if (!!config.renderKatex)
    return iconsTransformedText.replace(/`(.*?)`/g, (_fullText, payload) => {
      let [type, ...code] = payload.split(" ");
      return katexRenderer(code.join(" "), { type, inlineRender: true });
    });
  else return iconsTransformedText;
}
