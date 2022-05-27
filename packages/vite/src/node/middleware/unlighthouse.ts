import { useContext } from "../context";
export default function () {
  const { config, page } = useContext("dev");
  return async (req, res, next) => {
    if (req.originalUrl === "/__seo") {
      const { default: lighthouse } = await import("./lazy-unlighthouse");
      const redirectTo = await lighthouse(
        config.vite.root,
        page.pageCtx.originalUrl
      );
      res.redirect(redirectTo);
    } else {
      next();
    }
  };
}
