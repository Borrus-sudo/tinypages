import { marked } from "marked";
import { appendPrelude } from "./utils";
export default async function compile(
  input: string,
  config: {
    marked?: {};
  }
): Promise<string> {
  const markedConfig = config.marked || {};
  marked.use({
    renderer: new marked.Renderer(markedConfig),
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
