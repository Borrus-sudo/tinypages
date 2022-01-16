import * as Colors from "picocolors";
import { createLogger, InlineConfig } from "vite";

export default function (config: InlineConfig) {
  const logger = createLogger(config.logLevel);
  return (err: Error, req, res) => {
    logger.error(Colors.red(`${err.stack}`), { error: err });
    console.error(err.stack);
    if (err.message.includes("404")) res.status(404).end(err.stack);
    else res.status(500).end(err.stack);
  };
}
