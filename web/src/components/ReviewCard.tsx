import { useNavigate } from 'react-router-dom';
import type { Review } from '../types';

interface Props {
  review: Pick<
    Review,
    'id' | 'pr_url' | 'pr_title' | 'share_code' | 'status' | 'created_at'
  > & { result_json?: Review['result_json'] };
}

const STATUS_COLORS: Record<Review['status'], string> = {
  completed: 'var(--green)',
  pending: 'var(--orange)',
  failed: 'var(--red)',
};

const ReviewCard: React.FC<Props> = ({ review }) => {
  const navigate = useNavigate();

  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const repoPath = (() => {
    try {
      const url = new URL(review.pr_url);
      return url.pathname.replace(/\/pull\/\d+$/, '');
    } catch {
      return review.pr_url;
    }
  })();

  const prNumber = review.pr_url.match(/\/pull\/(\d+)$/)?.[1];

  return (
    <button
      onClick={() => navigate(`/dashboard/review/${review.id}`)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        transition:
          'border-color var(--transition), background var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '0.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'white',
            }}
          >
            {review.pr_title ?? `PR #${prNumber ?? '?'}`}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {repoPath}
            {prNumber && (
              <span style={{ color: 'var(--text-dim)' }}> #{prNumber}</span>
            )}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.35rem',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: STATUS_COLORS[review.status],
              fontWeight: 700,
            }}
          >
            {review.status}
          </span>
          {review.result_json && (
            <span
              style={{
                fontSize: '0.75rem',
                color: STATUS_COLORS.completed,
                fontWeight: 700,
              }}
            >
              {review.result_json.overall_score.toFixed(1)}/5
            </span>
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '0.75rem',
        }}
      >
        {date}
      </p>
    </button>
  );
};

export default ReviewCard;
