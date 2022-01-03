import Icons from "node-icons";
import { paramCase } from "param-case";
import store from "../../store";

const config = store.returnConfig();
const icons = Icons(config.icons);

export default function (
  rawStr: string,
  options?: { attrs: Record<string, string> }
): string {
  const seperator = config?.icons?.separator ?? ":";
  let base64: boolean = false;
  let iconName = rawStr;
  let styles = config.defaultIconsStyles || {
    width: `"1em"`,
    height: `"1em"`,
    viewBox: `"0 0 24 24"`,
  };
  if (options) {
    iconName = paramCase(rawStr).replace(/\-/g, seperator);
    base64 = typeof options.attrs["base64"] !== "undefined";
    if (base64) {
      delete options.attrs["base64"];
    }
    styles = options.attrs;
  } else {
    if (rawStr.startsWith("base64" + seperator)) {
      iconName = rawStr.split(seperator).slice(1).join(seperator);
      base64 = true;
    }
  }
  return icons.getIconsSync(
    iconName,
    base64 ? config.defaultBase64IconsStyles || {} : styles,
    base64
  );
}
