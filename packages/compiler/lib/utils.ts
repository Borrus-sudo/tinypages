import store from "./store";
const validMarkedKeys = [
  "baseUrl",
  "breaks",
  "gfm",
  "headerIds",
  "langPrefix",
  "headerPrefix",
  "mangle",
  "pedantic",
  "sanitize",
  "silent",
  "smartLists",
  "smartypants",
  "xhtml",
];

export function appendPrelude(content: string) {
  return String.raw`<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
       ${store.returnHead().join("\n")} 
      <title>Document</title>
      <style>
      @import url('https://fonts.googleapis.com/css?family=Open+Sans');
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
       :root {
          --font-mono: 'IBM Plex Mono', monospace;
      }
      
      * {
          box-sizing: border-box;
      }
      
      body {
          max-width: 720px;
          margin: 4rem auto 16rem auto;
          font-family: 'Avenir Next', 'Open Sans', Helvetica, sans-serif;
          font-size: 18px;
      }
      
      pre {
          overflow: auto;
          overflow-wrap: break-word;
          padding: 2rem;
          margin-top: 1rem;
          margin-bottom: 3rem;
          white-space: pre-wrap;
      }
      
      pre code {
          white-space: pre-wrap;
          font-family: var(--font-mono);
          font-size: 14px;
      }
      
      h1,
      h2 {
          font-weight: normal;
          font-size: 1.5rem;
      }
      
      p img {
          max-width: 100%;
          margin-top: 1rem;
          margin-bottom: 3rem;
      }
      
      p code {
          font-family: var(--font-mono);
      }
      
      @media (max-width: 720px) {
          body {
              font-size: 12px;
              margin: 2rem 0 8rem 0;
          }
          pre {
              margin: 1.5rem 0 2.5rem 0;
              padding: 1rem .5rem;
          }
          pre code {
              font-size: 11px;
          }
          p,
          h1,
          h2 {
              margin-left: .5rem;
              margin-right: .5rem;
          }
          p {
              font-size: 1rem;
          }
      }
      
      a {
          position: relative;
          text-decoration: none;
          color: #6f92ba;
          transition: color .4s;
      }
      
      a:before {
          content: "";
          position: absolute;
          width: 100%;
          height: 1px;
          bottom: 0;
          left: 0;
          background-color: #6f92ba;
          transform: scaleX(0);
          transition: all 0.2s cubic-bezier(.82, 0, .12, 1) 0s;
      }
      
      a:hover:before {
          visibility: visible;
          transform: scaleX(1);
      }
      
      #svg {
          text-align: center;
          margin-top: 1rem;
          margin-bottom: 3rem;
      }
      
      #svg svg {
          max-width: 100%;
      }
      
      @media (max-width: 720px) {
          #svg {
              margin-top: 1.5rem;
              margin-bottom: 2.5rem;
          }
          #svg svg {
              height: auto;
          }
      }
  </style>
  </head>
  
  <body>
      ${content} 
  </body>
  
  </html>`;
}

export function sanitizeMarkedConfig(markedConfig) {
  let subsetConfig = {};
  Object.keys(markedConfig).forEach((key) => {
    if (validMarkedKeys.includes(key)) {
      subsetConfig[key] = markedConfig[key];
    }
  });
  return subsetConfig;
}
