import { Processor } from "windicss/lib";
import { HTMLParser } from "windicss/utils/parser";
import type { Config } from "../../types";

export default function (html, config: Config) {
  const processor = new Processor();
  const parser = new HTMLParser(html);
  const preflightSheet = processor.preflight(html);
  const PREFIX = "windi-";
  const outputCSS = [];
  let outputHTML = "";
  let indexStart = 0;

  parser.parseClasses().forEach((p) => {
    outputHTML += html.substring(indexStart, p.start);

    const style = processor.compile(p.result, PREFIX);
    outputCSS.push(style.styleSheet);
    outputHTML += [style.className, ...style.ignored].join(" ");
    indexStart = p.end;
  });
  outputHTML += html.substring(indexStart);

  // Build styles
  const styles = outputCSS
    // extend the preflight sheet with each sheet from the stack
    .reduce((acc, curr) => acc.extend(curr), preflightSheet)
    .build(config.minify);

  return [outputHTML, styles];
}
