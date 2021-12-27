export default {
  methodReturn(info, result) {
    console.log(result);
    if (info.propName === "text") {
      console.log("text result " + result);
      return result;
    }
    return result;
  },
  methodArguments(info, args) {
    console.log(args);
  },
};
