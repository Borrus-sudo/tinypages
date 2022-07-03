import { fetchStaticTweet } from "static-tweet";
export function tweetRenderer(id) {
  const tweetAst = fetchStaticTweet(id);
  console.log(tweetAst);
}
