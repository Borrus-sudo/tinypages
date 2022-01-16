import compile from "@tinypages/compiler";
import type { Meta } from "../types";
import { tinypagesCompilerConfig } from "./constants";

export async function compileMarkdown(input: string): Promise<[string, Meta]> {
  const [html, meta] = await compile(input, tinypagesCompilerConfig);
  return [html, meta];
}
