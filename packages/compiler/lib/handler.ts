import textTransformer from "./resolvers/expandablesResolver";
import componentTransformer from "./resolvers/component";

const metaConstruct = {
  components: [],
};

export default function createHandler() {
  return {
    methodReturn(info, payload) {
      if (info.propName === "text") {
        return textTransformer(payload);
      } else if (info.propName === "html") {
        metaConstruct.components.push(...componentTransformer(payload));
      } else if (info.propName === "code") {
        console.log(payload);
      }
      return payload;
    },
  };
}
