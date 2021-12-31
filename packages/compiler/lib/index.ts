import { marked } from "marked";
import Spy from "proxy-hookified";
import configStore from "./config";
import useHandler from "./handler";
import type { Config } from "./types";
import { appendPrelude } from "./utils";

export default async function compile(
  input: string,
  config: Config
): Promise<string> {
  const Renderer = new marked.Renderer();
  const Handler = useHandler();
  const [spiedRenderer] = Spy(Renderer, Handler);
  marked.setOptions(config.marked || {});
  marked.use({
    renderer: spiedRenderer,
    ...(config.marked || {}),
  });
  configStore.mutateConfig(config);
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    ` ## :rocket: 
  this is just text ::lucide:activity::
  ### Heading
  \`\`\`ts
  console.log("Halleluah");
  \`\`\`
  `,
    {}
  );
  console.log(output);
})();
