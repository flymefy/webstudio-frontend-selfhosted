import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { chromium } from "playwright-core";
import express from "express";
import serveStatic from "serve-static";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "../../..");
const privateSrc = path.resolve(__dirname, "..");
const outDir = path.join(privateSrc, "__thumb_build");
const templatesFile = path.join(privateSrc, "templates.tsx");
const thumbsDir = path.join(privateSrc, "__thumbs__");

function ensureDirs() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(thumbsDir, { recursive: true });
}

function collectTemplateExports() {
  const src = readFileSync(templatesFile, "utf8");
  const names = Array.from(src.matchAll(/export const\s+([A-Za-z0-9_]+)_template\s*=\s*\{/g)).map((m) => m[1]);
  const isPage = (name: string) => name.startsWith("page_");
  const isSection = (name: string) => name.startsWith("section_");
  return { names, isPage, isSection, src } as const;
}

function makePreviewHtml(name: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/global.css" />
    <style>html,body,#app{margin:0;height:100%;} #app{display:flex;align-items:center;justify-content:center;padding:24px;background:#f9fafb}</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./${name}.js"></script>
  </body>
</html>`;
}

function sanitizeJsxForPreview(jsx: string) {
  return jsx
    .replace(/<ws\.element[^>]*>/g, "<div>")
    .replace(/<\/ws\.element>/g, "</div>")
    .replace(/<ws\.descendant[^>]*\/>/g, "<div />")
    .replace(/\$\./g, "");
}

async function main() {
  if (!existsSync(templatesFile)) {
    console.info("templates.tsx not found");
    process.exit(0);
  }
  ensureDirs();
  const { names, src } = collectTemplateExports();

  const previews: { name: string; htmlPath: string }[] = [];
  for (const name of names) {
    const m = new RegExp(
      `export const ${name}_template\\s*=\\s*\\{[\\s\\S]*?template:\\s*\\(([^]*?)\\)\\s*,?\\s*\\}\\s*as const;`
    ).exec(src);
    if (!m) continue;
    const jsx = sanitizeJsxForPreview(m[1]);
    const comps = Array.from(jsx.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)).map((m) => m[1]);
    const uniqComps = Array.from(new Set(comps));

    const entryPath = path.join(outDir, `${name}.tsx`);
    const entryCode = `import React from 'react';
import { createRoot } from 'react-dom/client';
${uniqComps.length ? `import { ${uniqComps.join(", ")} } from '../components';` : ""}
function App(){ return (${jsx}); }
const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(<App />);
`;
    writeFileSync(entryPath, entryCode);

    await build({
      entryPoints: [entryPath],
      outfile: path.join(outDir, `${name}.js`),
      bundle: true,
      format: "esm",
      platform: "browser",
      jsx: "automatic",
      sourcemap: false,
      logLevel: "silent",
      loader: { ".tsx": "tsx", ".ts": "ts" },
      external: [],
      alias: {
        antd: path.join(privateSrc, "scripts/ui-stub.tsx"),
        "react-toastify": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "react-tabs": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "rc-slider": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "swiper": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "swiper/react": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "react-parallax": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "react-modal-video": path.join(privateSrc, "scripts/ui-stub.tsx"),
        "google-map-react": path.join(privateSrc, "scripts/ui-stub.tsx"),
      },
    });

    const html = makePreviewHtml(name);
    const htmlPath = path.join(outDir, `${name}.html`);
    writeFileSync(htmlPath, html);
    previews.push({ name, htmlPath });
  }

  const globalCssPath = path.join(outDir, "global.css");
  writeFileSync(globalCssPath, `@import url('/node_modules/antd/dist/reset.css');\n@import url('/node_modules/slick-carousel/slick/slick.css');\n@import url('/node_modules/slick-carousel/slick/slick-theme.css');\n@import url('/node_modules/photoswipe/dist/photoswipe.css');\n@import url('/node_modules/react-toastify/dist/ReactToastify.css');\n`);

  const app = express();
  app.use("/", serveStatic(outDir));
  app.use("/node_modules", serveStatic(path.resolve(root, "node_modules")));
  const server = await new Promise<{ close: () => void; port: number }>((resolve) => {
    const srv = app.listen(0, () => {
      const address = srv.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ close: () => srv.close(), port });
    });
  });

  const browserExec = findChromiumExecutable();
  const browser = await chromium.launch({ headless: true, executablePath: browserExec });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const nameToDataUrl = new Map<string, string>();
  for (const { name, htmlPath } of previews) {
    const url = `http://localhost:${server.port}/${path.basename(htmlPath)}`;
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      const clip = { x: 0, y: 0, width: 1280, height: 800 } as const;
      const buf = await page.screenshot({ type: "png", clip });
      const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      const outPng = path.join(thumbsDir, `${name}.png`);
      writeFileSync(outPng, buf);
      nameToDataUrl.set(name, dataUrl);
    } catch {}
  }

  await browser.close();
  server.close();

  let updated = src;
  for (const name of names) {
    const dataUrl = nameToDataUrl.get(name);
    if (!dataUrl) continue;
    const iconBlock = new RegExp(`export const ${name}_template\\s*=\\s*\\{([\\s\\S]*?)\\}`, "g");
    updated = updated.replace(iconBlock, (block) => {
      if (block.includes("icon:")) {
        return block.replace(/icon:\s*[^,]+,?/, `icon: '${dataUrl}',`);
      }
      return block.replace(/description:\s*"[^"]*",/, (m) => `${m}\n  icon: '${dataUrl}',`);
    });
  }
  writeFileSync(templatesFile, updated);
  console.info(`Generated ${nameToDataUrl.size} thumbnails and updated templates.tsx icons.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

function findChromiumExecutable(): string | undefined {
  const home = process.env.HOME || process.env.USERPROFILE || "/home/ubuntu";
  const headless = fg.sync(
    path.join(home, ".cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell"),
    { dot: true }
  );
  const full = fg.sync(
    path.join(home, ".cache/ms-playwright/chromium-*/chrome-linux/chrome"),
    { dot: true }
  );
  const candidates = [...headless.sort().reverse(), ...full.sort().reverse()];
  return candidates[0];
}