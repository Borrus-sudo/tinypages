import { IThemeRegistration, Lang, ILanguageRegistration } from 'shiki';

declare class UnoGenerator {
    userConfig: UserConfig$1;
    defaults: UserConfigDefaults;
    version: string;
    private _cache;
    config: ResolvedConfig;
    blocked: Set<string>;
    parentOrders: Map<string, number>;
    constructor(userConfig?: UserConfig$1, defaults?: UserConfigDefaults);
    setConfig(userConfig?: UserConfig$1, defaults?: UserConfigDefaults): void;
    applyExtractors(code: string, id?: string, set?: Set<string>): Promise<Set<string>>;
    parseToken(raw: string): Promise<StringifiedUtil[] | null | undefined>;
    generate(input: string | Set<string>, { id, scope, preflights, safelist, minify, }?: GenerateOptions): Promise<GenerateResult>;
    matchVariants(raw: string, current?: string): VariantMatchedResult;
    applyVariants(parsed: ParsedUtil, variantHandlers?: VariantHandler[], raw?: string): UtilObject;
    constructCustomCSS(context: Readonly<RuleContext>, body: CSSObject | CSSEntries, overrideSelector?: string): string;
    parseUtil(input: string | VariantMatchedResult, context: RuleContext, internal?: boolean): Promise<ParsedUtil[] | RawUtil[] | undefined>;
    stringifyUtil(parsed?: ParsedUtil | RawUtil): StringifiedUtil | undefined;
    expandShortcut(processed: string, context: RuleContext, depth?: number): [string[], RuleMeta | undefined] | undefined;
    stringifyShortcuts(parent: VariantMatchedResult, context: RuleContext, expanded: string[], meta?: RuleMeta): Promise<StringifiedUtil[] | undefined>;
    isBlocked(raw: string): boolean;
}

