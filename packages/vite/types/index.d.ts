import type { Params } from "./params";

type PageCtx = /*start*/
  | { url: "/404.md" }
  | { url: "/favicon.ico" }
  | { url: "/index.md" }
  | { url: "/newPage.md" }
  | { url: "/Sample.md" }
  | { url: "/[...].md" }
  | { url: "/[id].md" }
  | { url: "/api/index.md" }
  | { url: "/api/[blog].md" }; /*end*/

declare global {
  var pageCtx: PageCtx;
}

export type { PageCtx };
