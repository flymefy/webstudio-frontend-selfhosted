import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pascalCase(input: string) {
  return input
    .replace(/(^.|[-_\s].)/g, (m) => m.replace(/[-_\s]/g, "").toUpperCase())
    .replace(/\W/g, "");
}

function paramCase(input: string) {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .toLowerCase();
}

const vendorRoot = path.resolve(__dirname, "vendor", "frontend-nextjs");
const appDir = path.join(vendorRoot, "app");
const outDir = path.resolve(__dirname);

function transformSource(src: string) {
  // Strip css/scss imports
  src = src.replace(
    /^\s*import\s+[^;]*['\"]([^'\"]+\.(css|scss))['\"];?\s*$/gim,
    ""
  );
  // Adapt next/image
  src = src.replace(
    /from\s+["']next\/image["']/g,
    "from './adapters/next-image'"
  );
  // Adapt react-router-dom
  src = src.replace(
    /from\s+["']react-router-dom["']/g,
    "from './adapters/link'"
  );
  return src;
}

function writeShim(originalPath: string) {
  const code = readFileSync(originalPath, "utf8");
  const transformed = transformSource(code);
  const relDir = path.dirname(path.relative(outDir, originalPath));
  const base = path.basename(originalPath);
  const outPath = path.join(outDir, "__shim_pages__", relDir, base);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, transformed);
  return outPath;
}

(function main() {
  if (!existsSync(appDir)) {
    console.info("No Next.js app directory found to register pages");
    return;
  }
  const pageFiles = fg.sync([`${appDir}/**/page.{jsx,tsx}`], { dot: false });
  const filtered = pageFiles.filter(
    (p) => p.includes(`${path.sep}dashboard${path.sep}`) === false
  );

  const componentExports: string[] = [];
  const templateExports: string[] = [];

  for (const file of filtered) {
    const shimPath = writeShim(file);
    const rel = path.relative(outDir, shimPath).replaceAll("\\", "/");
    // Component name based on route path
    const routePath = path.relative(appDir, file).replace(/\\/g, "/");
    const nameBase =
      routePath
        .replace(/\/page\.(jsx|tsx)$/i, "")
        .replace(/\[(.+?)\]/g, "_$1")
        .replace(/[^a-zA-Z0-9/]/g, "_")
        .replace(/\//g, "_") || "home";
    const compName = pascalCase(`Page_${nameBase}`);

    componentExports.push(`export { default as ${compName} } from "./${rel}";`);

    const label =
      routePath
        .replace(/\/page\.(jsx|tsx)$/i, "")
        .replace(/\//g, " / ")
        .replace(/\[(.+?)\]/g, "($1)") || "Home";

    const metaVarBase = paramCase(compName).replace(/-/g, "_");
    const metaVar = `${metaVarBase}_template`;
    templateExports.push(
      `export const ${metaVar} = { category: "pages", order: 1, description: "${label}", template: (<$.${compName} ws:label="${label}" />) } as const;`
    );
  }

  // Write page components exports appended to components.ts
  const componentsDest = path.join(outDir, "components.ts");
  const prevComponents = existsSync(componentsDest)
    ? readFileSync(componentsDest, "utf8")
    : "";
  const newComponents =
    prevComponents +
    (componentExports.length ? "\n" + componentExports.join("\n") + "\n" : "");
  writeFileSync(componentsDest, newComponents);

  // Write templates.ts to include all generated page templates
  const templatesDest = path.join(outDir, "templates.ts");
  const header = `import { type TemplateMeta, $ } from "@webstudio-is/template";\n`;
  const body = templateExports.join("\n");
  const exportNames = templateExports.map(
    (t) => t.match(/^export const\s+([A-Za-z0-9_]+)\s*=/)![1]
  );
  const exportsList = exportNames
    .map((n) => `export const ${n}Meta: TemplateMeta = ${n};`)
    .join("\n");
  const content = `${header}\n${body}\n\n${exportsList}\n`;
  writeFileSync(templatesDest, content);

  console.info(`Registered ${filtered.length} pages as templates.`);
})();
