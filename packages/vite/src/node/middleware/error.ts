import { useContext, useVite } from "../context";
import kleur from "kleur";

export default function () {
  const vite = useVite();
  const { utils } = useContext("dev");
  return (err: Error, _req, res) => {
    if (err) {
      utils.logger.error(kleur.red("Error:"), {
        error: err,
      });
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
