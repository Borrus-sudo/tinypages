import { defu } from "defu";
import { promises as fs } from "fs";
import { marked } from "marked";
import * as path from "path";
import { parse as parseYaml } from "yaml";
import type {
  Config,
  Head,
  IconsConfig,
  Meta,
  Plugin,
  UnoCSSConfig,
  UserConfig,
} from "../types/types";
import useHandler from "./plugin";
import { PluginCode, PluginCSS, PluginHTML, PluginText } from "./plugins";
import { analyze } from "./revealComponents";
import { orderPlugins, postTransform, Spy } from "./utils";

export async function compile(
  input: string,
  UserConfig: UserConfig,
  filePath?: string
): Promise<[string, Meta, string[]]> {
  //@ts-ignore
  let config: Config = Object.assign({}, UserConfig, {
    metaConstruct: {
      styles: "",
      components: [],
      headTags: UserConfig.headTags || [],
      head: {
        base: {},
        htmlAttributes: {},
        link: [],
        meta: [],
        noscript: [],
        script: [],
        style: [],
        title: "",
        titleAttributes: {},
      },
      grayMatter: "",
    },
  });
  const layoutPaths = [];

  config.plugins = orderPlugins(
    [PluginCSS(), PluginCode(), PluginText(), PluginHTML()],
    config.plugins || []
  );

  config.plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );
  const Renderer = new marked.Renderer();
  const Handler = await useHandler(config.plugins, config.metaConstruct);
  const spiedRenderer = Spy(Renderer, Handler);

  const grayMatter = input.match(/---[\s\S]*---/)?.[0] ?? "";
  if (grayMatter) {
    config.metaConstruct.grayMatter = parseYaml(grayMatter.slice(4, -3));
    input = input.split(grayMatter)[1];
    if (config.metaConstruct.grayMatter.layout && filePath) {
      const readThis = path.resolve(
        path.basename(filePath),
        config.metaConstruct.grayMatter.layout
      );
      layoutPaths.push(readThis);
      const layout = await fs.readFile(readThis, { encoding: "utf-8" });
      const [compiledLayout, layoutMeta, nestedLayouts] = await compile(
        layout,
        UserConfig,
        filePath
      );
      layoutPaths.push(...nestedLayouts);
      config.metaConstruct = defu(config.metaConstruct, layoutMeta);
      console.log(compiledLayout);
      input = compiledLayout.replace("/REPLACE:THIS/", input);
    }
  }
  marked.setOptions({
    //@ts-ignore
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  let output = marked.parse(input);

  output = await postTransform(output, config.plugins, config.metaConstruct);
  [output, config.metaConstruct.components] = analyze(output);

  return [
    output, //@ts-ignore
    config.metaConstruct,
    layoutPaths,
  ];
}

export type { UserConfig, Meta, Plugin, Head, IconsConfig, UnoCSSConfig };
