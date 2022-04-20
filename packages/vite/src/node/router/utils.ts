import { promises as fs } from "fs";
import * as path from "path";
import { normalizePath } from "vite";

const regex1 = /\/\[(.*)\]\//g;
const regex2 = /\/\[(.*)\]\./g;
const regex3 = /\/\[\.\.\..*\]\..*/g;

function transformDynamicArgs(input: string) {
  const output = input
    .replace(regex3, "/**")
    .replace(regex1, "/:$1/")
    .replace(regex2, "/:$1.");
  return [
    output,
    !regex3.test(input) && (regex1.test(input) || regex2.test(input)),
  ];
}

function generateMockRoute(input: string) {
  const output = input.replace(regex1, "/$1/").replace(regex2, "/$1.");
  return output;
}

type addType = (
  props: Record<string, string | number>,
  url: string,
  includeProps?: boolean
) => void;

export function generateTypes(): [addType, () => string] {
  let schema = `/*start*/`;
  let edited = false;
  return [
    (props: Record<string, string | number>, url: string, include: boolean) => {
      edited = true;
      if (!include) {
        schema += `{url:"${url}";}|`;
        return;
      }
      let type = ` {url:"${url}";params:{ `;
      Object.keys(props).forEach((key) => {
        type += `${path.parse(key).name}:string;`;
      });
      schema += type + "}} |";
    },
    () => (edited ? schema.slice(0, -2) + ";/*end*/" : ""),
  ];
}

export async function loadPaths(
  root: string,
  router,
  dir: string,
  addType
): Promise<void> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const promises = [];
  for (let dirent of dirents) {
    if (dirent.isDirectory()) {
      promises.push(
        loadPaths(root, router, path.join(dir, dirent.name), addType)
      );
    } else {
      let filePath = path.join(dir, dirent.name);
      let url = normalizePath(filePath.split(root)[1]);
      const [output, generateFlag] = transformDynamicArgs(url);
      router.insert(output, { payload: filePath });
      if (generateFlag) {
        const { params } = router.lookup(generateMockRoute(url));
        if (params) addType(params, url, true);
      } else {
        addType(null, url, false);
      }
    }
  }
  await Promise.all(promises);
}
