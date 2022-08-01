import {
  IconsConfig,
  KatexConfig,
  MarkedConfig,
  ShikiConfig,
  UnoCSSConfig,
} from "./options";

interface BaseMeta {
  styles: string;
  components: {
    componentLiteral: string;
    componentName: string;
    props: Record<string, any>;
    children: string;
  }[];
  headTags: string[];
  head: Head;
  grayMatter: Record<string, any>;
  feeds: {
    rss: string;
    atom: string;
  };
}

interface Meta extends BaseMeta {
  [key: string | number | symbol]: any;
}

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
  renderUnoCSS?: boolean;
  renderMermaid?: boolean;
  renderKatex?: boolean;
  defaultIconsStyles?: Record<string, string>;
  plugins?: Plugin[];
}

interface Plugin {
  name: string;
  enforce?: "pre" | "post";
  defineConfig?: (config: Config) => void;
  transform: (
    id: string,
    payload: string,
    ctx: { meta: Meta; persistentCache: Map<string, string>; isBuild: boolean }
  ) => string | void;
  getReady?: () => Promise<void> | void;
  tapArgs?: (id: string, args: any[]) => void | any[];
  postTransform?: (
    payload: string,
    ctx: { meta: Meta; persistentCache: Map<string, string> }
  ) => string | Promise<string>;
}

interface Head {
  title: string;
  meta: Array<Record<string, string>>;
  link: Array<{ rel: string } & Record<string, string>>;
  script: Array<{ type: string; src: string; innerHTML: string }>;
  noscript: Array<{ innerHTML: string }>;
  style: Array<{ type: string; cssText: string }>;
  htmlAttributes: Record<string, string>;
  titleAttributes: Record<string, string>;
  base: Array<Record<string, string>>;
}

export { Config, Plugin, UserConfig, Meta, Head, UnoCSSConfig, IconsConfig };
