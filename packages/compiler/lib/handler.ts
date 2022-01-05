import codeTransformer from "./plugins/code";
import htmlTransformer from "./plugins/html";
import textTransformer from "./plugins/text";
import cssTransformer from "./plugins/css";

export let styles = ``;
export default function createHandler() {
  let cache: string = "";
  let cssTransform = cssTransformer();
  let lastText = false;
  return {
    methodReturn(info, payload) {
      if (lastText) {
        let newStyles;
        lastText = false;
        [payload, newStyles] = cssTransform.transform(payload);
        styles += ` ${newStyles}`;
        cssTransform.flush();
      }
      if (info.propName.startsWith("code")) {
        if (!!cache) {
          payload = cache;
          cache = "";
          return payload;
        }
      } else if (info.propName === "html") {
        return textTransformer(htmlTransformer(payload));
      } else if (info.propName === "text") {
        //cache css
        payload = cssTransform.load(payload);
        lastText = true;
        return textTransformer(payload);
      }
      return payload;
    },
    methodArguments(info, args) {
      if (info.propName === "link") {
      } else if (info.propName === "code") {
        const code = args[0];
        const lang = args[1];
        cache = codeTransformer(code, lang, {});
      } else if (info.propName === "codespan") {
        let [lang, ...code] = args[0].split` `;
        code = code.join` `;
        cache = codeTransformer(code, lang.trim(), { inlineRender: true });
      }
      return args;
    },
  };
}
