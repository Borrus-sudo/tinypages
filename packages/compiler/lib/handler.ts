import textTransformer from "./resolvers/expandables";
import componentTransformer from "./resolvers/component";
import codeTransformer from "./resolvers/code";
const metaConstruct = {
  components: [],
};
let cache: string = "";
export default function createHandler() {
  return {
    methodReturn(info, payload) {
      if (info.propName === "html") {
        metaConstruct.components.push(...componentTransformer(payload));
      } else if (info.propName === "code") {
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
        cache = codeTransformer(code, lang);
      }
      return args;
    },
  };
}
