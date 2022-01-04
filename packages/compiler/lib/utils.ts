import store from "./store";

export function appendPrelude(content: string) {
  return String.raw`<!DOCTYPE html><html><head>${store
    .returnHead()
    .join("\n")}</head><body>${content}</body></html>`;
}

export function wrapObject(styles: Record<string, string>) {
  Object.keys(styles).forEach((key) => {
    styles[key] = `"${styles[key]}"`;
  });
  return styles;
}
