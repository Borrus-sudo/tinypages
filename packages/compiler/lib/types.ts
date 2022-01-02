import { IRawGrammar, IRawTheme, IRawThemeSetting } from "vscode-textmate";

type Theme =
  | "css-variables"
  | "dark-plus"
  | "dracula-soft"
  | "dracula"
  | "github-dark-dimmed"
  | "github-dark"
  | "github-light"
  | "light-plus"
  | "material-darker"
  | "material-default"
  | "material-lighter"
  | "material-ocean"
  | "material-palenight"
  | "min-dark"
  | "min-light"
  | "monokai"
  | "nord"
  | "one-dark-pro"
  | "poimandres"
  | "slack-dark"
  | "slack-ochin"
  | "solarized-dark"
  | "solarized-light"
  | "vitesse-dark"
  | "vitesse-light";

interface IHighlighterPaths {
  themes?: string;
  languages?: string;
}

type ILanguageRegistration = {
  id: string;
  scopeName: string;
  aliases?: string[];
  samplePath?: string;
  embeddedLangs?: Lang[];
} & (
  | {
      path: string;
      grammar?: IRawGrammar;
    }
  | {
      path?: string;
      grammar: IRawGrammar;
    }
);

type IThemeRegistration = IShikiTheme | StringLiteralUnion<Theme>;

interface IShikiTheme extends IRawTheme {
  name: string;
  type: "light" | "dark";
  settings: IRawThemeSetting[];
  fg: string;
  bg: string;
  include?: string;
  colors?: Record<string, string>;
}

type StringLiteralUnion<T extends U, U = string> = T | (U & {});

type Lang =
  | "abap"
  | "actionscript-3"
  | "ada"
  | "apache"
  | "apex"
  | "apl"
  | "applescript"
  | "asm"
  | "astro"
  | "awk"
  | "ballerina"
  | "bat"
  | "batch"
  | "berry"
  | "be"
  | "bibtex"
  | "bicep"
  | "c"
  | "clojure"
  | "clj"
  | "cobol"
  | "codeql"
  | "ql"
  | "coffee"
  | "cpp"
  | "crystal"
  | "csharp"
  | "c#"
  | "css"
  | "cue"
  | "d"
  | "dart"
  | "diff"
  | "docker"
  | "dream-maker"
  | "elixir"
  | "elm"
  | "erb"
  | "erlang"
  | "fish"
  | "fsharp"
  | "f#"
  | "gherkin"
  | "git-commit"
  | "git-rebase"
  | "gnuplot"
  | "go"
  | "graphql"
  | "groovy"
  | "hack"
  | "haml"
  | "handlebars"
  | "hbs"
  | "haskell"
  | "hcl"
  | "hlsl"
  | "html"
  | "ini"
  | "java"
  | "javascript"
  | "js"
  | "jinja-html"
  | "json"
  | "jsonc"
  | "jsonnet"
  | "jssm"
  | "fsl"
  | "jsx"
  | "julia"
  | "jupyter"
  | "kotlin"
  | "latex"
  | "less"
  | "lisp"
  | "logo"
  | "lua"
  | "make"
  | "makefile"
  | "markdown"
  | "md"
  | "matlab"
  | "mdx"
  | "nginx"
  | "nim"
  | "nix"
  | "objective-c"
  | "objc"
  | "objective-cpp"
  | "ocaml"
  | "pascal"
  | "perl"
  | "php"
  | "plsql"
  | "postcss"
  | "powershell"
  | "ps"
  | "ps1"
  | "prisma"
  | "prolog"
  | "pug"
  | "jade"
  | "puppet"
  | "purescript"
  | "python"
  | "py"
  | "r"
  | "raku"
  | "perl6"
  | "razor"
  | "riscv"
  | "ruby"
  | "rb"
  | "rust"
  | "rs"
  | "sas"
  | "sass"
  | "scala"
  | "scheme"
  | "scss"
  | "shaderlab"
  | "shader"
  | "shellscript"
  | "shell"
  | "bash"
  | "sh"
  | "zsh"
  | "smalltalk"
  | "solidity"
  | "sparql"
  | "sql"
  | "ssh-config"
  | "stylus"
  | "styl"
  | "svelte"
  | "swift"
  | "system-verilog"
  | "tasl"
  | "tcl"
  | "tex"
  | "toml"
  | "tsx"
  | "turtle"
  | "twig"
  | "typescript"
  | "ts"
  | "vb"
  | "cmd"
  | "verilog"
  | "vhdl"
  | "viml"
  | "vim"
  | "vimscript"
  | "vue-html"
  | "vue"
  | "wasm"
  | "wenyan"
  | "文言"
  | "xml"
  | "xsl"
  | "yaml";

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
  displayMode?: boolean | undefined;
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

type Config = {
  marked?: MarkedConfig;
  icons?: IconsConfig;
  shiki?: ShikiConfig;
  katex?: KatexConfig;
  format?: boolean;
  resolveWindiCss?: boolean;
  resolveUnoCSS?: boolean;
  renderMermaid?: boolean;
};
export { Config };
