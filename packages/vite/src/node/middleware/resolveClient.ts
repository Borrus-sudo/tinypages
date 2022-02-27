// import type { ViteDevServer } from "vite";

// export default function (vite: ViteDevServer) {
//   return async (req, res, next) => {
//     if (req.originalUrl === "/@tinypages/client") {
//       const result = await vite.transformRequest("tinypages/client");
//       res
//         .status(200)
//         .set({ "Content-type": "text/javascript" })
//         .end(result?.code);
//     } else if (req.originalUrl.startsWith("/HIJACK_IMPORT")) {
//       const fileUrl = req.originalUrl
//         .split("/HIJACK_IMPORT")[1]
//         .split("?import")[0];
//       const result = await vite.transformRequest(fileUrl);
//       res
//         .status(200)
//         .set({ "Content-type": "text/javascript" })
//         .end(result?.code);
//     } else if (req.originalUrl.startsWith("/virtualModule")) {
//       const virtualModuleUrl = req.originalUrl.split("?import")[0].slice(1);
//       console.log("Virtual module Url:" + virtualModuleUrl);
//       const result = await vite.transformRequest(virtualModuleUrl);
//       console.log(result);
//       res
//         .status(200)
//         .set({ "Content-type": "text/javascript" })
//         .end(result?.code);
//     } else {
//       await next();
//     }
//   };
// }
