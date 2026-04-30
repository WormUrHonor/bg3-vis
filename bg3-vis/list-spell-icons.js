import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderPath = path.join(__dirname, "src", "assets", "Spell Icons");

const files = fs
  .readdirSync(folderPath)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort();

console.log(files.join("\n"));
console.log(`\nTotal PNG files: ${files.length}`);