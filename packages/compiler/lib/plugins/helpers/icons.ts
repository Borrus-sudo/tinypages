import Icons from "node-icons";
import type { Config } from "../../../types/types";
import { wrapObject, stringifyImageStyle, delimiter } from "../../utils";

let icons;
export default function (
  svgId: string,
  context: { attrs?: Record<string, string>; config: Config }
): string {
  if (!icons) {
    icons = Icons(context.config.icons);
  }

  if (!svgId.startsWith("i-")) {
    return;
  }
  svgId = svgId.slice(2);

  const seperator = context.config?.icons?.separator ?? ":";
  let defaultStyles = context.config.defaultIconsStyles || {};
  const originalId = svgId;
  let styles = {};

  if (context.attrs) {
    //iconName passed as a component
    svgId = svgId.replace(/\-/g, seperator);
    styles = { ...context.attrs, ...defaultStyles };
  } else {
    styles = defaultStyles;
  }

  const imgSrc = (svgId, notCustom = true) => {
    let srcId = "~/icons/" + svgId;
    if (notCustom) srcId = "~/icons/" + svgId.split(seperator).join("/");
    const style = stringifyImageStyle(defaultStyles);
    return `<img src="${srcId}" alt="${svgId}" style="${style}" ${
      context.attrs?.class ? "class=" + context.attrs.class : ""
    }>`;
  };

  if (!svgId.endsWith(`${delimiter}inline`)) {
    return imgSrc(svgId);
  }

  svgId = svgId.split(`${delimiter}inline`)[0];

  return (
    icons.getIconsSync(svgId, wrapObject({ ...styles }), false) ||
    imgSrc(originalId, false)
  );
}
