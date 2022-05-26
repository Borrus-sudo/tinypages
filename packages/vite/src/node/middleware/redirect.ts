import { useContext } from "../context";
export default function () {
  const { utils } = useContext();
  return (req, res, next) => {
    if (req.originalUrl === "/__seo") {
      res.redirect(utils.unlighthouseUrl);
    } else {
      next();
    }
  };
}
