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
  sanitizer?(html: string): string;
  silent?: boolean;
  smartLists?: boolean;
  smartypants?: boolean;
  xhtml?: boolean;
};

type Config = {
  marked?: MarkedConfig;
  icons?: IconsConfig;
};
export { Config };
