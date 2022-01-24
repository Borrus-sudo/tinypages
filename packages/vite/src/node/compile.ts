import type { UserConfig } from "@tinypages/compiler";
import compile from "@tinypages/compiler";
import type { Meta } from "../types";

export async function createCompiler(
  config: UserConfig
): Promise<(input: string) => Promise<[string, Meta]>> {
  return async (input: string) => {
    const [html, meta] = await compile(input, config);
    return [html, meta];
  };
}
