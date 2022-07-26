/// <reference lib="dom" />

const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(async (mutation) => {
    if (mutation.attributeName === "class" && mutation.target) {
      const class_list = Array.from(
        (mutation.target as Element).classList || []
      );
      const prev_locate_string = (mutation.target as Element).getAttribute(
        "locate_string"
      );
      const new_locate_string = class_list.join(" ");
      const searchParams = new URLSearchParams();
      searchParams.set("to_replace", prev_locate_string);
      searchParams.set("replace_with", new_locate_string);
      (mutation.target as Element).setAttribute(
        "locate_string",
        new_locate_string
      );
      await fetch("/__EDIT?" + searchParams.toString(), {
        method: "PUT",
      });
    }
  });
});

mutationObserver.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
