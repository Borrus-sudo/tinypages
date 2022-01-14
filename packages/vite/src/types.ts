import { ViteDevServer } from "vite";

type cascadeContext = {
  html: string;
  meta: { components: string[]; styles: string };
  root: string;
  vite: ViteDevServer;
  compile: Function;
};

export { cascadeContext };
