import client from './client';
import type { Review } from '../types';

interface SubmitReviewPayload {
  pr_url: string;
}

interface ReviewListItem {
  id: string;
  pr_url: string;
  pr_title: string | null;
  share_code: string;
  status: Review['status'];
  overall_score: number | null;
  created_at: string;
}

export const reviewsApi = {
  submit: (payload: SubmitReviewPayload) =>
    client.post<{ success: true; data: { review_id: string } }>(
      '/api/reviews',
      payload,
    ),

  getById: (id: string) =>
    client.get<{ success: true; data: Review }>(`/api/reviews/${id}`),

  getAll: () =>
    client.get<{ success: true; data: ReviewListItem[] }>('/api/reviews'),

  getByShareCode: (hex: string) =>
    client.get<{ success: true; data: Review }>(`/api/share/${hex}`),
} as const;
