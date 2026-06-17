import { google } from "googleapis";
import { writeFileSync, mkdirSync } from "node:fs";

const SHEET_ID = "1ILSdmS8fcZiMuNkgf2ZbByz8B_DX9vD_laICobdh3rM";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const meta = await sheets.spreadsheets.get({
  spreadsheetId: SHEET_ID,
  fields: "sheets.properties.title",
});
const tabNames = meta.data.sheets.map((s) => s.properties.title);

const res = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges: tabNames,
});

const result = {};
res.data.valueRanges.forEach((vr, i) => {
  const rows = vr.values ?? [];
  const [header, ...body] = rows;
  result[tabNames[i]] = body.map((r) =>
    Object.fromEntries((header ?? []).map((h, j) => [h, r[j] ?? ""]))
  );
});

// src/data/ is gitignored (sheet.json is generated), so it may not exist on a
// clean checkout — create it before writing.
mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/sheet.json", JSON.stringify(result, null, 2));
console.log(`Wrote ${tabNames.length} tabs: ${tabNames.join(", ")}`);