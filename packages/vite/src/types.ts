import { ViteDevServer } from "vite";

type Meta = {
  styles: string;
  components: {
    componentLiteral: string;
    componentName: string;
    props: string;
    children: string;
  }[];
};

type cascadeContext = {
  html: string;
  meta: Meta;
  root: string;
  vite: ViteDevServer;
  compile: Function;
};

export { cascadeContext, Meta };
