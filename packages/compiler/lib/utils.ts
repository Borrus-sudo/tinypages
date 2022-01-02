const validMarkedKeys = [
  "baseUrl",
  "breaks",
  "gfm",
  "headerIds",
  "langPrefix",
  "headerPrefix",
  "mangle",
  "pedantic",
  "sanitize",
  "silent",
  "smartLists",
  "smartypants",
  "xhtml",
];

export function appendPrelude(content: string) {
  return String.raw`<head></head>\n<body>${content}</body>`;
}

export function sanitizeMarkedConfig(markedConfig) {
  let subsetConfig = {};
  Object.keys(markedConfig).forEach((key) => {
    if (validMarkedKeys.includes(key)) {
      subsetConfig[key] = markedConfig[key];
    }
  });
  return subsetConfig;
}
