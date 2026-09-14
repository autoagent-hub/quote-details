import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  path.join(__dirname, "dist", "server", "index.mjs"),
  path.join(__dirname, ".output", "server", "index.mjs"),
  path.join(__dirname, "dist", "server", "index.js"),
  path.join(__dirname, ".output", "server", "index.js"),
];

let entry = candidates.find((file) => fs.existsSync(file));

if (!entry) {
  console.log("No compiled server bundle found. Running production build...");
  try {
    execSync("npm run build", { stdio: "inherit" });
    entry = candidates.find((file) => fs.existsSync(file));
  } catch (err) {
    console.error("Auto-build failed:", err);
  }
}

if (!entry) {
  console.error(
    "Fatal error: Could not find server bundle at dist/server/index.mjs or .output/server/index.mjs",
  );
  process.exit(1);
}

console.log(`Starting Detailr production server from: ${entry}`);
await import(`file://${path.resolve(entry)}`);
