import { parse } from "node-html-parser";
import Icons from "node-icons";
import { paramCase } from "param-case";
import store from "../../store";

const config = store.returnConfig();
const icons = Icons(config.icons);

export default function (rawStr: string): string {
  const parsedComponent = parse(rawStr);
  const isComponent = parsedComponent.childNodes[0].nodeType == 1;
  const seperator = config?.icons?.separator ?? ":";
  let base64: boolean = false;
  let iconName = rawStr;
  let styles = config.defaultIconsStyles || {
    width: `"1em"`,
    height: `"1em"`,
    viewBox: `"0 0 24 24"`,
  };
  if (isComponent) {
    //@ts-ignore
    const rawTagName = parsedComponent.childNodes[0].rawTagName;
    //@ts-ignore
    const rawAttrs = parsedComponent.childNodes[0].rawAttrs;
    iconName = paramCase(rawTagName).replace(/\-/g, seperator);
    if (rawAttrs) {
      base64 = rawAttrs.includes("base64");
      if (base64) {
        //@ts-ignore
        delete parsedComponent.childNodes[0].attrs["base64"];
      }
      //@ts-ignore
      styles = parsedComponent.childNodes[0].attrs;
    }
  } else {
    console.log(rawStr);

    if (rawStr.startsWith("base64" + seperator)) {
      iconName = rawStr.split(seperator).slice(1).join(seperator);
      console.log(iconName);

      base64 = true;
    }
  }
  return icons.getIconsSync(iconName, styles, base64);
}
