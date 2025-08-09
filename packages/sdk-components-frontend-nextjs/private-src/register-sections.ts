import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vendorRoot = path.resolve(__dirname, "vendor", "frontend-nextjs");
const outDir = path.resolve(__dirname);

function toLabel(cls: string) {
  return cls.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

(function main() {
  if (!existsSync(vendorRoot)) {
    console.info("No vendor repo found for sections");
    return;
  }
  const cssFiles = fg.sync([
    path.join(vendorRoot, "public/css/**/*.css"),
    path.join(vendorRoot, "public/sass/**/*.scss"),
  ]);
  const sectionClasses = new Set<string>();
  for (const file of cssFiles) {
    try {
      const src = readFileSync(file, "utf8");
      const regex = /\.([A-Za-z0-9_-]*section[A-Za-z0-9_-]*)\s*[{.,:#\s]/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(src))) {
        const cls = m[1];
        if (cls.length > 2) sectionClasses.add(cls);
      }
    } catch {}
  }

  const templatesDest = path.join(outDir, "templates.tsx");
  if (!existsSync(templatesDest)) {
    console.info("templates.tsx not found; run pages generator first");
    return;
  }
  let content = readFileSync(templatesDest, "utf8");
  if (content.includes("// __SECTIONS_START__")) {
    content = content.replace(
      /\n\/\/ __SECTIONS_START__[\s\S]*\/\/ __SECTIONS_END__\n?/,
      "\n"
    );
  }
  const sections: string[] = [];
  for (const cls of Array.from(sectionClasses).sort()) {
    const label = toLabel(cls);
    const varName = `section_${cls.replace(/[^A-Za-z0-9_]/g, "_")}_template`;
    sections.push(
      `export const ${varName} = { category: "general", description: "${label}", icon: imagePlaceholderDataUrl, template: (<ws.element ws:tag="div" ws:label="${label}"><ws.descendant ws:label="${label}" selector=" .${cls}" /></ws.element>) } as const;`
    );
  }
  const exportLines = sections
    .map((t) => t.match(/^export const\s+([A-Za-z0-9_]+)\s*=/)![1])
    .map((n) => `export const ${n}Meta: TemplateMeta = ${n};`);

  // ensure imports
  if (!content.includes("imagePlaceholderDataUrl")) {
    content = content.replace(
      /import\s+\{([^}]+)\}\s+from\s+"@webstudio-is\/template";/,
      (m) =>
        m + `\nimport { imagePlaceholderDataUrl } from "@webstudio-is/image";`
    );
  }

  const block = `\n// __SECTIONS_START__\n${sections.join("\n")}\n${exportLines.join(
    "\n"
  )}\n// __SECTIONS_END__\n`;
  content = content + block;
  writeFileSync(templatesDest, content);
  console.info(`Registered ${sectionClasses.size} section templates.`);
})();
