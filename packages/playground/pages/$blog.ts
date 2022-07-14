import { $fetch } from "ohmyfetch";
import type { Params } from "tinypages";

export default async function (params: Params<"/[blog]">, paginate) {
  const res = await $fetch(
    `https://jdev.glitch.me/post/getPost/${params.blog}`
  );
  return { blog: res[0], paginate };
}
