import * as emoticon from "node-emoji";
import iconsTransformer from "./helpers/icons";

export default function (payload: string) {
  const transformedText = emoticon.emojify(payload);
  return transformedText.replace(/::(.*?)::/, (fullText, payload) => {
    const iconSvg = iconsTransformer(payload);
    return iconSvg === "" ? fullText : iconSvg;
  });
}
