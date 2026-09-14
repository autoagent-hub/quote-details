import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, ".output");
const distDir = path.join(root, "dist");

try {
  // 1. If .output exists, sync to dist
  if (fs.existsSync(outputDir)) {
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    fs.cpSync(outputDir, distDir, { recursive: true, force: true });
  }

  // 2. If dist exists, sync to .output
  if (fs.existsSync(distDir)) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.cpSync(distDir, outputDir, { recursive: true, force: true });
  }

  // 3. Ensure executable permissions and shebang on all potential server entry points
  const serverFiles = [
    path.join(outputDir, "server", "index.mjs"),
    path.join(distDir, "server", "index.mjs"),
    path.join(outputDir, "server", "index.js"),
    path.join(distDir, "server", "index.js"),
  ];

  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, "utf8");
        if (!content.startsWith("#!/usr/bin/env node")) {
          fs.writeFileSync(file, `#!/usr/bin/env node\n${content}`, "utf8");
        }
        fs.chmodSync(file, 0o755);
      } catch (e) {
        console.warn(`Could not set permissions on ${file}:`, e);
      }
    }
  }

  console.log("✓ Deployment bundle synced to both dist/ and .output/ successfully.");
} catch (error) {
  console.error("Warning during deployment preparation:", error);
}
