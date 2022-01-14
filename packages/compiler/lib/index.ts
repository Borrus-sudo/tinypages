import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./plugin";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config, Plugin, UserConfig } from "./types";
import { appendPrelude, orderPlugins, postTransform } from "./utils";

export default async function compile(
  input: string,
  config: UserConfig,
  shouldAppendPrelude: boolean = true
): Promise<[string, { styles: string; components: string[] }]> {
  config = Object.assign({}, config, {
    metaConstruct: { styles: "", components: [] },
  });
  const Renderer = new marked.Renderer();
  const Plugins = orderPlugins(
    [PluginCSS(), PluginHTML(), PluginCode(), PluginText()],
    config.plugins || []
  );
  Plugins.forEach((plugin: Plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config as Config) : 0
  );
  const Handler = await useHandler(Plugins);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  let output = marked.parse(input);
  output = await postTransform(output, Plugins);
  return [
    shouldAppendPrelude
      ? appendPrelude(
          output,
          config.headTags || [],
          //@ts-ignore
          config.metaConstruct.styles
        )
      : output,
    //@ts-ignore
    config.metaConstruct,
  ];
}
