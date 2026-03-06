import { z } from 'zod';

// Must mirror server-side ReviewRequest regex in schemas/review_schema.py exactly
const GITHUB_PR_PATTERN =
  /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/pull\/\d+$/;

export const prUrlSchema = z.string().trim().regex(GITHUB_PR_PATTERN, {
  message:
    'Must be a valid GitHub PR URL: https://github.com/{owner}/{repo}/pull/{number}',
});

interface ValidResult {
  valid: true;
}

interface InvalidResult {
  valid: false;
  error: string;
}

export type PrUrlValidationResult = ValidResult | InvalidResult;

export function validatePrUrl(url: string): PrUrlValidationResult {
  const result = prUrlSchema.safeParse(url);
  if (result.success) return { valid: true };
  return {
    valid: false,
    error: result.error.errors[0]?.message ?? 'Invalid PR URL',
  };
}
