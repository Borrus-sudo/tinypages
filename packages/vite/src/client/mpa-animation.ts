import { apply } from "million/router";

/**
 * -  Figure out the URL depth from where we are navigating
 * -  Select the appropriate element from there and apply `outgoing` animation class names
 * -  Use the URL depth in the apply hook and apply `incoming` css classes from there
 */

let url_depth, leave_dom_element: Element, animation_class_name;

window.addEventListener("million:navigate", (event) => {
  //@ts-ignore
  const url = new URL(event.detail.url);
  url_depth = url.pathname.split("/").length - 1;
  console.log({ url_depth });
  leave_dom_element = document.querySelector(`div[depth="${url_depth}"]`);
  console.log({ leave_dom_element });
  animation_class_name = leave_dom_element.getAttribute("class_name");
  leave_dom_element.classList.add(`${animation_class_name}-before-leave`);
});

apply((doc) => {
  const enter_dom_element = doc.querySelector(`div[depth="${url_depth}"]`);
  console.log({ enter_dom_element });
  enter_dom_element.classList.add(`${animation_class_name}-before-enter}`);
  leave_dom_element.classList.add(`${animation_class_name}-leave`);
  setTimeout(() => {
    const enter_dom_element = document.querySelector(
      `div[depth="${url_depth}"]`
    );
    enter_dom_element.classList.add(`${animation_class_name}-enter`);
  }, 0);
});
