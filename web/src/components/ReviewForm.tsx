import { useState } from 'react';
import { validatePrUrl } from '../utils/prUrl';

interface Props {
  onSubmit: (prUrl: string) => void;
  isLoading: boolean;
}

const ReviewForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setUrl(e.target.value);
    if (validationError) setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const result = validatePrUrl(url);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }
    onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label
          htmlFor='pr-url'
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          GitHub PR URL
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            id='pr-url'
            type='url'
            value={url}
            onChange={handleChange}
            placeholder='https://github.com/owner/repo/pull/123'
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              border: `1px solid ${validationError ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color var(--transition)',
            }}
            onFocus={(e) => {
              if (!validationError)
                e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onBlur={(e) => {
              if (!validationError)
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
          <button
            type='submit'
            disabled={isLoading || !url.trim()}
            style={{
              background:
                isLoading || !url.trim() ? 'var(--bg-hover)' : 'var(--accent)',
              color: isLoading || !url.trim() ? 'var(--text-muted)' : '#000',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.875rem',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition)',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? 'Scanning…' : 'Scan PR'}
          </button>
        </div>

        {validationError && (
          <p
            role='alert'
            style={{
              fontSize: '0.8rem',
              color: 'var(--red)',
              marginTop: '0.25rem',
            }}
          >
            {validationError}
          </p>
        )}

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          Only public GitHub repositories are supported. Max 500 changed lines.
        </p>
      </div>
    </form>
  );
};

export default ReviewForm;
