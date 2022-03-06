import * as Colors from "picocolors";
import { useContext, useVite } from "../context";

export default function () {
  const { utils } = useContext();
  const vite = useVite();
  return (err: Error, _req, res) => {
    if (err) {
      utils.logger.error(Colors.red(`${err.stack}`), { error: err });
      vite.ws.send({
        type: "error",
        err: {
          name: err.name,
          stack: err.stack,
          message: err.message,
        },
      });
      res.status(500).end(err.stack);
    }
  };
}
