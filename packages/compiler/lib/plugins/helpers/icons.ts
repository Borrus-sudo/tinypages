import Icons from "node-icons";
import { paramCase } from "param-case";
import type { Config } from "../../types";
import { wrapObject } from "../../utils";

let icons;
export default function (
  rawStr: string,
  ctx: { attrs?: Record<string, string>; config: Config }
): string {
  if (!icons) {
    icons = Icons(ctx.config.icons);
  }
  const seperator = ctx.config?.icons?.separator ?? ":";
  let base64: boolean = false;
  let iconName = rawStr;
  let defaultStyles = {};
  let styles = {};
  if (ctx.attrs) {
    //iconName passed as a component
    iconName = paramCase(rawStr).replace(/\-/g, seperator);
    base64 = typeof ctx.attrs["base64"] !== "undefined";
    if (base64) {
      delete ctx.attrs["base64"];
      defaultStyles = ctx.config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = ctx.config.defaultIconsStyles || {};
    }
    styles = { ...ctx.attrs, ...defaultStyles };
  } else {
    if (rawStr.startsWith("base64" + seperator)) {
      iconName = rawStr.split(seperator).slice(1).join(seperator);
      base64 = true;
      defaultStyles = ctx.config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = ctx.config.defaultIconsStyles || {};
    }
    styles = defaultStyles;
  }
  return icons.getIconsSync(
    iconName,
    base64 ? styles : wrapObject({ ...styles }),
    base64
  );
}
