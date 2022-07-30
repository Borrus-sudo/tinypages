import { createUnlighthouse } from "@unlighthouse/core";
import { createServer } from "@unlighthouse/server";
import path from "path";
import polka from "polka";
import sirv from "sirv";

async function unlighthouse(root: string) {
  const unlighthouse = await createUnlighthouse(
    {
      root: path.join(root, "dist"),
      routerPrefix: "/",
      scanner: {
        skipJavascript: false,
        sitemap: true,
      },
    },
    {
      name: "tinypages",
    }
  );
  const app = polka();
  app.use(sirv(path.join(root, "dist"), { maxAge: 0, immutable: false }));
  app.listen(3003, async () => {
    const context = await createServer();
    await unlighthouse.setServerContext({
      url: context.server.url,
      server: context.server.server,
      app: context.app,
    });
    unlighthouse.start();
  });
}

export async function unlighthouseAction(root: string) {
  if (root.startsWith("./")) {
    root = path.join(process.cwd(), root);
  }
  await unlighthouse(root);
}
