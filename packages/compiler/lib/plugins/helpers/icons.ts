import Icons from "node-icons";
import { paramCase } from "param-case";
import type { Config } from "../../../types/types";
import { wrapObject, stringifyObject } from "../../utils";

let icons;
export default function (
  svgId: string,
  context: { attrs?: Record<string, string>; config: Config }
): string {
  if (!icons) {
    icons = Icons(context.config.icons);
  }
  const seperator = context.config?.icons?.separator ?? ":";
  let iconName = svgId;
  let defaultStyles = context.config.defaultIconsStyles || {};
  let styles = {};

  const imgSrc = (svgId) => {
    const newId = svgId.split(seperator).join("/");
    const style = stringifyObject(defaultStyles, ":", true);
    return `<img src="~icons/${newId}" alt="${svgId}" style="${style}">`;
  };

  if (!svgId.endsWith(".inline")) {
    return imgSrc(svgId);
  }

  if (context.attrs) {
    //iconName passed as a component
    iconName = paramCase(svgId).replace(/\-/g, seperator);
    styles = { ...context.attrs, ...defaultStyles };
  } else {
    styles = defaultStyles;
  }

  return (
    icons.getIconsSync(iconName, wrapObject({ ...styles }), false) ||
    imgSrc(svgId)
  );
}
