const fs = require("fs");
const https = require("https");

// ===== CONFIG =====

// 👉 có thể add bao nhiêu core cũng được
const coreSources = [
  "./blocklist/fusion.txt",
  "./blocklist/HostVN.txt",
  "./blocklist/mostbigtech.txt",
  "./blocklist/HostVN.txt",
  "./blocklist/privacy.txt"
];

const extraSource = "./blocklist/iblockads.txt"; // hoặc URL
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
    // 🔹 load tất cả core sources
    const coreRaws = await Promise.all(
      coreSources.map(readSource)
    );

    // 🔹 gộp tất cả rule core vào 1 Set
    const coreSet = new Set();
    for (const raw of coreRaws) {
      for (const rule of parseRules(raw)) {
        coreSet.add(rule);
      }
    }

    // 🔹 load extra
    const extraRaw = await readSource(extraSource);

    const result = parseRules(extraRaw)
      .filter(rule => !coreSet.has(rule));

    fs.writeFileSync(outputFile, result.join("\n"));

    console.log(`✔ Core sources: ${coreSources.length}`);
    console.log(`✔ Core rules: ${coreSet.size}`);
    console.log(`✔ Extra kept: ${result.length}`);
    console.log(`✔ Output: ${outputFile}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
