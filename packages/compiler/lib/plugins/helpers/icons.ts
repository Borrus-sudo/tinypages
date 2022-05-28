import Icons from "node-icons";
import { paramCase } from "param-case";
import type { Config } from "../../../types/types";
import { wrapObject } from "../../utils";

let icons;
export default function (
  rawStr: string,
  context: { attrs?: Record<string, string>; config: Config }
): string {
  if (!icons) {
    icons = Icons(context.config.icons);
  }
  const seperator = context.config?.icons?.separator ?? ":";
  let base64: boolean = false;
  let iconName = rawStr;
  let defaultStyles = {};
  let styles = {};
  if (context.attrs) {
    //iconName passed as a component
    iconName = paramCase(rawStr).replace(/\-/g, seperator);
    base64 = typeof context.attrs["base64"] !== "undefined";
    if (base64) {
      delete context.attrs["base64"];
      defaultStyles = context.config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = context.config.defaultIconsStyles || {};
    }
    styles = { ...context.attrs, ...defaultStyles };
  } else {
    if (rawStr.startsWith("base64" + seperator)) {
      iconName = rawStr.split(seperator).slice(1).join(seperator);
      base64 = true;
      defaultStyles = context.config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = context.config.defaultIconsStyles || {};
    }
    styles = defaultStyles;
  }
  return icons.getIconsSync(
    iconName,
    base64 ? styles : wrapObject({ ...styles }),
    base64
  );
}
