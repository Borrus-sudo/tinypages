import type {
  IconsConfig,
  UnoCSSConfig,
  UserConfig as CompilerConfig,
} from "@tinypages/compiler";
import type { Server } from "connect";
import { ComponentFactory } from "preact";
import type { UserConfig as ViteUserConfig } from "vite";
import type {
  ImagePresets,
  Options as ImageOptions,
} from "vite-plugin-image-presets";

interface IconsModuleConfig extends IconsConfig {
  defaultIconsStyles?: Record<string, string>;
  load?: (id: string) => Promise<string> | void;
}

interface ImageModuleConfig {
  presets?: ImagePresets;
  options?: ImageOptions;
}

interface SitemapConfig {
  /**
   * include and exclude are resolved to blank arrays by resolve config
   */
  include: string[];
  exclude: string[];
  changefreq?: string;
  priority?: string;
  lastmod?: Date;
}

/**
 * Config for the inbuild stuff the framework offers.
 */
interface DefaultModulesConfig {
  image: ImageModuleConfig;
  unocss: UnoCSSConfig;
  icons: IconsModuleConfig;
  sitemap: SitemapConfig;
}

interface Middlwares {
  pre?: Server[];
  post?: Server[];
}

interface UserPageContext {
  // PageContext and not PageCtx as the api for the user is PageContext. (on server url property is also passed along, but it should not matter)
  originalUrl: string;
  params: Record<string, string>;
}

interface FrameworkModule {
  defineConfig?: (c: TinyPagesConfig) => Promise<void>;
  editEntryFile?: (id: string, code: string) => Promise<string | undefined>;
  editHTMLFile?: (
    id: string,
    code: string,
    locale: string
  ) => Promise<string | undefined>;
  resolveComponentPath?: (path: string) => string | undefined;
  renderComponent?: (
    c: ComponentFactory,
    props: {
      pageContext: UserPageContext;
      ssrProps: Record<string, string>;
    } & Record<string, string>
  ) => Promise<string | undefined>;
  enforce?: "pre" | "post";
}

interface TinyPagesConfig {
  compiler: CompilerConfig;
  vite: ViteUserConfig;
  middlewares: Middlwares;
  defaultModulesConfig: DefaultModulesConfig;
  modules: FrameworkModule[];
  hostname: string;
  isSmallPageBuild: boolean;
  useExperimentalImportMap: boolean;
}

interface UserTinyPagesConfig {
  compiler?: Omit<
    CompilerConfig,
    | "unocss"
    | "icons"
    | "renderUnoCSS"
    | "defaultIconsStyles"
    | "defaultBase64IconsStyles"
  >;
  defaultModulesConfig?: Partial<DefaultModulesConfig>;
  modules?: FrameworkModule[];
  vite?: ViteUserConfig;
  middlewares?: Middlwares;
  hostname?: string;
  isSmallPageBuild?: boolean;
  useExperimentalImportMap?: boolean;
}

export { TinyPagesConfig, UserTinyPagesConfig, FrameworkModule };
