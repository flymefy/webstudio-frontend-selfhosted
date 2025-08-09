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
const vendorComponentsDir = path.join(vendorRoot, "components");
const outDir = path.resolve(__dirname);

function transformSource(
  src: string,
  aliasPrefix: string,
  adapterPrefix: string
) {
  // Keep css/scss imports for accurate behavior
  // Adapt next/image
  src = src.replace(
    /from\s+["']next\/image["']/g,
    `from '${adapterPrefix}next-image'`
  );
  // Adapt next/dynamic
  src = src.replace(
    /from\s+["']next\/dynamic["']/g,
    `from '${adapterPrefix}next-dynamic'`
  );
  // Adapt next/link
  src = src.replace(
    /from\s+["']next\/link["']/g,
    `from '${adapterPrefix}link'`
  );
  // Adapt next/head
  src = src.replace(
    /from\s+["']next\/head["']/g,
    `from '${adapterPrefix}next-head'`
  );
  // Adapt next/script
  src = src.replace(
    /from\s+["']next\/script["']/g,
    `from '${adapterPrefix}next-script'`
  );
  // Adapt next/navigation
  src = src.replace(
    /from\s+["']next\/navigation["']/g,
    `from '${adapterPrefix}next-navigation'`
  );
  // Adapt react-router-dom
  src = src.replace(
    /from\s+["']react-router-dom["']/g,
    `from '${adapterPrefix}link'`
  );
  // Preserve swiper/react, swiper, react-parallax, react-slick imports as-is
  // Resolve @/ alias to vendor root relative
  src = src.replace(/from\s+["']@\/(.+?)["']/g, (_m, p1) => {
    return `from '${aliasPrefix}${p1}'`;
  });
  return src;
}

function computePrefixes(outDirForFile: string) {
  const aliasRoot = path.join(
    outDir,
    "__shim_pages__",
    "vendor",
    "frontend-nextjs"
  );
  const aliasPrefix = path
    .relative(outDirForFile, aliasRoot)
    .replace(/\\/g, "/");
  const normalizedAliasPrefix = aliasPrefix.length ? aliasPrefix + "/" : "";
  const adaptersRoot = path.join(outDir, "adapters");
  const adapterPrefix = path
    .relative(outDirForFile, adaptersRoot)
    .replace(/\\/g, "/");
  const normalizedAdapterPrefix = adapterPrefix.length
    ? adapterPrefix + "/"
    : "";
  return { normalizedAliasPrefix, normalizedAdapterPrefix } as const;
}

function writeShim(originalPath: string) {
  const code = readFileSync(originalPath, "utf8");
  const relFromOutDir = path.dirname(path.relative(outDir, originalPath));
  const outDirForFile = path.join(outDir, "__shim_pages__", relFromOutDir);
  const { normalizedAliasPrefix, normalizedAdapterPrefix } =
    computePrefixes(outDirForFile);
  const transformed = transformSource(
    code,
    normalizedAliasPrefix,
    normalizedAdapterPrefix
  );
  const base = path.basename(originalPath);
  const outPath = path.join(outDirForFile, base);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, transformed);
  return outPath;
}

function mirrorVendorComponents() {
  if (!existsSync(vendorComponentsDir)) return;
  const files = fg.sync([`${vendorComponentsDir}/**/*.{jsx,tsx}`], {
    dot: false,
  });
  for (const srcFile of files) {
    const relFromVendor = path.relative(vendorRoot, srcFile);
    const destPath = path.join(
      outDir,
      "__shim_pages__",
      "vendor",
      "frontend-nextjs",
      relFromVendor
    );
    const outDirForFile = path.dirname(destPath);
    const { normalizedAliasPrefix, normalizedAdapterPrefix } =
      computePrefixes(outDirForFile);
    try {
      const code = readFileSync(srcFile, "utf8");
      const transformed = transformSource(
        code,
        normalizedAliasPrefix,
        normalizedAdapterPrefix
      );
      mkdirSync(outDirForFile, { recursive: true });
      writeFileSync(destPath, transformed);
    } catch {}
  }
}

function mirrorVendorSources() {
  if (!existsSync(vendorRoot)) return;
  const files = fg.sync([
    `${vendorRoot}/**/*.{js,jsx,ts,tsx}`,
    `!${appDir}/**/page.{jsx,tsx}`,
    `!${vendorRoot}/node_modules/**`,
    `!${vendorRoot}/**/*.stories.*`,
    `!${vendorRoot}/**/*.test.*`,
    `!${vendorRoot}/documentation/**`,
    `!${vendorRoot}/public/**`,
  ]);
  for (const srcFile of files) {
    const relFromVendor = path.relative(vendorRoot, srcFile);
    const destPath = path.join(
      outDir,
      "__shim_pages__",
      "vendor",
      "frontend-nextjs",
      relFromVendor
    );
    const outDirForFile = path.dirname(destPath);
    const { normalizedAliasPrefix, normalizedAdapterPrefix } =
      computePrefixes(outDirForFile);
    try {
      const code = readFileSync(srcFile, "utf8");
      const transformed = transformSource(
        code,
        normalizedAliasPrefix,
        normalizedAdapterPrefix
      );
      mkdirSync(outDirForFile, { recursive: true });
      writeFileSync(destPath, transformed);
    } catch {}
  }
}

(function main() {
  if (!existsSync(appDir)) {
    console.info("No Next.js app directory found to register pages");
    return;
  }
  // Ensure vendor components & other sources are mirrored so page relative imports resolve
  mirrorVendorComponents();
  mirrorVendorSources();

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
      `export const ${metaVar} = { category: "pages", order: 1, description: "${label}", template: (<ws.element ws:tag=\"div\" ws:label=\"${label}\"><$.${compName} /></ws.element>) } as const;`
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

  // Write templates.tsx to include all generated page templates
  const templatesDest = path.join(outDir, "templates.tsx");
  const header = `import { type TemplateMeta, $, ws, css } from "@webstudio-is/template";\nconst imagePlaceholderDataUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='64'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'>preview</text></svg>";\n`;
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
