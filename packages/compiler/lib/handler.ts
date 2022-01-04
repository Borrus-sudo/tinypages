import codeTransformer from "./resolvers/code";
import htmlTransformer from "./resolvers/html";
import textTransformer from "./resolvers/text";
import cssTransformer from "./resolvers/css";

let cache: string = "";
let cssTransform = cssTransformer();
let lastText = false;
export default function createHandler() {
  return {
    methodReturn(info, payload) {
      if (lastText) {
        lastText = false;
        payload = cssTransform.transform(payload);
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
