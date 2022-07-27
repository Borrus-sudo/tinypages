import { useContext } from "../context";
import { readFile, writeFile } from "fs/promises";

export default function () {
  const { page } = useContext("dev");
  return async (req, res, next) => {
    if (!req.originalUrl.startsWith("/__EDIT")) {
      return next();
    }
    const { to_replace, replace_with } = req.query;
    const content = await readFile(page.pageCtx.filePath, {
      encoding: "utf-8",
    });
    await writeFile(
      page.pageCtx.filePath,
      content.replace(to_replace, replace_with)
    );
    return res.end();
  };
}
