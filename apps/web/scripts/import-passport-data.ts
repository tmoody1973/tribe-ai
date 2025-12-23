import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import fs from "fs";
import path from "path";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function importPassportData() {
  const csvPath = path.join(__dirname, "../data/passport-index-iso2.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const lines = csvContent.split("\n").filter(line => line.trim());
  const header = lines[0]; // Skip header
  const dataLines = lines.slice(1);

  console.log(`Found ${dataLines.length} entries to import`);

  // Process in batches of 500 (Convex mutation size limit)
  const BATCH_SIZE = 500;
  let imported = 0;

  for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
    const batch = dataLines.slice(i, i + BATCH_SIZE);
    const entries = batch.map(line => {
      const [origin, destination, requirement] = line.split(",");
      return {
        origin: origin.trim(),
        destination: destination.trim(),
        requirement: requirement.trim(),
      };
    }).filter(e => e.origin && e.destination && e.requirement);

    if (entries.length > 0) {
      try {
        await client.mutation(api.passportIndex.batchInsert, { entries });
        imported += entries.length;
        console.log(`Imported ${imported}/${dataLines.length} entries...`);
      } catch (error) {
        console.error(`Error importing batch starting at ${i}:`, error);
      }
    }
  }

  console.log(`\nDone! Imported ${imported} passport index entries.`);
}

importPassportData().catch(console.error);
