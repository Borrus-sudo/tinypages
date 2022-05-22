import type { Params } from "./params";

interface PageCtx {
  url: string;
  originalUrl: string;
  params?: Record<string, string>;
}

declare global {
  var pageCtx: PageCtx;
  var ssrProps: Record<any, any>;
}

/*start*/
declare module "./pages/index.js" {
  export default function loader(params: Params<"/api/[blog]">);
}
/*end*/

export type { PageCtx };
