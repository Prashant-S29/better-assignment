import type { ReviewResult as ReviewResultType, ReviewSection } from '../types';

interface SectionProps {
  label: string;
  section: ReviewSection;
}

const Section: React.FC<SectionProps> = ({ label, section }) => {
  const scoreColor =
    section.score >= 4
      ? 'var(--green)'
      : section.score === 3
        ? 'var(--orange)'
        : 'var(--red)';

  return (
    <div
      style={{
        borderLeft: `3px solid ${scoreColor}`,
        paddingLeft: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: scoreColor,
            fontWeight: 700,
          }}
        >
          {section.score}/5
        </span>
      </div>
      <p
        style={{
          color: 'var(--text-dim)',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}
      >
        {section.observations}
      </p>
    </div>
  );
};

interface Props {
  result: ReviewResultType;
  prTitle?: string | null;
}

const ReviewResult: React.FC<Props> = ({ result, prTitle }) => {
  const scoreColor =
    result.overall_score >= 4
      ? 'var(--green)'
      : result.overall_score >= 3
        ? 'var(--orange)'
        : 'var(--red)';

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.25rem',
              marginBottom: '0.25rem',
            }}
          >
            {prTitle ?? 'Review Complete'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            AI review results
          </p>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${scoreColor}`,
            borderRadius: 'var(--radius)',
            padding: '0.5rem 1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: scoreColor,
            }}
          >
            {result.overall_score.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Overall
          </div>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Summary
        </p>
        <p
          style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text)' }}
        >
          {result.summary}
        </p>
      </div>

      {/* Sections */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <Section
          label='Architecture & Patterns'
          section={result.architecture}
        />
        <Section label='Code Quality' section={result.quality} />
        <Section label='Correctness' section={result.correctness} />
        <Section label='Security' section={result.security} />
        <Section label='Error Handling' section={result.error_handling} />
      </div>
    </div>
  );
};

export default ReviewResult;
