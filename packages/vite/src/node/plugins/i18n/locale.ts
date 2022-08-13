import fs from "fs/promises";
import path from "path";

export function generateEquivalentLocales(html: string) {}

const i18nMap: Map<string, {}> = new Map();
export async function resolveStuff(i18nDir: string) {
  const locale_files = await fs.readdir(i18nDir);
  locale_files.forEach(async (file) => {
    const locale_file_path = path.join(i18nDir, file);
    i18nMap.set(
      file,
      JSON.parse(await fs.readFile(locale_file_path, { encoding: "utf-8" }))
    );
  });
}

export function resolveI18n(locale: string, pageURL) {
  // const locale=
}
