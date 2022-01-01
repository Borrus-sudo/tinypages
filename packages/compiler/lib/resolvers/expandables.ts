import * as emoticon from "node-emoji";
import Icons from "node-icons";
import config from "../config";

const icons = Icons(config.returnConfig().icons);
export default function (payload: string) {
  const transformedText = emoticon.emojify(payload);
  return transformedText.replace(/::(.*?)::/, (fullText, payload) => {
    const iconSvg = icons.getIconsSync(
      payload,
      { width: `"10"`, height: `"10"` },
      false
    );
    return iconSvg === "" ? fullText : iconSvg;
  });
}
