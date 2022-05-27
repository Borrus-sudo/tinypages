let ctx, unlighthouse;
export default async function (root: string, currUrl: string) {
  const { createUnlighthouse } = await import("@unlighthouse/core");
  const { createServer } = await import("@unlighthouse/server");
  if (!unlighthouse) {
    unlighthouse = await createUnlighthouse(
      {
        root: root,
        routerPrefix: "/",
        scanner: {
          skipJavascript: false,
        },
      },
      {
        name: "tinypages",
      }
    );
  }
  if (!ctx) ctx = await createServer();
  // will be the prev url as the ssr middleware will update it after the next step
  unlighthouse.setSiteUrl(`http://localhost:3003${currUrl}`);
  await unlighthouse.setServerContext({
    url: ctx.server.url,
    server: ctx.server,
    app: ctx.app,
  });
  return ctx.server.url;
}
