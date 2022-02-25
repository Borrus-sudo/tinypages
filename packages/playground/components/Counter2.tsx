export default function PreactCounter(props) {
  return (
    <div className="counter">
      hi hi hi hui
      <div className="bg-light-30">
      {props.children}
      </div>
    </div>
  );
}

export function pageProps(ctx) {

  return {};
}
