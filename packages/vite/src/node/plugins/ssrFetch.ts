import { $fetch } from "ohmyfetch";
import ora from "ora";
import type { Plugin } from "vite";
import type { ResolvedConfig } from "../../types";

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
export default function ({ bridge }: ResolvedConfig): Plugin {
  return {
    name: "vite-tinypages-ssrFetch",
    enforce: "pre",
    async transform(code: string, id: string, options) {
      if (!id.endsWith(".jsx") && !id.endsWith(".tsx")) return;
      //Simply inject the pageCtx in ssr since in client it will be available globally
      if (options.ssr) {
        code = `const pageCtx=${JSON.stringify(bridge.pageCtx)}; \n` + code;
      } else {
        //remove the pageProps since the output is injected in component[id].props and to prevent size wastage
        code = code.replace(/export pageProps/, "");
      }
      let uid = 0;
      return await replaceAsync(
        code,
        /\$\$fetch\(\"(.*?)\"\)/g,
        async (payload: string) => {
          let payloadFetch;
          const fetchUid = uid++ + id;
          const url = payload.slice(9, -2);
          const spinnner = ora(`Loading ${url}`);
          try {
            if (options.ssr) {
              spinnner.start();
              spinnner.color = "yellow";
              payloadFetch = JSON.stringify(
                reqCache.get(url) || (await $fetch(url))
              );
              reqCache.set(fetchUid, payloadFetch);
              spinnner.succeed(`Successfully fetched ${url}!`);
            } else {
              payloadFetch = reqCache.get(fetchUid);
            }
            return payloadFetch;
          } catch (e) {
            spinnner.fail(`${e.stack}`);
            return payload;
          }
        }
      );
    },
  };
}
