import { promises as fs } from "fs";
import * as path from "path";
import { normalizePath } from "vite";

const regex1 = /\/\[(.*?)\]\//g;
const regex2 = /\/\[(.*?)\]\./g;

const transformDynamicArgs = (input: string) => {
  if (!(regex1.test(input) && regex2.test(input))) {
    return [input, false];
  }
  const output = input.replace(regex1, "/:$1/").replace(regex2, "/:$1.");
  return [output, true];
};

const generateMockRoute = (input: string) => {
  const output = input.replace(regex1, "/$1/").replace(regex2, "/$1.");
  return output;
};

export function generateTypes(): [
  (props: Record<string, string | number>, url: string) => void,
  () => string
] {
  let schema = `/*start*/`;
  let edited = false;
  return [
    (props: Record<string, string | number>, url: string) => {
      edited = true;
      let type = ` {url:${url};params:{ `;
      Object.keys(props).forEach((key) => {
        type += `${key}:string;`;
      });
      schema += type + "}} |";
    },
    () => (edited ? schema.slice(0, -1) + " /*end*/;" : ""),
  ];
}

export async function loadPaths(
  root: string,
  router,
  dir: string,
  addType
): Promise<void> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      await loadPaths(root, router, path.join(dir, dirent.name), addType);
    } else {
      let filePath = path.join(dir, dirent.name);
      let url = normalizePath(filePath.split(root)[1]);
      const [output, generateFlag] = transformDynamicArgs(url);
      router.insert(output, { payload: filePath });
      if (generateFlag) {
        const { params } = router.lookup(generateMockRoute(url));
        if (params) addType(params, url);
      }
    }
  }
}
