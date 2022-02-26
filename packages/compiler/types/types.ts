import {
  IconsConfig,
  KatexConfig,
  MarkedConfig,
  ShikiConfig,
  UnoCSSConfig,
} from "./options";

type Meta = {
  styles: string;
  components: {
    componentLiteral: string;
    componentName: string;
    props: Record<string, string>;
    children: string;
  }[];
  headTags: string[];
  head: Head;
  grayMatter: string;
} & Record<any, any>;

type Config = { metaConstruct: Meta } & Omit<UserConfig, "plugins"> & {
    plugins: Plugin[];
  };

interface UserConfig {
  marked?: MarkedConfig;
  icons?: IconsConfig;
  shiki?: ShikiConfig;
  katex?: KatexConfig;
  unocss?: UnoCSSConfig;
  headTags?: string[];
  minify?: boolean;
  format?: boolean;
  resolveUnoCSS?: boolean;
  renderMermaid?: boolean;
  renderKatex?: boolean;
  defaultIconsStyles?: Record<string, string>;
  defaultBase64IconsStyles?: Record<string, string>;
  plugins?: Plugin[];
}

interface Plugin {
  name: string;
  enforce?: "pre" | "post";
  defineConfig?: (config: Config) => void;
  transform: (id: string, payload: string, meta?: Meta) => string | void;
  getReady?: () => Promise<void> | void;
  tapArgs?: (id: string, args: any[]) => void | any[];
  postTransform?: (payload: string, meta?: Meta) => string | Promise<string>;
}

interface Head {
  title: string;
  meta: Array<Record<string, string>>;
  link: Array<{ rel: string } & Record<string, string>>;
  script: Array<{ type: string } & ({ src: string } | { innerHTML: string })>;
  noscript: Array<{ innerHTML: string }>;
  style: Array<{ type: string; cssText: string }>;
  htmlAttributes: Record<string, string>;
  titleAttributes: Record<string, string>;
  base: Record<string, string>;
}

export { Config, Plugin, UserConfig, Meta, Head };
