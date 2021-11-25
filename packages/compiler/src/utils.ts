export function appendPrelude(content: string) {
  return String.raw`<head></head>\n<body>${content}</body>`;
}


