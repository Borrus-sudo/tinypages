import { marked } from "marked";
import Spy from "proxy-hookified";
import useHandler from "./plugin";
import { PluginCode } from "./plugins/code";
import { PluginCSS } from "./plugins/css";
import { PluginHTML } from "./plugins/html";
import { PluginText } from "./plugins/text";
import type { Config } from "./types";
import { appendPrelude, orderPlugins } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Plugins = orderPlugins(
    [PluginHTML(), PluginCode(), PluginCSS(), PluginText()],
    config.plugins || []
  );
  Plugins.forEach((plugin) =>
    plugin.defineConfig ? plugin.defineConfig(config) : 0
  );
  const Handler = await useHandler(Plugins);
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  const output = marked.parse(input);
  return appendPrelude(output, config.headTags || []);
}
