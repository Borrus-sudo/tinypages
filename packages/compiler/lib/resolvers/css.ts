import { parse } from "node-html-parser";

export default function () {
  let classes: string[] = [];
  return {
    load(text: string) {
      return text.replace(/\[(.*?)\]/g, (_, full) => {
        classes.push(...full.replace(/ +/g, " ").split(" "));
        return "";
      });
    },
    flush() {
      classes = [];
    },
    transform(html: string) {
      console.log(classes);
      if (classes.length > 0) {
        const dom = parse(html);
        //@ts-ignore
        classes.forEach((c) => dom.childNodes?.[0]?.classList.add(c));
        return dom.toString();
      }
      return html;
    },
  };
}
