import { useState, useEffect } from 'react';
import ReviewForm from '../components/ReviewForm';
import ReviewResult from '../components/ReviewResult';
import ShareButton from '../components/ShareButton';
import { useReviewStream } from '../hooks/useReviewStream';
import { reviewsApi } from '../api/reviews';
import type { Review } from '../types';

const ReviewTab: React.FC = () => {
  const { content, isDone, isStreaming, reviewId, error, start, reset } =
    useReviewStream();
  const [review, setReview] = useState<Review | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Once streaming is done, fetch the full saved review from DB
  useEffect(() => {
    if (!isDone || !reviewId) return;
    reviewsApi
      .getById(reviewId)
      .then((res) => setReview(res.data.data))
      .catch(() => setFetchError('Failed to load review. Please refresh.'));
  }, [isDone, reviewId]);

  const handleSubmit = (prUrl: string): void => {
    setReview(null);
    setFetchError(null);
    void start(prUrl);
  };

  const handleNewReview = (): void => {
    reset();
    setReview(null);
    setFetchError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.1rem',
            marginBottom: '0.4rem',
          }}
        >
          Review a Pull Request
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Paste a public GitHub PR URL to get an AI review.
        </p>
      </div>

      <ReviewForm onSubmit={handleSubmit} isLoading={isStreaming} />

      {/* Streaming content */}
      {isStreaming && !review && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              marginBottom: '0.75rem',
            }}
          >
            ● Reviewing…
          </p>
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.7,
            }}
          >
            {content}
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1em',
                background: 'var(--accent)',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
                verticalAlign: 'text-bottom',
              }}
            />
          </pre>
        </div>
      )}

      {/* Stream error */}
      {error && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--red)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}
        >
          <p style={{ color: 'var(--red)', fontSize: '0.875rem' }}>{error}</p>
          <button
            onClick={handleNewReview}
            style={{
              marginTop: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Try again →
          </button>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <p style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{fetchError}</p>
      )}

      {/* Final review result */}
      {review?.result_json && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <ShareButton shareCode={review.share_code} />
            <button
              onClick={handleNewReview}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ← New review
            </button>
          </div>
          <ReviewResult result={review.result_json} prTitle={review.pr_title} />
        </>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default ReviewTab;
