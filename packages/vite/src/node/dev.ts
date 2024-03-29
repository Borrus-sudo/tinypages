import polka from "polka";
import { type ViteDevServer, normalizePath as viteNormalizePath } from "vite";
import type { TinyPagesConfig } from "../../types/types";
import { createDevContext } from "./context";
import { createMiddlewares } from "./middleware";
import { createDevPlugins } from "./plugins/dev";
import devtoolsMiddleware from "./middleware/devtools";
import { polyfill } from "@astropub/webapi";
import kleur from "kleur";

export async function createDevServer(
  config: TinyPagesConfig,
  source: string
): Promise<ViteDevServer> {
  const [context, vite] = await createDevContext(
    config,
    createDevPlugins,
    source
  );
  const app = polka();

  if ((config.middlewares.pre?.length ?? -1) > 0)
    app.use(config.middlewares.pre);

  app.use(vite.middlewares);
  app.use(devtoolsMiddleware());
  app.use(...createMiddlewares());

  if ((config.middlewares.post?.length ?? -1) > 0)
    app.use(config.middlewares.post);

  app.listen(3003, () => {
    context.utils.logger.info(
      `${kleur.green().bold("🚀 Your application is ready!")}
   > ${kleur.bold("Local")} : http://localhost:3003`
    );
    vite.watcher.add(viteNormalizePath(context.utils.pageDir));
    vite.watcher.add(viteNormalizePath(context.utils.i18nDir));
    polyfill(global, {
      exclude: "window document",
    });
  });

  return vite;
}
