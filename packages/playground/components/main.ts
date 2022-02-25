export let hello = "Hello";

"/[id]/static/moarcrap/[hello].vue"
  .replace(/\/\[(.*?)\]\//g, "/:$1/")
  .replace(/\/\[(.*?)\]\./g, "/:$1.");
