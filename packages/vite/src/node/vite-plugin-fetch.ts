import { $fetch } from "ohmyfetch";
import type { Plugin } from "vite";

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
export function fetchIt(): Plugin {
  return {
    name: "vite-tinypages-fetchIt",
    enforce: "pre",
    async transform(code: string, id: string) {
      if (!id.endsWith(".jsx") && !id.endsWith(".tsx")) return;
      return await replaceAsync(
        code,
        /\$fetch\(\"(.*?)\"\)/g,
        async (payload: string) => {
          return await $fetch(payload.slice(8, -2));
        }
      );
    },
  };
}
