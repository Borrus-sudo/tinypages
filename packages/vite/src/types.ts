import { ViteDevServer } from "vite";

type Meta = {
  styles: string;
  components: {
    componentLiteral: string;
    componentName: string;
    props: Record<string, string>;
    children: string;
  }[];
  headTags: string[];
};

type cascadeContext = {
  html: string;
  meta: Meta;
  root: string;
  vite: ViteDevServer;
  compile: Function;
};

type Bridge = {
  currentUrl: string;
  preservedScriptGlobal: string;
};

export { cascadeContext, Meta, Bridge };
