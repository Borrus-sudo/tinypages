import { $fetch } from "ohmyfetch";
interface Blog {
  meta: string;
  message: string;
  time: string;
  star: number;
  duration: string;
  _id: string;
}

export default async function () {
  const url = "https://jdev.glitch.me/post/getPost";
  const json = await $fetch(url);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  } as const;
  json.reverse();
  const data: Blog[] = json.map((element: Blog) => {
    const today = new Date(element.time);
    element.time = today.toLocaleDateString("en-US", options);
    element.meta = element.meta.split("duration")[0].trim();
    element.time = element.time
      .slice(element.time.indexOf(",") + 1, element.time.length)
      .trim();
    return element;
  });
  return { data };
}
