import store from "../../store";

const parse = require("parse-key-value");
const shiki = store.returnShikiInstance();

export default function (code: string, lang: string) {
  //parse the lang for opts
  let keyValue: string | string[] = [];
  let options: Record<string, string> = { lang };
  if (lang.includes(" ")) {
    [lang, ...keyValue] = lang.split(" ");
    keyValue = keyValue.join(" ").slice(1, -1);
    options = { lang, ...parse(keyValue) };
  }
  //@ts-ignore
  return shiki.codeToHtml(code, options);
}
