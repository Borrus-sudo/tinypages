import { parse } from "node-html-parser";

export default function (payload) {
  const dom = parse(payload);
  const classes: string[] =
    payload
      .match(/\[(.*?)\]/)?.[0]
      ?.slice(1, -1)
      ?.replace(/ +/g, " ")
      ?.split(" ") ?? [];
  if (classes.length > 0) classes.forEach((_) => dom.classList.add(_));
  return dom.toString();
}
