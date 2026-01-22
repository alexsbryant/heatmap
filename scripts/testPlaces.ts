// scripts/testPlaces.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function run() {
  console.log("Starting Places API test");
  console.log("API key prefix:", API_KEY?.slice(0, 5));

  if (!API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const url = "https://places.googleapis.com/v1/places:searchNearby";

  const body = {
    includedTypes: ["bar"],
    maxResultCount: 3,
    locationRestriction: {
      circle: {
        center: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        radius: 500,
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.types",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  console.log("Status:", res.status);
  console.log(JSON.stringify(json, null, 2));
}

run().catch(console.error);