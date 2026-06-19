import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// Pulls the interpretation lines from the Google Sheet and pushes them into the
// Supabase `content` table. 

const SHEET_ID = "1ILSdmS8fcZiMuNkgf2ZbByz8B_DX9vD_laICobdh3rM";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

// ── 1. Read every tab from the sheet ────────────────────────────────────────
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
    Object.fromEntries((header ?? []).map((h, j) => [h, r[j] ?? ""])),
  );
});

// ── 2. Flatten the tabs into `content` rows ─────────────────────────────────
// Shape: { section, subtype, item_key, line, min_tier }. All current sheet
// content belongs to the 个人蓝图 (Standard) tier, so min_tier = 1.
const rows = [];
const push = (section, subtype, item_key, line) => {
  if (!item_key || !line) return; // skip blank cells
  rows.push({ section, subtype, item_key: String(item_key), line, min_tier: 1 });
};

for (const r of result.Root ?? []) push("root", "", r.number, r.line);
for (const r of result.Story ?? []) push("story", "", r.number, r.line);
for (const r of result.Hidden ?? []) push("hidden", r.Type, r.Number, r.Line);
for (const r of result.MajorMinor ?? []) push("majorminor", r.Type, r.Number, r.Line);
for (const r of result.Health ?? []) push("health", "", r.element, r.body);
for (const r of result.Career ?? []) push("career", "", r.element, r.careers);

// ── 3. Upsert into Supabase (service role bypasses RLS) ─────────────────────
// Upsert keyed on the table's (section, subtype, item_key) unique constraint:
// new rows are inserted, changed lines updated. (A row deleted from the sheet
// would persist here until cleaned up — harmless, since it stays gated.)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const { error } = await supabase
  .from("content")
  .upsert(rows, { onConflict: "section,subtype,item_key" });

if (error) {
  console.error("Failed to upsert content:", error);
  process.exit(1);
}

console.log(`Upserted ${rows.length} content rows from ${tabNames.length} tabs: ${tabNames.join(", ")}`);
