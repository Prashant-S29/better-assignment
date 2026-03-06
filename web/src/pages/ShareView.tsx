import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reviewsApi } from '../api/reviews';
import ReviewResult from '../components/ReviewResult';
import type { Review } from '../types';

const ShareView: React.FC = () => {
  const { hex } = useParams<{ hex: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hex) return;
    reviewsApi
      .getByShareCode(hex)
      .then((res) => setReview(res.data.data))
      .catch((err) => {
        const status = err?.response?.status as number | undefined;
        setError(
          status === 404 ? 'Review not found.' : 'Failed to load review.',
        );
      })
      .finally(() => setLoading(false));
  }, [hex]);

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <nav
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          height: 56,
        }}
      >
        <Link
          to='/dashboard'
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          Review<span style={{ color: 'var(--accent)' }}>Bot</span>
        </Link>
        <span
          style={{
            marginLeft: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          / shared review
        </span>
      </nav>

      <main
        style={{
          flex: 1,
          padding: '2rem',
          maxWidth: 800,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {loading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading…
          </p>
        )}

        {error && (
          <div>
            <p
              style={{
                color: 'var(--red)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </p>
            <Link
              to='/dashboard'
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              ← Back to dashboard
            </Link>
          </div>
        )}

        {review?.result_json && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <p
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Shared review
              </p>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {review.pr_url}
              </p>
            </div>
            <ReviewResult
              result={review.result_json}
              prTitle={review.pr_title}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default ShareView;
