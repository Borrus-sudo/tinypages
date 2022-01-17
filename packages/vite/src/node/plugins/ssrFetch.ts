import { $fetch } from "ohmyfetch";
import type { Plugin } from "vite";

const reqCache: Map<string, string> = new Map();
async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
export default function (): Plugin {
  return {
    name: "vite-tinypages-ssrFetch",
    enforce: "pre",
    async transform(code: string, id: string, options) {
      if (!id.endsWith(".jsx") && !id.endsWith(".tsx")) return;
      let uid = 0;
      return await replaceAsync(
        code,
        /\$\$fetch\(\"(.*?)\"\)/g,
        async (payload: string) => {
          let payloadFetch;
          const fetchUid = uid++ + id;
          if (options.ssr) {
            payloadFetch = JSON.stringify(await $fetch(payload.slice(9, -2)));
            reqCache.set(fetchUid, payloadFetch);
          } else {
            reqCache.get(fetchUid) ||
              reqCache.set(
                fetchUid,
                JSON.stringify(await $fetch(payload.slice(9, -2)))
              );
            payloadFetch = reqCache.get(fetchUid);
          }
          return payloadFetch;
        }
      );
    },
  };
}
