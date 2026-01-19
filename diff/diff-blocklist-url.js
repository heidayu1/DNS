const fs = require("fs");
const https = require("https");

const coreSource = "./blocklist/fusion.txt";   // hoặc "core.txt"
const extraSource = "./blocklist/privacy.txt"; // hoặc "extra.txt"
const outputFile = extraSource.replace(/\.txt$/, "_cleaned.txt");

// ===== comment handling =====
const isComment = line =>
  line.startsWith("!") ||
  line.startsWith("#") ||
  line.startsWith("//");

const normalize = line =>
  line.trim();

// ===== read source (file or url) =====
const readSource = source => {
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
(async () => {
  try {
    const coreRaw = await readSource(coreSource);
    const extraRaw = await readSource(extraSource);

    const coreSet = new Set(
      coreRaw
        .split("\n")
        .map(normalize)
        .filter(line => line && !isComment(line))
    );

    const result = extraRaw
      .split("\n")
      .map(normalize)
      .filter(line => line && !isComment(line))
      .filter(line => !coreSet.has(line));

    fs.writeFileSync(outputFile, result.join("\n"));

    console.log(`✔ Done! ${result.length} rules kept.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
