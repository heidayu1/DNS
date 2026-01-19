const fs = require("fs");
const https = require("https");

const extraSource = "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.mini.txt";        // hoặc "extra.txt"
const cleanSource = "https://badmojr.github.io/1Hosts/Lite/adblock.txt"; // hoặc "extra_clean.txt"
const removedFile = "extra_removed.txt";

// ===== helpers =====
const isComment = line =>
  line.startsWith("!") ||
  line.startsWith("#") ||
  line.startsWith("//");

const normalize = line =>
  line.trim();

const readSource = source => {
  return new Promise((resolve, reject) => {
    // URL
    if (/^https?:\/\//i.test(source)) {
      https.get(source, res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
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

const parseRules = raw =>
  raw
    .split("\n")
    .map(normalize)
    .filter(line => line && !isComment(line));

// ===== main =====
(async () => {
  try {
    const extraRaw = await readSource(extraSource);
    const cleanRaw = await readSource(cleanSource);

    const extraRules = parseRules(extraRaw);
    const cleanSet = new Set(parseRules(cleanRaw));

    const removed = extraRules.filter(line => !cleanSet.has(line));

    fs.writeFileSync(removedFile, removed.join("\n"));

    console.log(`✔ Extra rules: ${extraRules.length}`);
    console.log(`✔ Clean rules: ${cleanSet.size}`);
    console.log(`✔ Removed rules: ${removed.length}`);
    console.log(`✔ Final rules: ${cleanSet.size - removed.length}`);
    console.log(`✔ Output: ${removedFile}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
