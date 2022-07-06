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

interface IconsModule extends IconsConfig {
  defaultIconsStyles?: Record<string, string>;
  load?: (id: string) => Promise<string> | void;
}

interface PreactModule {
  devToolsInProd?: boolean;
  loadComponent?: () => string | void;
  editMainFile?: () => string | void;
}

interface ImageModule {
  presets?: ImagePresets;
  options?: ImageOptions;
}

interface Modules {
  image: ImageModule;
  unocss: UnoCSSConfig;
  icons: IconsModule;
  preact: PreactModule;
}

interface Middlwares {
  pre?: Server[];
  post?: Server[];
}

interface TinyPagesConfig {
  compiler: CompilerConfig;
  vite: ViteUserConfig;
  middlewares: Middlwares;
  modules: Modules;
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
  modules?: Partial<Modules>;
  vite?: ViteUserConfig;
  middlewares?: Middlwares;
  hostname: string;
  isSmallPageBuild?: boolean;
  useExperimentalImportMap?: boolean;
}

export { TinyPagesConfig, UserTinyPagesConfig };
