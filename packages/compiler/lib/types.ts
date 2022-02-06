import type { UserConfig as UnoCSSConfig } from "@unocss/core";
import type { ILanguageRegistration, IThemeRegistration, Lang } from "shiki";

interface IHighlighterPaths {
  themes?: string;
  languages?: string;
}

type TrustContext = {
  command: string;
  url: string;
  protocol: string;
};

type IconsConfig = {
  installPkg: boolean;
  alias: Map<string, string>;
  prefix: string;
  separator: string;
};

type MarkedConfig = {
  baseUrl?: string;
  breaks?: boolean;
  gfm?: boolean;
  headerIds?: boolean;
  headerPrefix?: string;
  langPrefix?: string;
  mangle?: boolean;
  pedantic?: boolean;
  sanitize?: boolean;
  silent?: boolean;
  smartLists?: boolean;
  smartypants?: boolean;
  xhtml?: boolean;
};

type ShikiConfig = {
  theme?: IThemeRegistration;
  themes?: IThemeRegistration[];
  langs?: (Lang | ILanguageRegistration)[];
  paths?: IHighlighterPaths;
};

type KatexConfig = {
  output?: "html" | "mathml" | "htmlAndMathml" | undefined;
  leqno?: boolean | undefined;
  fleqn?: boolean | undefined;
  throwOnError?: boolean | undefined;
  errorColor?: string | undefined;
  macros?: any;
  minRuleThickness?: number | undefined;
  colorIsTextColor?: boolean | undefined;
  maxSize?: number | undefined;
  maxExpand?: number | undefined;
  strict?: boolean | string | Function | undefined;
  trust?: boolean | ((context: TrustContext) => boolean) | undefined;
  globalGroup?: boolean | undefined;
};

type UserConfig = {
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
};

type Meta = {
  styles: string;
  components: {
    componentLiteral: string;
    componentName: string;
    props: Record<string, string>;
    children: string;
  }[];
  headTags: string[];
  grayMatter: string;
} & Record<any, any>;

type Config = { metaConstruct: Meta } & Omit<UserConfig, "plugins"> & {
    plugins: Plugin[];
  };

type Plugin = {
  name: string;
  enforce?: "pre" | "post";
  defineConfig?: (config: Config) => void;
  transform: (id: string, payload: string, meta?: Meta) => string | void;
  getReady?: () => Promise<void> | void;
  tapArgs?: (id: string, args: any[]) => void | any[];
  postTransform?: (payload: string, meta?: Meta) => string | Promise<string>;
};

export { Config, Plugin, UserConfig, Meta };
