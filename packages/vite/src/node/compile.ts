import compile from "@tinypages/compiler";
import type { Meta } from "../types";
import { presetCompilerConfig } from "./constants";

export async function compileMarkdown(input: string): Promise<[string, Meta]> {
  const [html, meta] = await compile(input, presetCompilerConfig);
  return [html, meta];
}
