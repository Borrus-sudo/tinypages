import textTransformer from "./resolvers/text";
import codeTransformer from "./resolvers/code";
import htmlTransformer from "./resolvers/html";

let cache: string = "";
export default function createHandler() {
  return {
    methodReturn(info, payload) {
      if (info.propName === "html") {
        payload = htmlTransformer(payload);
      } else if (info.propName.startsWith("code")) {
        if (!!cache) {
          payload = cache;
          cache = "";
        }
      } else if (info.propName === "text") {
        return payload;
      }
      return textTransformer(payload);
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