declare type Awaitable<T> = T | Promise<T>;
declare type Arrayable<T> = T | T[];
declare type FlatObjectTuple<T> = {
    [K in keyof T]: T[K];
};
declare type RequiredByKey<T, K extends keyof T = keyof T> = FlatObjectTuple<Required<Pick<T, Extract<keyof T, K>>> & Omit<T, K>>;
declare type CSSObject = Record<string, string | number | undefined>;
declare type CSSEntries = [string, string | number | undefined][];
declare type PresetOptions = Record<string, any>;
interface RuleContext<Theme extends {} = {}> {
    /**
     * Unprocessed selector from user input.
     * Useful for generating CSS rule.
     */
    rawSelector: string;
    /**
     * Current selector for rule matching
     */
    currentSelector: string;
    /**
     * UnoCSS generator instance
     */
    generator: UnoGenerator;
    /**
     * The theme object
     */
    theme: Theme;
    /**
     * Matched variants handlers for this rule.
     */
    variantHandlers: VariantHandler[];
    /**
     * Constrcut a custom CSS rule.
     * Variants and selector escaping will be handled automatically.
     */
    constructCSS: (body: CSSEntries | CSSObject, overrideSelector?: string) => string;
}
interface VariantContext<Theme extends {} = {}> {
    /**
     * Unprocessed selector from user input.
     */
    rawSelector: string;
    /**
     * UnoCSS generator instance
     */
    generator: UnoGenerator;
    /**
     * The theme object
     */
    theme: Theme;
}
interface ExtractorContext {
    readonly original: string;
    code: string;
    id?: string;
}
interface Extractor {
    name: string;
    extract(ctx: ExtractorContext): Awaitable<Set<string> | undefined>;
    order?: number;
}
interface RuleMeta {
    /**
     * The layer name of this rule.
     * @default 'default'
     */
    layer?: string;
    /**
     * Option to not merge this selector even if the body are the same.
     * @default false
     */
    noMerge?: boolean;
    /**
     * Internal rules will only be matched for shortcuts but not the user code.
     * @default false
     */
    internal?: boolean;
}
declare type CSSValues = CSSObject | CSSEntries | (CSSObject | CSSEntries)[];
declare type DynamicMatcher<Theme extends {} = {}> = ((match: RegExpMatchArray, context: Readonly<RuleContext<Theme>>) => Awaitable<CSSValues | string | undefined>);
declare type DynamicRule<Theme extends {} = {}> = [RegExp, DynamicMatcher<Theme>] | [RegExp, DynamicMatcher<Theme>, RuleMeta];
declare type StaticRule = [string, CSSObject | CSSEntries] | [string, CSSObject | CSSEntries, RuleMeta];
declare type Rule<Theme extends {} = {}> = DynamicRule<Theme> | StaticRule;
declare type DynamicShortcutMatcher<Theme extends {} = {}> = ((match: RegExpMatchArray, context: Readonly<RuleContext<Theme>>) => (string | string[] | undefined));
declare type StaticShortcut = [string, string | string[]] | [string, string | string[], RuleMeta];
declare type StaticShortcutMap = Record<string, string | string[]>;
declare type DynamicShortcut<Theme extends {} = {}> = [RegExp, DynamicShortcutMatcher<Theme>] | [RegExp, DynamicShortcutMatcher<Theme>, RuleMeta];
declare type UserShortcuts<Theme extends {} = {}> = StaticShortcutMap | (StaticShortcut | DynamicShortcut<Theme> | StaticShortcutMap)[];
declare type Shortcut<Theme extends {} = {}> = StaticShortcut | DynamicShortcut<Theme>;
declare type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;
interface Preflight {
    getCSS: () => Promise<string | undefined> | string | undefined;
    layer?: string;
}
declare type BlocklistRule = string | RegExp;
interface VariantHandler {
    /**
     * The result rewritten selector for the next round of matching
     */
    matcher: string;
    /**
     * Rewrite the output selector. Often be used to append pesudo classes or parents.
     */
    selector?: (input: string, body: CSSEntries) => string | undefined;
    /**
     * Rewrite the output css body. The input come in [key,value][] pairs.
     */
    body?: (body: CSSEntries) => CSSEntries | undefined;
    /**
     * Provide a parent selector(e.g. media query) to the output css.
     */
    parent?: string | [string, number] | undefined;
    /**
     * Variant ordering.
     */
    order?: number;
    /**
     * Override layer to the output css.
     */
    layer?: string | undefined;
}
declare type VariantFunction<Theme extends {} = {}> = (matcher: string, context: Readonly<VariantContext<Theme>>) => string | VariantHandler | undefined;
interface VariantObject<Theme extends {} = {}> {
    /**
     * The entry function to match and rewrite the selector for futher processing.
     */
    match: VariantFunction<Theme>;
    /**
     * Allows this variant to be used more than once in matching a single rule
     *
     * @default false
     */
    multiPass?: boolean;
}
declare type Variant<Theme extends {} = {}> = VariantFunction<Theme> | VariantObject<Theme>;
declare type Preprocessor = (matcher: string) => string | undefined;
declare type Postprocessor = (util: UtilObject) => void;
declare type ThemeExtender<T> = (theme: T) => void;
interface ConfigBase<Theme extends {} = {}> {
    /**
     * Rules to generate CSS utilities
     */
    rules?: Rule[];
    /**
     * Variants that preprocess the selectors,
     * having the ability to rewrite the CSS object.
     */
    variants?: Variant[];
    /**
     * Similar to Windi CSS's shortcuts,
     * allows you have create new utilities by combining existing ones.
     */
    shortcuts?: UserShortcuts;
    /**
     * Rules to exclude the selectors for your design system (to narrow down the possibilities).
     * Combining `warnExcluded` options it can also helps you identify wrong usages.
     */
    blocklist?: BlocklistRule[];
    /**
     * Utilities that always been included
     */
    safelist?: string[];
    /**
     * Extractors to handle the source file and outputs possible classes/selectors
     * Can be language-aware.
     */
    extractors?: Extractor[];
    /**
     * Raw CSS injections.
     */
    preflights?: Preflight[];
    /**
     * Theme object for shared configuration between rules
     */
    theme?: Theme;
    /**
     * Layer orders. Default to 0.
     */
    layers?: Record<string, number>;
    /**
     * Custom function to sort layers.
     */
    sortLayers?: (layers: string[]) => string[];
    /**
     * Preprocess the incoming utilities, return falsy value to exclude
     */
    preprocess?: Arrayable<Preprocessor>;
    /**
     * Process the generate utils object
     */
    postprocess?: Arrayable<Postprocessor>;
    /**
     * Custom functions to extend the theme object
     */
    extendTheme?: Arrayable<ThemeExtender<Theme>>;
}
interface Preset<Theme extends {} = {}> extends ConfigBase<Theme> {
    name: string;
    enforce?: 'pre' | 'post';
    /**
     * Preset options for other tools like IDE to consume
     */
    options?: PresetOptions;
}
interface GeneratorOptions {
    /**
     * Merge utilities with the exact same body to save the file size
     *
     * @default true
     */
    mergeSelectors?: boolean;
    /**
     * Emit warning when matched selectors are presented in blocklist
     *
     * @default true
     */
    warn?: boolean;
}
interface UserOnlyOptions<Theme extends {} = {}> {
    /**
     * The theme object, will be merged with the theme provides by presets
     */
    theme?: Theme;
    /**
     * Layout name of shortcuts
     *
     * @default 'shortcuts'
     */
    shortcutsLayer?: string;
    /**
     * Presets
     */
    presets?: (Preset | Preset[])[];
    /**
     * Environment mode
     *
     * @default 'build'
     */
    envMode?: 'dev' | 'build';
}
/**
 * For other modules to aggregate the options
 */
