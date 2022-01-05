import Icons from "node-icons";
import { paramCase } from "param-case";
import store from "../../store";
import { wrapObject } from "../../utils";

const config = store.returnConfig();
const icons = Icons(config.icons);
export default function (
  rawStr: string,
  options?: { attrs: Record<string, string> }
): string {
  const seperator = config?.icons?.separator ?? ":";
  let base64: boolean = false;
  let iconName = rawStr;
  let defaultStyles = {};
  let styles = {};
  if (options) {
    //iconName passed as a component
    iconName = paramCase(rawStr).replace(/\-/g, seperator);
    base64 = typeof options.attrs["base64"] !== "undefined";
    if (base64) {
      delete options.attrs["base64"];
      defaultStyles = config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = config.defaultIconsStyles || {};
    }
    styles = { ...options.attrs, ...defaultStyles };
  } else {
    if (rawStr.startsWith("base64" + seperator)) {
      iconName = rawStr.split(seperator).slice(1).join(seperator);
      base64 = true;
      defaultStyles = config.defaultBase64IconsStyles || {};
    } else {
      defaultStyles = config.defaultIconsStyles || {};
    }
    styles = defaultStyles;
  }
  return icons.getIconsSync(
    iconName,
    base64 ? styles : wrapObject({ ...styles }),
    base64
  );
}
