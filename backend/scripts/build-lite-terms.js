const fs = require("fs");
const path = require("path");

const termsPath = path.resolve(__dirname, "../data/terms/termss.json");

console.log("Reading file from:", termsPath);
console.log("File exists:", fs.existsSync(termsPath));

if (!fs.existsSync(termsPath)) {
  throw new Error(`Cannot find terms file at: ${termsPath}`);
}

const raw = fs.readFileSync(termsPath, "utf-8");
const terms = JSON.parse(raw);
const lite = terms.map((t) => ({
  id: t.id,
  word: t.word,
  searchTerms: t.searchTerms,
  synonyms: t.synonyms,
  category: t.category,
  bodySystem: t.bodySystem,
  definition: t.definition,
  plainDefinition: t.plainDefinition,
  pronunciation: t.pronunciation,
  commonAbbreviation: t.commonAbbreviation,
  parts: t.parts, // small, and needed for list-view dissection previews
  mnemonicSeed: t.mnemonicSeed,
}));

fs.writeFileSync("terms-lite.json", JSON.stringify(lite));
console.log(
  `Full: ${(fs.statSync(termsPath).size / 1024 / 1024).toFixed(1)} MB`,
);
console.log(
  `Lite: ${(Buffer.byteLength(JSON.stringify(lite)) / 1024 / 1024).toFixed(1)} MB`,
);
