import type { FrameworkModule, TinyPagesConfig } from "../../types/types";

export function pluginKit(plugins: FrameworkModule[]) {
  const pre: FrameworkModule[] = [];
  const post: FrameworkModule[] = [];
  const mainplugins: FrameworkModule[] = [];
  plugins.forEach((p) => {
    if (p.enforce === "pre") {
      pre.push(p);
    } else if (p.enforce === "post") {
      post.push(p);
    } else {
      mainplugins.push(p);
    }
  });
  const modules: FrameworkModule[] = [...pre, ...mainplugins, ...post];
  return {
    async defineConfig(c: TinyPagesConfig) {
      for (let m of modules) {
        await m?.defineConfig(c);
      }
    },
    resolveComponentPath(path: string): string {
      for (let m of modules) {
        const new_path = m?.resolveComponentPath(path);
        if (new_path) {
          return new_path;
        }
      }
      return "";
    },
    async editEntryFile(id: string, code: string) {
      for (let m of modules) {
        const new_code = await m?.editEntryFile(id, code);
        if (new_code) {
          code = new_code;
        }
      }
      return code;
    },
    async renderComponent(c, extra) {
      for (let m of modules) {
        const stringifiedComponent = await m?.renderComponent(c, extra);
        if (stringifiedComponent) {
          return stringifiedComponent;
        }
      }
      return "";
    },
  };
}
