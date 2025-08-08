import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { paramCase, pascalCase } from "change-case";

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
    .map((dir) => `${dir}/**/*.{tsx,ts}`);
  if (patterns.length === 0) return [];
  const files = fg.sync(patterns, {
    dot: false,
    ignore: ["**/*.test.*", "**/*.stories.*", "**/*.ws.ts"],
  });
  return files;
}

function relativeFromPrivateSrc(absPath: string) {
  return path.relative(outDir, absPath).replaceAll("\\", "/");
}

function generateComponentsIndex(componentFiles: string[]) {
  const lines: string[] = [];
  for (const file of componentFiles) {
    const basename = path.basename(file, path.extname(file));
    const compName = pascalCase(basename);
    const rel = relativeFromPrivateSrc(file);
    lines.push(`export { ${compName} } from "./${rel}";`);
  }
  const dest = path.join(outDir, "components.ts");
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, lines.join("\n") + "\n");
  return lines
    .map((l) => l.match(/export \{ (\w+) \}/)?.[1])
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
    return;
  }
  const names = generateComponentsIndex(files);
  for (const name of names) ensureMetaFileFor(name!);
  generateMetasIndex(names);
  console.info(`Registered ${names.length} components from vendor.`);
})();
