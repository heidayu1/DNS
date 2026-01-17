const fs = require("fs");
const https = require("https");

const coreSource = "./blocklist/fusion.txt";    // hoặc URL
const extraSource = "./blocklist/privacy.txt"; // hoặc URL
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
    if (/^https?:\/\//i.test(source)) {
      https.get(source, res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => resolve(data));
      }).on("error", reject);
    } else {
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
    // ---- read core ----
    const coreRaw = await readSource(coreSource);
    const coreSet = new Set(
      coreRaw
        .split("\n")
        .map(normalize)
        .filter(line => line && !isComment(line))
    );

    // ---- read extra ----
    const extraLines = (await readSource(extraSource))
      .split("\n")
      .map(normalize);

    // ---- collect header comments ----
    const headerComments = [];
    let i = 0;
    for (; i < extraLines.length; i++) {
      const line = extraLines[i];
      if (!line) continue;
      if (isComment(line)) {
        headerComments.push(line);
      } else {
        break;
      }
    }

    // ---- process rules ----
    const cleanedRules = extraLines
      .slice(i)
      .filter(line => line && !isComment(line))
      .filter(line => !coreSet.has(line));

    // ---- add rule count comment ----
    const ruleCountComment = `! Rules count: ${cleanedRules.length}`;

    // ---- write output ----
    const output = [
      ...headerComments,
      ruleCountComment,
       "!",
      headerComments.length ? "" : null,
      ...cleanedRules
    ].filter(Boolean);

    fs.writeFileSync(outputFile, output.join("\n"));

    console.log(`✔ Header comments: ${headerComments.length}`);
    console.log(`✔ Rules kept     : ${cleanedRules.length}`);
    console.log(`✔ Output         : ${outputFile}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
