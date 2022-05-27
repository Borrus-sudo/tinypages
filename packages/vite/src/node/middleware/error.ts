import { useContext, useVite } from "../context";

export default function () {
  const vite = useVite();
  const { utils } = useContext("dev");
  return (err: Error, _req, res) => {
    if (err) {
      utils.consola.error(err);
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
