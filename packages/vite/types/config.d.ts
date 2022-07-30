import type {
  IconsConfig,
  UnoCSSConfig,
  UserConfig as CompilerConfig,
} from "@tinypages/compiler";
import type { Server } from "connect";
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

interface FrameworkModule {
  defineConfig: (c: TinyPagesConfig) => void;
  editEntryFile: (id: string, code: string) => string | undefined;
  resolveComponentPath: () => string | undefined;
  renderComponent: () => string | undefined;
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