interface PluginOptions {
    /**
     * Load from configs files
     *
     * set `false` to disable
     */
    configFile?: string | false;
    /**
     * List of files that will also triggers config reloads
     */
    configDeps?: string[];
    /**
     * Patterns that filter the files being extracted.
     */
    include?: FilterPattern;
    /**
     * Patterns that filter the files NOT being extracted.
     */
    exclude?: FilterPattern;
}
interface UserConfig$1<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme>, GeneratorOptions, PluginOptions {
}
interface UserConfigDefaults<Theme extends {} = {}> extends ConfigBase<Theme>, UserOnlyOptions<Theme> {
}
interface ResolvedConfig extends Omit<RequiredByKey<UserConfig$1, 'mergeSelectors' | 'theme' | 'rules' | 'variants' | 'layers' | 'extractors' | 'blocklist' | 'safelist' | 'preflights' | 'sortLayers'>, 'rules' | 'shortcuts'> {
    shortcuts: Shortcut[];
    variants: VariantObject[];
    preprocess: Preprocessor[];
    postprocess: Postprocessor[];
    rulesSize: number;
    rulesDynamic: (DynamicRule | undefined)[];
    rulesStaticMap: Record<string, [number, CSSObject | CSSEntries, RuleMeta | undefined] | undefined>;
}
interface GenerateResult {
    css: string;
    layers: string[];
    getLayer(name?: string): string | undefined;
    getLayers(includes?: string[], excludes?: string[]): string;
    matched: Set<string>;
}
declare type VariantMatchedResult = readonly [
    raw: string,
    current: string,
    variants: VariantHandler[]
];
declare type ParsedUtil = readonly [
    index: number,
    raw: string,
    entries: CSSEntries,
    meta: RuleMeta | undefined,
    variants: VariantHandler[]
];
declare type RawUtil = readonly [
    index: number,
    rawCSS: string,
    meta: RuleMeta | undefined
];
declare type StringifiedUtil = readonly [
    index: number,
    selector: string | undefined,
    body: string,
    parent: string | undefined,
    meta: RuleMeta | undefined
];
interface UtilObject {
    selector: string;
    entries: CSSEntries;
    parent: string | undefined;
    layer: string | undefined;
}
interface GenerateOptions {
    /**
     * Filepath of the file being processed.
     */
    id?: string;
    /**
     * Generate preflights (if defined)
     *
     * @default true
     */
    preflights?: boolean;
    /**
     * Includes safelist
     */
    safelist?: boolean;
    /**
     * Genreate minified CSS
     * @default false
     */
    minify?: boolean;
    /**
     * @expiremental
     */
    scope?: string;
}

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
    grayMatter: string;
}
interface Meta extends BaseMeta {
    [key: string | number | symbol]: any;
}
declare type Config = {
    metaConstruct: Meta;
} & Omit<UserConfig, "plugins"> & {
    plugins: Plugin[];
};
interface UserConfig {
    marked?: MarkedConfig;
    icons?: IconsConfig;
    shiki?: ShikiConfig;
    katex?: KatexConfig;
    unocss?: UserConfig$1;
    headTags?: string[];
    minify?: boolean;
    format?: boolean;
    renderUnoCSS?: boolean;
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
    link: Array<{
        rel: string;
    } & Record<string, string>>;
    script: Array<{
        type: string;
    } & ({
        src: string;
    } | {
        innerHTML: string;
    })>;
    noscript: Array<{
        innerHTML: string;
    }>;
    style: Array<{
        type: string;
        cssText: string;
    }>;
    htmlAttributes: Record<string, string>;
    titleAttributes: Record<string, string>;
    base: Record<string, string>;
}

declare function export_default(input: string, UserConfig: UserConfig): Promise<[string, Meta]>;

export { Head, IconsConfig, Meta, Plugin, UserConfig$1 as UnoCSSConfig, UserConfig, export_default as default };
