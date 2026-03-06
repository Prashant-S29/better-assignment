import { useState } from 'react';

interface Props {
  shareCode: string;
}

const ShareButton: React.FC<Props> = ({ shareCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    const url = `${window.location.origin}/share/${shareCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: copied ? 'var(--bg-hover)' : 'transparent',
        border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '0.5rem 1rem',
        color: copied ? 'var(--green)' : 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = 'var(--border-focus)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-dim)';
        }
      }}
    >
      <span>{copied ? '✓' : '⎘'}</span>
      <span>{copied ? 'Copied!' : 'Copy share link'}</span>
    </button>
  );
};

export default ShareButton;
