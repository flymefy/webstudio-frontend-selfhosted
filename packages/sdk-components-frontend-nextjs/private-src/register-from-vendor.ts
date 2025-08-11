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
    .flatMap((dir) => [`${dir}/**/*.tsx`, `${dir}/**/*.jsx`]);
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
        /import\s+[^;]*['\"]([^'\"]+\.(css|scss))['\"];?/m.test(src);
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

function transformSourceForAdapters(
  src: string,
  aliasPrefix: string,
  adapterPrefix: string
) {
  // Strip css/scss imports completely (styles are provided globally)
  src = src.replace(
    /^\s*import\s+[^;]*['\"]([^'\"]+\.(css|scss))['\"];?\s*$/gim,
    ""
  );
  // Replace next/* imports to adapters
  src = src.replace(
    /from\s+["']next\/image["']/g,
    `from '${adapterPrefix}next-image'`
  );
  src = src.replace(
    /from\s+["']next\/dynamic["']/g,
    `from '${adapterPrefix}next-dynamic'`
  );
  src = src.replace(
    /from\s+["']next\/link["']/g,
    `from '${adapterPrefix}link'`
  );
  src = src.replace(
    /from\s+["']next\/head["']/g,
    `from '${adapterPrefix}next-head'`
  );
  src = src.replace(
    /from\s+["']next\/script["']/g,
    `from '${adapterPrefix}next-script'`
  );
  src = src.replace(
    /from\s+["']next\/navigation["']/g,
    `from '${adapterPrefix}next-navigation'`
  );
  // Adapt react-router-dom to link adapter
  src = src.replace(
    /from\s+["']react-router-dom["']/g,
    `from '${adapterPrefix}link'`
  );
  // Resolve @/ alias (vendor root)
  src = src.replace(
    /from\s+["']@\/(.+?)["']/g,
    (_m, p1) => `from '${aliasPrefix}${p1}'`
  );
  // Convert CommonJS exports to ESM for data files
  src = src.replace(/(^|\n)\s*module\.exports\s*=\s*/g, "$1export default ");
  src = src.replace(
    /(^|\n)\s*exports\.([A-Za-z0-9_]+)\s*=\s*/g,
    "$1export const $2 = "
  );
  return src;
}

function computePrefixes(outDirForFile: string) {
  const aliasRoot = path.join(outDir, "__shim__", "vendor", "frontend-nextjs");
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

function writeTransformedShim(originalPath: string): string {
  const code = readFileSync(originalPath, "utf8");
  const relFromOutDir = path.dirname(path.relative(outDir, originalPath));
  const outDirForFile = path.join(outDir, "__shim__", relFromOutDir);
  const { normalizedAliasPrefix, normalizedAdapterPrefix } =
    computePrefixes(outDirForFile);
  const transformed = transformSourceForAdapters(
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

function writeEmptyExports() {
  const componentsDest = path.join(outDir, "components.ts");
  const metasDest = path.join(outDir, "metas.ts");
  mkdirSync(path.dirname(componentsDest), { recursive: true });
  writeFileSync(componentsDest, "// no components exported\n");
  writeFileSync(metasDest, "// no metas exported\n");
}

function computeComponentName(originalPath: string): string {
  // Build a unique, readable name from the relative path under vendor/components
  const relFromVendor = path
    .relative(vendorRoot, originalPath)
    .replace(/\\/g, "/");
  // Remove leading components dir prefix
  const cleaned = relFromVendor
    .replace(/^src\/(components)\//, "")
    .replace(/^(components)\//, "")
    .replace(/^(app\/components)\//, "");
  const withoutExt = cleaned.replace(/\.(jsx|tsx)$/, "");
  const segments = withoutExt.split("/");
  // If last is index, drop it
  if (segments[segments.length - 1].toLowerCase() === "index") {
    segments.pop();
  }
  // Build name from up to last 3 segments to keep it concise but unique
  const take = segments.slice(Math.max(0, segments.length - 3));
  const base = take.join("_");
  // Sanitize and PascalCase
  const sanitized = base
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const name = pascalCase(sanitized);
  return name.length ? name : pascalCase(path.basename(withoutExt));
}

function generateComponentsIndex(componentFiles: string[]) {
  const lines: string[] = [];
  const names: string[] = [];
  const used = new Set<string>();
  for (const file of componentFiles) {
    const compNameBase = computeComponentName(file);
    let compName = compNameBase;
    let i = 2;
    while (used.has(compName)) {
      compName = `${compNameBase}${i}`;
      i += 1;
    }
    used.add(compName);
    const shim = writeTransformedShim(file);
    const rel = relativeFromPrivateSrc(shim);
    lines.push(`export { default as ${compName} } from "./${rel}";`);
    names.push(compName);
  }
  const dest = path.join(outDir, "components.ts");
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, lines.join("\n") + "\n");
  return names;
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

function mirrorVendorSourcesForComponents() {
  if (!existsSync(vendorRoot)) return;
  const files = fg.sync([
    `${vendorRoot}/**/*.{js,jsx,ts,tsx,json}`,
    `!${vendorRoot}/node_modules/**`,
    `!${vendorRoot}/documentation/**`,
    `!${vendorRoot}/public/**`,
  ]);
  for (const srcFile of files) {
    try {
      const relFromVendor = path.relative(vendorRoot, srcFile);
      const destPath = path.join(
        outDir,
        "__shim__",
        "vendor",
        "frontend-nextjs",
        relFromVendor
      );
      const outDirForFile = path.dirname(destPath);
      const { normalizedAliasPrefix, normalizedAdapterPrefix } =
        computePrefixes(outDirForFile);
      const code = readFileSync(srcFile, "utf8");
      const transformed = transformSourceForAdapters(
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
  const files = detectComponents();
  if (files.length === 0) {
    console.info("No components found under vendor. Skipping.");
    writeEmptyExports();
    return;
  }
  // Ensure vendor data and internal modules are available next to shims
  mirrorVendorSourcesForComponents();
  const names = generateComponentsIndex(files);
  for (const name of names) ensureMetaFileFor(name!);
  generateMetasIndex(names);
  console.info(`Registered ${names.length} components from vendor.`);
})();
