import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pascalCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
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
const vendorComponentsDirs = [
  "src/components",
  "components",
  "app/components",
].map((p) => path.join(vendorRoot, p));

const outDir = path.resolve(__dirname);

function detectComponents(): string[] {
  if (!existsSync(vendorRoot)) {
    throw new Error(
      `Vendor repo not found at ${vendorRoot}. Clone your repo into private-src/vendor/frontend-nextjs first.`
    );
  }
  const patterns = vendorComponentsDirs
    .filter((dir) => existsSync(dir))
    .map((dir) => `${dir}/**/*.tsx`);
  if (patterns.length === 0) return [];
  const files = fg.sync(patterns, {
    dot: false,
    ignore: [
      "**/*.test.*",
      "**/*.stories.*",
      "**/__generated__/**",
      "**/*.ws.ts",
    ],
  });
  // Exclude dashboard components entirely for now
  const nonDashboard = files.filter(
    (f) =>
      f.includes(`${path.sep}components${path.sep}dashboard${path.sep}`) ===
      false
  );
  // Filter out modules importing css/scss and ensure default export exists (allow next/react-router-dom; they'll be transformed)
  const filtered = nonDashboard.filter((file) => {
    try {
      const src = readFileSync(file, "utf8");
      const hasStyleImport =
        /import\s+[^;]*['\"]([^'\"]+\.(css|scss))['\"]/m.test(src);
      const hasDefault = /export\s+default\s+/m.test(src);
      return hasStyleImport === false && hasDefault === true;
    } catch {
      return false;
    }
  });
  return filtered;
}

function relativeFromPrivateSrc(absPath: string) {
  return path.relative(outDir, absPath).replaceAll("\\", "/");
}

function transformSourceForAdapters(src: string) {
  // Strip css/scss imports completely
  src = src.replace(
    /^\s*import\s+[^;]*['"]([^'\"]+\.(css|scss))['"];?\s*$/gim,
    ""
  );
  // Replace next/image import to adapter
  src = src.replace(
    /from\s+["']next\/image["']/g,
    "from './adapters/next-image'"
  );
  // Replace react-router-dom import to adapter link
  src = src.replace(
    /from\s+["']react-router-dom["']/g,
    "from './adapters/link'"
  );
  return src;
}

function writeTransformedShim(originalPath: string): string {
  const code = readFileSync(originalPath, "utf8");
  const transformed = transformSourceForAdapters(code);
  const relDir = path.dirname(relativeFromPrivateSrc(originalPath));
  const base = path.basename(originalPath);
  const outPath = path.join(outDir, "__shim__", relDir, base);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, transformed);
  return outPath;
}

function writeEmptyExports() {
  const componentsDest = path.join(outDir, "components.ts");
  const metasDest = path.join(outDir, "metas.ts");
  mkdirSync(path.dirname(componentsDest), { recursive: true });
  writeFileSync(componentsDest, "// no components exported\n");
  writeFileSync(metasDest, "// no metas exported\n");
}

function generateComponentsIndex(componentFiles: string[]) {
  const lines: string[] = [];
  for (const file of componentFiles) {
    const basename = path.basename(file, path.extname(file));
    const compName = pascalCase(basename);
    const shim = writeTransformedShim(file);
    const rel = relativeFromPrivateSrc(shim);
    lines.push(`export { default as ${compName} } from "./${rel}";`);
  }
  const dest = path.join(outDir, "components.ts");
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, lines.join("\n") + "\n");
  return lines
    .map((l) => l.match(/default as\s+(\w+)/)?.[1])
    .filter(Boolean) as string[];
}

function ensureMetaFileFor(name: string) {
  const metaPath = path.join(outDir, `${paramCase(name)}.ws.ts`);
  if (existsSync(metaPath)) return;
  const content = `import type { WsComponentMeta } from "@webstudio-is/sdk";
// Auto-generated stub meta for ${name}
// If you generate props via build:args, import them as: 
// import { props } from "./__generated__/${paramCase(name)}.props";
export const meta: WsComponentMeta = {
  label: "${name}",
  initialProps: ["id", "class"],
  props: {},
};
`;
  writeFileSync(metaPath, content);
}

function generateMetasIndex(componentNames: string[]) {
  const lines = componentNames.map(
    (name) => `export { meta as ${name} } from "./${paramCase(name)}.ws";`
  );
  const dest = path.join(outDir, "metas.ts");
  writeFileSync(dest, lines.join("\n") + "\n");
}

(function main() {
  const files = detectComponents();
  if (files.length === 0) {
    console.info("No components found under vendor. Skipping.");
    writeEmptyExports();
    return;
  }
  const names = generateComponentsIndex(files);
  for (const name of names) ensureMetaFileFor(name!);
  generateMetasIndex(names);
  console.info(`Registered ${names.length} components from vendor.`);
})();
