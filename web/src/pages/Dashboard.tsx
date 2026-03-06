import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import ReviewTab from './ReviewTab';
import HistoryTab from './HistoryTab';

type Tab = 'review' | 'history';

const Dashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('review');
  const user = useAuthStore((s) => s.user);
  const { logout } = useLogout();

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          Review<span style={{ color: 'var(--accent)' }}>Bot</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.email}
            </span>
          )}
          <button
            onClick={logout}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 2rem',
          display: 'flex',
          gap: '0.25rem',
        }}
      >
        {(['review', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0.875rem 1rem',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              borderBottom:
                tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              background: 'none',
              border: 'none',
              borderBottomStyle: 'solid',
              cursor: 'pointer',
              transition: 'color var(--transition)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '2rem',
          maxWidth: 800,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {tab === 'review' ? <ReviewTab /> : <HistoryTab />}
      </div>
    </div>
  );
};

export default Dashboard;
