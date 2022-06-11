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
import { analyze } from "./reveal-components";
import { orderPlugins, postTransform, Spy } from "./utils";

export async function compile(
  input: string,
  UserConfig: UserConfig
): Promise<[string, Meta]> {
  //@ts-ignore
  let config: Config = Object.assign({}, UserConfig, {
    metaConstruct: {
      styles: "",
      components: [],
      headTags: UserConfig.headTags || [],
      head: {
        base: [],
        htmlAttributes: {},
        link: [],
        meta: [],
        noscript: [],
        script: [],
        style: [],
        title: "",
        titleAttributes: {},
      },
      grayMatter: {},
      feed: {
        atom: "",
        rss: "",
      },
    },
  });

  config.plugins = orderPlugins(
    [PluginCSS(), PluginCode(), PluginText(), PluginHTML()],
    config.plugins || []
  );

  config.plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );

  const grayMatter = input.match(/---[\s\S]*---/)?.[0] ?? "";
  if (grayMatter) {
    config.metaConstruct.grayMatter = parseYaml(grayMatter.slice(4, -3));
    input = input.split(grayMatter)[1];
  }

  const Renderer = new marked.Renderer();
  const Handler = await useHandler(config.plugins, config.metaConstruct);
  const spiedRenderer = Spy(Renderer, Handler);

  marked.setOptions({
    //@ts-ignore
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });

  let output = marked.parse(
    input.replace(/<.*?>/g, (r) => r.replace(/\./g, "__"))
  );

  output = await postTransform(output, config.plugins, config.metaConstruct);
  [output, config.metaConstruct.components] = analyze(output);
  return [
    output, //@ts-ignore
    config.metaConstruct,
  ];
}

export type { UserConfig, Meta, Plugin, Head, IconsConfig, UnoCSSConfig };
