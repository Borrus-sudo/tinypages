import * as Colors from "picocolors";
import { ResolvedConfig } from "../../types";

export default function ({ utils: { logger } }: ResolvedConfig) {
  return (err: Error, req, res) => {
    if (err) {
      logger.error(Colors.red(`${err.stack}`), { error: err });
      res.status(500).end(err.stack);
    }
  };
}
