import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResetPassword } from '../hooks/useAuth';

type Step = 'email' | 'otp';

const ResetPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);
  const { requestReset, confirmReset, loading, error } = useResetPassword();
  const navigate = useNavigate();

  const handleRequest = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const ok = await requestReset(email);
    if (ok) setStep('otp');
  };

  const handleConfirm = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const ok = await confirmReset(email, otp, newPassword);
    if (ok) {
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    }
  };

  if (done) {
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
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            Password updated
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Redirecting to login…
          </p>
        </div>
      </main>
    );
  }

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

        {step === 'email' ? (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
              }}
            >
              Reset password
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
              }}
            >
              Enter your email and we&apos;ll send a reset code.
            </p>
            <form
              onSubmit={handleRequest}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <label htmlFor='email' style={labelStyle}>
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
              {error && (
                <p
                  role='alert'
                  style={{ fontSize: '0.8rem', color: 'var(--red)' }}
                >
                  {error}
                </p>
              )}
              <button
                type='submit'
                disabled={loading}
                style={submitButtonStyle(loading)}
              >
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
              <Link
                to='/login'
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                ← Back to login
              </Link>
            </form>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
              }}
            >
              Enter new password
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
              }}
            >
              Code sent to{' '}
              <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
            <form
              onSubmit={handleConfirm}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <label htmlFor='otp' style={labelStyle}>
                  Reset code
                </label>
                <input
                  id='otp'
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]{6}'
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder='000000'
                  autoFocus
                  style={{
                    ...inputStyle,
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <label htmlFor='new-password' style={labelStyle}>
                  New password
                </label>
                <input
                  id='new-password'
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                  style={inputStyle}
                />
              </div>
              {error && (
                <p
                  role='alert'
                  style={{ fontSize: '0.8rem', color: 'var(--red)' }}
                >
                  {error}
                </p>
              )}
              <button
                type='submit'
                disabled={loading || otp.length !== 6 || newPassword.length < 8}
                style={submitButtonStyle(
                  loading || otp.length !== 6 || newPassword.length < 8,
                )}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
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

const submitButtonStyle = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? 'var(--bg-hover)' : 'var(--accent)',
  color: disabled ? 'var(--text-muted)' : '#000',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  fontSize: '0.875rem',
  padding: '0.85rem',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: '0.5rem',
  transition: 'all var(--transition)',
});

export default ResetPassword;
