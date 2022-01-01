import textTransformer from "./resolvers/expandables";
import componentTransformer from "./resolvers/component";

const metaConstruct = {
  components: [],
};

export default function createHandler() {
  return {
    methodReturn(info, payload) {
      if (info.propName === "html") {
        metaConstruct.components.push(...componentTransformer(payload));
      } else if (info.propName === "code") {
      } else if (info.propName === "text") {
        return payload;
      }
      return textTransformer(payload);
    },
  };
}
