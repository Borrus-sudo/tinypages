import { useState } from "preact/hooks";
import Github from "~icons/mdi/github";
// console.log(pageCtx);
console.log("hello");
export default function PreactCounter(props) {
  const [count, setCount] = useState(0);
  const add = () => setCount((i) => i + 1);
  const subtract = () => setCount((i) => i - 1);
  // const stuff = $\$fetch("https://jdev.glitch.me/post/getPost");
  return (
    <div class="counter">
      <button onClick={subtract}>-</button>
      <pre>{count}</pre>
      <button onClick={add}>+</button>
      <Github/>
      {props.children}
    </div>
  );
}

export async function pageProps(ctx) {
  return { name: "Some stuff after the network req" };
}
