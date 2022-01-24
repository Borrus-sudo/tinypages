import * as Colors from "picocolors";
import { createLogger } from "vite";
import { TinyPagesConfig, ResolvedConfig } from "../../types";

export default function ({ config }: ResolvedConfig) {
  const logger = createLogger(config.vite.logLevel);
  return (err: Error, req, res) => {
    if (err.message.includes("404")) {
      res.status(404).end(err.stack);
    } else {
      logger.error(Colors.red(`${err.stack}`), { error: err });
      res.status(500).end(err.stack);
    }
  };
}
