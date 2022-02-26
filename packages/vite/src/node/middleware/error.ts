import * as Colors from "picocolors";
import { useContext } from "../createContext";

export default function () {
  const { utils } = useContext();
  return (err: Error, req, res) => {
    if (err) {
      utils.logger.error(Colors.red(`${err.stack}`), { error: err });
      res.status(500).end(err.stack);
    }
  };
}
