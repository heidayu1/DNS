const fs = require("fs");
const https = require("https");

const extraFile = "https://badmojr.github.io/1Hosts/Lite/adblock.txt";
const cleanFile = "extra_clean.txt";
const removedFile = "extra_removed.txt";

// ===== helpers =====
const isComment = line =>
  line.startsWith("!") ||
  line.startsWith("#") ||
  line.startsWith("//");

const normalize = line =>
  line.trim();

const readRules = source => {
  return new Promise((resolve, reject) => {
    // URL
    if (/^https?:\/\//i.test(source)) {
      https.get(source, res => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
      }).on("error", reject);
    }
    // Local file
    else {
      try {
        resolve(fs.readFileSync(source, "utf8"));
      } catch (e) {
        reject(e);
      }
    }
  });
};

// ===== main =====
const extraRules = readRules(extraFile);
const cleanSet = new Set(readRules(cleanFile));

const removed = extraRules.filter(line => !cleanSet.has(line));

fs.writeFileSync(removedFile, removed.join("\n"));

console.log(`✔ Removed rules: ${removed.length}`);
console.log(`✔ Output: ${removedFile}`);
