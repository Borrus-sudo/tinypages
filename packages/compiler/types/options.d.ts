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

interface IconsConfig {
  installPkg?: boolean;
  alias?: Map<string, string>;
  prefix?: string;
  separator?: string;
}

interface MarkedConfig {
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
}

interface ShikiConfig {
  theme?: IThemeRegistration;
  themes?: IThemeRegistration[];
  langs?: (Lang | ILanguageRegistration)[];
  paths?: IHighlighterPaths;
}

interface KatexConfig {
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
}

export { KatexConfig, MarkedConfig, ShikiConfig, IconsConfig, UnoCSSConfig };
