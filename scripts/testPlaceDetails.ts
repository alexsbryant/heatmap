// scripts/testPlaceDetails.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  throw new Error("Missing GOOGLE_PLACES_API_KEY in env");
}

// Replace with a real placeId from your search test
const PLACE_ID = "ChIJjfhunpiAhYARL76pNCCCFvg"; // <-- replace this

async function run() {
  console.log("Starting Place Details test");
  console.log("API key prefix:", API_KEY?.slice(0, 5));

  const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": [
        "displayName",
        "rating",
        "userRatingCount",
        "reviews.text.text",
        "reviews.rating",
        "reviews.relativePublishTimeDescription"
      ].join(",")
    }
  });

  if (!res.ok) {
    console.error("HTTP error:", res.status);
    console.error(await res.text());
    return;
  }

  const data = await res.json();

  const reviews = data.reviews ?? [];

  console.log("Place:", data.displayName?.text);
  console.log("Rating:", data.rating, "(", data.userRatingCount, "reviews )");
  console.log("Returned reviews:", reviews.length);

  if (reviews.length === 0) {
    console.log("⚠️ No reviews returned");
    return;
  }

  const lengths = reviews.map((r: any) => r.text?.text?.length ?? 0);
  const avgLength =
    lengths.reduce((a: number, b: number) => a + b, 0) / lengths.length;

  console.log("Average review length:", Math.round(avgLength), "chars");
  console.log("---- Review samples ----");

  reviews.forEach((r: any, i: number) => {
    console.log(`\n#${i + 1} (${r.rating}★, ${r.relativePublishTimeDescription})`);
    console.log(r.text?.text?.slice(0, 300));
  });

  console.log("\nDone.");
}

run().catch(console.error);