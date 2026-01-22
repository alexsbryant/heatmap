/**
 * OpenAI LLM integration for vibe scoring
 */

import OpenAI from 'openai';
import {
  VibeScores,
  VIBE_DIMENSIONS,
  LLM_MODEL,
  RETRY_CONFIG,
  GooglePlaceDetails,
} from './config';
import { RateLimiter, withRetry } from './rateLimiter';

const SYSTEM_PROMPT = `You are a location vibe classifier. Analyze the following reviews and return vibe scores.

Score each dimension from 0.0 to 1.0:
- lively: Energy, noise, activity
- social: Group-oriented vs solo
- upscale: Price level, polish
- casual: Relaxed, informal
- trendy: New, popular, fashionable
- local: Neighborhood feel vs touristy
- photogenic: Visual/Instagram appeal

Respond with ONLY valid JSON:
{"lively":0.0,"social":0.0,"upscale":0.0,"casual":0.0,"trendy":0.0,"local":0.0,"photogenic":0.0}`;

export class VibeScorer {
  private client: OpenAI;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, rateLimiter: RateLimiter) {
    this.client = new OpenAI({ apiKey });
    this.rateLimiter = rateLimiter;
  }

  /**
   * Score vibe dimensions from aggregated review text
   */
  async scoreVibes(reviewText: string): Promise<VibeScores> {
    await this.rateLimiter.acquire();

    const prompt = `Reviews:\n"""\n${reviewText}\n"""`;

    const response = await withRetry(
      async () => {
        const res = await this.client.responses.create({
          model: LLM_MODEL,
          instructions: SYSTEM_PROMPT,
          input: prompt,
        });
        return res;
      },
      {
        ...RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.log(`  Retry ${attempt}/${RETRY_CONFIG.maxRetries} for LLM: ${error.message}`);
        },
      }
    );

    const outputText = response.output_text;
    return this.parseVibeScores(outputText);
  }

  /**
   * Parse LLM output into vibe scores
   */
  private parseVibeScores(text: string): VibeScores {
    // Initialize with nulls
    const scores: VibeScores = {
      lively: null,
      social: null,
      upscale: null,
      casual: null,
      trendy: null,
      local: null,
      photogenic: null,
    };

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('  No JSON found in LLM response:', text.slice(0, 200));
        return scores;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and extract each dimension
      for (const dim of VIBE_DIMENSIONS) {
        const value = parsed[dim];
        if (typeof value === 'number' && value >= 0 && value <= 1) {
          scores[dim] = Math.round(value * 100) / 100; // Round to 2 decimal places
        }
      }

      return scores;
    } catch (error) {
      console.error('  Failed to parse LLM response:', (error as Error).message);
      console.error('  Raw response:', text.slice(0, 200));
      return scores;
    }
  }
}

/**
 * Aggregate review text from place details
 * Returns the aggregated text and total review count
 */
export function aggregateReviews(
  placeDetails: GooglePlaceDetails[]
): { text: string; count: number } {
  const reviewTexts: string[] = [];
  let totalCount = 0;

  for (const place of placeDetails) {
    if (!place.reviews) continue;

    for (const review of place.reviews) {
      const text = review.text?.text;
      if (text && text.trim()) {
        reviewTexts.push(text.trim());
        totalCount++;
      }
    }
  }

  // Truncate to reasonable size for LLM context
  // Aim for ~8000 chars to stay well under token limits
  const MAX_CHARS = 8000;
  let aggregated = '';

  for (const text of reviewTexts) {
    if (aggregated.length + text.length + 2 > MAX_CHARS) {
      break;
    }
    aggregated += text + '\n\n';
  }

  return {
    text: aggregated.trim(),
    count: totalCount,
  };
}

/**
 * Create empty vibe scores (all nulls) for cells with no data
 */
export function emptyVibeScores(): VibeScores {
  return {
    lively: null,
    social: null,
    upscale: null,
    casual: null,
    trendy: null,
    local: null,
    photogenic: null,
  };
}
