import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignup, useVerifyOtp } from '../hooks/useAuth';

type Step = 'form' | 'otp';

const Signup: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const { signup, loading: signupLoading, error: signupError } = useSignup();
  const { verifyOtp, loading: otpLoading, error: otpError } = useVerifyOtp();

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const ok = await signup(email, password);
    if (ok) setStep('otp');
  };

  const handleVerify = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    await verifyOtp(email, otp, 'signup');
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

        {step === 'form' ? (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
              }}
            >
              Create account
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
              }}
            >
              Already have an account?{' '}
              <Link to='/login' style={{ color: 'var(--accent)' }}>
                Log in
              </Link>
            </p>

            <form
              onSubmit={handleSignup}
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

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <label htmlFor='password' style={labelStyle}>
                  Password
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                  style={inputStyle}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Minimum 8 characters
                </p>
              </div>

              {signupError && (
                <p
                  role='alert'
                  style={{ fontSize: '0.8rem', color: 'var(--red)' }}
                >
                  {signupError}
                </p>
              )}

              <button
                type='submit'
                disabled={signupLoading}
                style={submitButtonStyle(signupLoading)}
              >
                {signupLoading ? 'Creating account…' : 'Create account'}
              </button>
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
              Check your email
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '2rem',
              }}
            >
              We sent a 6-digit code to{' '}
              <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>

            <form
              onSubmit={handleVerify}
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
                  Verification code
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

              {otpError && (
                <p
                  role='alert'
                  style={{ fontSize: '0.8rem', color: 'var(--red)' }}
                >
                  {otpError}
                </p>
              )}

              <button
                type='submit'
                disabled={otpLoading || otp.length !== 6}
                style={submitButtonStyle(otpLoading || otp.length !== 6)}
              >
                {otpLoading ? 'Verifying…' : 'Verify & continue'}
              </button>

              <button
                type='button'
                onClick={() => setStep('form')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ← Back
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

export default Signup;
