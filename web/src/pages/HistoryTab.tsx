import { useState, useEffect } from 'react';
import { reviewsApi } from '../api/reviews';
import ReviewCard from '../components/ReviewCard';
import type { Review } from '../types';

type HistoryItem = Pick<
  Review,
  'id' | 'pr_url' | 'pr_title' | 'share_code' | 'status' | 'created_at'
> & { result_json?: Review['result_json'] };

const HistoryTab: React.FC = () => {
  const [reviews, setReviews] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewsApi
      .getAll()
      .then((res) => setReviews(res.data.data as HistoryItem[]))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          padding: '2rem 0',
        }}
      >
        Loading history…
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'var(--red)', fontSize: '0.875rem' }}>{error}</p>;
  }

  if (reviews.length === 0) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No reviews yet.
        </p>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            marginTop: '0.5rem',
          }}
        >
          Submit a PR URL in the Review tab to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.1rem',
            marginBottom: '0.25rem',
          }}
        >
          Review History
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;
