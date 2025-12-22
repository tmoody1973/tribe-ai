/**
 * Script to seed the passport index table with visa requirement data
 *
 * Usage:
 *   npx tsx scripts/seed-passport-index.ts
 *
 * This script reads the passport-index-iso2.csv file and populates the
 * passportIndex table in Convex with visa requirement data.
 */

import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES_MS = 500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedPassportIndex() {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error("Error: CONVEX_URL environment variable not set");
    console.log("Please set it to your Convex deployment URL");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  const csvPath = path.join(__dirname, "../data/passport-index-iso2.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    console.log("Please download the file first:");
    console.log(
      '  curl -sL "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy-iso2.csv" -o data/passport-index-iso2.csv'
    );
    process.exit(1);
  }

  console.log("Reading passport index CSV...");
  const csv = fs.readFileSync(csvPath, "utf-8");

  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  }) as { Passport: string; Destination: string; Requirement: string }[];

  console.log(`Found ${records.length} entries`);

  // Clear existing data
  console.log("Clearing existing passport index data...");
  const cleared = await client.mutation(api.passportIndex.clearAll, {});
  console.log(`Cleared ${cleared} existing entries`);

  // Insert in batches
  let inserted = 0;
  const batches = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE).map((record) => ({
      origin: record.Passport,
      destination: record.Destination,
      requirement: record.Requirement,
    }));
    batches.push(batch);
  }

  console.log(`Processing ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await client.mutation(api.passportIndex.batchInsert, { entries: batch });
      inserted += batch.length;

      if ((i + 1) % 50 === 0) {
        console.log(
          `Progress: ${inserted}/${records.length} (${Math.round((inserted / records.length) * 100)}%)`
        );
      }

      // Small delay to avoid rate limiting
      if (i < batches.length - 1) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (error) {
      console.error(`Error inserting batch ${i + 1}:`, error);
      throw error;
    }
  }

  console.log(`\nSuccess! Seeded ${inserted} passport index records`);
}

seedPassportIndex().catch(console.error);
