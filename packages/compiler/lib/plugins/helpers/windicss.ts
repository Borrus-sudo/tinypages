import { Processor } from "windicss/lib";
import { HTMLParser } from "windicss/utils/parser";
import type { Config } from "../../types";

export default function (html, config: Config) {
  const processor = new Processor();
  const parser = new HTMLParser(html);
  const preflightSheet = processor.preflight(html);
  const castArray = (val) => (Array.isArray(val) ? val : [val]);
  const attrs = parser.parseAttrs().reduceRight((acc, curr) => {
    const attrKey = curr.key;
    if (attrKey === "class" || attrKey === "className") return acc;
    const attrValue = castArray(curr.value);
    if (attrKey in acc) {
      const attrKeyValue = castArray(acc[attrKey]);
      acc[attrKey] = [...attrKeyValue, ...attrValue];
    } else {
      acc[attrKey] = attrValue;
    }
    return acc;
  }, {});

  const styles = processor
    .attributify(attrs)
    .styleSheet.extend(preflightSheet)
    .build(!!config.minify);
  return styles;
}
