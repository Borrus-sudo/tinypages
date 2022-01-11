import { parse } from "node-html-parser";
import type { Config, Plugin } from "../types";

function generateCSS(html, config: Config) {
  const { Processor } = require("windicss/lib");
  const { HTMLParser } = require("windicss/utils/parser");
  const processor = new Processor();
  const parser = new HTMLParser(html);
  const baseStyle = processor.compile(``).styleSheet;
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
    .reduce((acc, curr) => acc.extend(curr), baseStyle)
    .build(config.minify);

  return [outputHTML, styles];
}
export function PluginCSS(): Plugin {
  let lastText = false,
    classes: string[] = [],
    config: Config;
  return {
    defineConfig(_config) {
      config = _config;
    },
    transform(id: string, payload: string) {
      if (id === "text" && config.resolveWindiCss) {
        lastText = true;
        return payload.replace(/\[(.*?)\]/g, (_, full) => {
          classes.push(...full.replace(/ +/g, " ").split(" "));
          return "";
        });
      } else if (lastText) {
        lastText = false;
        if (classes.length > 0) {
          const dom = parse(payload);
          //@ts-ignore
          classes.forEach((c) => dom.childNodes?.[0]?.classList.add(c));
          classes = [];
          return dom.toString();
        }
      }
      return payload;
    },
    postTransform(payload) {
      if (!config.resolveWindiCss) return payload;
      const [html, css] = generateCSS(payload, config);
      config.metaConstruct.styles = css;
      return html;
    },
  };
}
