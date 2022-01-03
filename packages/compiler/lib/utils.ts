import store from "./store";
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
  return String.raw`<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
       ${store.returnHead().join("\n")} 
      <title>Document</title>
  </head>
  
  <body>
      ${content} 
  </body>
  
  </html>`;
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
