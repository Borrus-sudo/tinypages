import store from "../../store";

const shiki = store.returnShikiInstance();

export default function (code: string, lang: string) {
  //@ts-ignore
  return shiki.codeToHtml(code, { lang });
}
