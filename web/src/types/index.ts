// ── Auth ──────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// ── Review ────────────────────────────────────────────────────
export interface ReviewSection {
  observations: string;
  score: number; // 1–5
}

export interface ReviewResult {
  summary: string;
  architecture: ReviewSection;
  quality: ReviewSection;
  correctness: ReviewSection;
  security: ReviewSection;
  error_handling: ReviewSection;
  overall_score: number; // 1.0–5.0
}

export interface Review {
  id: string;
  pr_url: string;
  pr_title: string | null;
  pr_diff_size: number | null;
  share_code: string;
  status: 'pending' | 'completed' | 'failed';
  result_json: ReviewResult | null;
  error_message: string | null;
  created_at: string;
}

// ── API response wrapper ───────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── SSE stream events ─────────────────────────────────────────
export type StreamEvent =
  | { token: string }
  | { done: true; review_id: string }
  | { error: string };
