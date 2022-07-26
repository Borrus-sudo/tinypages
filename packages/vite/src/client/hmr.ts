import "./devtools";
if (import.meta.env.DEV) {
  (async () => {
    const { morph } = await import("million/morph");
    if (import.meta.hot) {
      const parser = new DOMParser();

      import.meta.hot.on("reload:page", async () => {
        import.meta.hot.invalidate();
      });

      import.meta.hot.on("new:page", async () => {
        const html = await fetch(window.location.href).then((res) =>
          res.text()
        );
        const newDoc = parser.parseFromString(html, "text/html");
        for (const root of newDoc.querySelectorAll("[preact]")) {
          const uid = root.getAttribute("uid");
          const current = document.querySelector(`[uid="${uid}"]`);
          if (current) {
            root.innerHTML = current.innerHTML;
          }
        }
        document.head.innerHTML = newDoc.head.innerHTML;
        morph(newDoc.getElementById("app"), document.getElementById("app"));
      });
    }
  })();
}
