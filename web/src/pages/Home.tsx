import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Home: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 2rem',
        maxWidth: 700,
        margin: '0 auto',
      }}
    >
      <p
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '1.5rem',
          fontWeight: 700,
        }}
      >
        AI-powered code review
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.05,
          marginBottom: '1.5rem',
        }}
      >
        Review any
        <br />
        GitHub PR
        <span style={{ color: 'var(--accent)' }}>.</span>
        <br />
        Instantly
        <span style={{ color: 'var(--text-muted)' }}>.</span>
      </h1>

      <p
        style={{
          color: 'var(--text-dim)',
          fontSize: '1rem',
          lineHeight: 1.7,
          maxWidth: 480,
          marginBottom: '2.5rem',
        }}
      >
        Paste a public GitHub PR URL. Get a structured AI review covering
        architecture, security, correctness, and code quality — in seconds.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {accessToken ? (
          <Link
            to='/dashboard'
            style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '0.85rem 2rem',
              borderRadius: 'var(--radius)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
            }}
          >
            Go to Dashboard →
          </Link>
        ) : (
          <>
            <Link
              to='/signup'
              style={{
                background: 'var(--accent)',
                color: '#000',
                padding: '0.85rem 2rem',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
              }}
            >
              Get started — free
            </Link>
            <Link
              to='/login'
              style={{
                border: '1px solid var(--border)',
                padding: '0.85rem 2rem',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                color: 'var(--text-dim)',
              }}
            >
              Log in
            </Link>
          </>
        )}
      </div>
      <div
        style={{
          marginTop: '4rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          ['Architecture', 'Patterns & structure'],
          ['Security', 'Vulnerability scan'],
          ['Correctness', 'Logic & edge cases'],
          ['Quality', 'Readability & naming'],
        ].map(([title, desc]) => (
          <div key={title}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--accent)',
                marginBottom: '0.2rem',
              }}
            >
              {title}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Home;
