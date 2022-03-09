import { $fetch } from "ohmyfetch";
import ora from "ora";
import type { Plugin } from "vite";
import { useContext } from "../context";

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
  const reqCache: Map<string, string> = new Map();

  return {
    name: "vite-tinypages-ssrFetch",
    enforce: "pre",
    async resolveId(id: string) {
      if (id.startsWith("fetch:")) {
        const url = id.split("fetch:")[1];
        const res = await $fetch(url);
        reqCache.set(url, res);
        return id;
      }
    },
    load(id: string) {
      if (id.startsWith("fetch:")) {
        const url = id.split("fetch:")[1];
        return `export default ${JSON.stringify(reqCache.get(url))}`;
      }
    },
    async transform(code: string, id: string, options) {
      if (
        !id.endsWith(".jsx") &&
        !id.endsWith(".tsx") &&
        !id.endsWith(".ts") &&
        !id.endsWith(".js")
      )
        return;
      return await replaceAsync(
        code,
        /\$\$fetch\([\"\`\'][\s\S]*[\"\`\']\)/g,
        async (payload: string) => {
          let payloadFetch;
          const url = payload.slice(9, -2);
          const spinner = ora(`Loading ${url}`);
          spinner.color = "yellow";
          const fetchNReturn = async () => {
            spinner.start();
            const value = await $fetch(url);
            spinner.succeed(`Successfully fetched ${url}!`);
            return value;
          };
          try {
            if (options.ssr) {
              payloadFetch = JSON.stringify(
                reqCache.get(url) || (await fetchNReturn())
              );
              reqCache.set(url, payloadFetch);
            } else {
              payloadFetch = reqCache.get(url);
            }
            return payloadFetch;
          } catch (e) {
            spinner.fail(`${e.stack}`);
            return payload;
          }
        }
      );
    },
  };
}
