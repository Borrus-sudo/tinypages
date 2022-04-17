export default function PreactCounter(props) {
  return (
    <div className="counter">
      This is component 2
      <div className="bg-light-30">{props.children}</div>
    </div>
  );
}

export function pageProps(ctx) {
  return {};
}
