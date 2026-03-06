import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link
          to='/'
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.25rem',
            display: 'block',
            marginBottom: '2.5rem',
          }}
        >
          Review<span style={{ color: 'var(--accent)' }}>Bot</span>
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '2rem',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link to='/signup' style={{ color: 'var(--accent)' }}>
            Sign up
          </Link>
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
          >
            <label
              htmlFor='email'
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
              style={inputStyle}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label
                htmlFor='password'
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                }}
              >
                Password
              </label>
              <Link
                to='/reset-password'
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete='current-password'
              style={inputStyle}
            />
          </div>

          {error && (
            <p role='alert' style={{ fontSize: '0.8rem', color: 'var(--red)' }}>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            style={submitButtonStyle(loading)}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </main>
  );
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '0.75rem 1rem',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
};

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  background: loading ? 'var(--bg-hover)' : 'var(--accent)',
  color: loading ? 'var(--text-muted)' : '#000',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  fontSize: '0.875rem',
  padding: '0.85rem',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer',
  marginTop: '0.5rem',
  transition: 'all var(--transition)',
});

export default Login;
