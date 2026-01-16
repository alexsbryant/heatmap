// scripts/testLLM.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";

async function run() {
  console.log("Starting test");
  console.log("API key prefix:", process.env.OPENAI_API_KEY?.slice(0, 5));

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const res = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Reviews: Great bars, lively nightlife, crowded but fun.",
  });

  console.log(res.output_text);
  console.log("Done");
}

run().catch(console.error);