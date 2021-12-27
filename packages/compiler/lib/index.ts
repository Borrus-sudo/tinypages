import { marked } from "marked";
import Spy from "proxy-hookified";
import Handler from "./proxy";
import { appendPrelude } from "./utils";
export default async function compile(
  input: string,
  config: {
    marked?: {};
  }
): Promise<string> {
  const markedConfig = config.marked || {};
  let renderer = new marked.Renderer(
    Object.keys(markedConfig).length > 0 ? markedConfig : null
  );
  const [spiedRenderer, revoke] = Spy(renderer, Handler);
  marked.use({
    renderer: spiedRenderer,
  });
  marked.setOptions(markedConfig);
  return appendPrelude(marked.parse(input));
}
(async () => {
  const output = await compile(
    ` ## :Rocket: 
  this is just text :mdi-cool:
  ### Heading
  `,
    {}
  );
  console.log(output);
})();
