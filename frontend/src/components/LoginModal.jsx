import React, { useState } from 'react';
import { MessageSquare, UserCheck } from 'lucide-react';

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Zoe', 'Milo', 'Luna', 'Jasper'];

const DUMMY_ACCOUNTS = [
  { username: 'Alice', avatarSeed: 'Aneka', role: 'Product Designer' },
  { username: 'Bob', avatarSeed: 'Felix', role: 'Software Engineer' }
];

export const LoginModal = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (name, avatarSeed) => {
    if (!name.trim()) {
      setError('Please enter a username');
      return;
    }
    setError('');
    setLoading(true);

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;
    try {
      await onLogin(name.trim(), avatarUrl);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(username, selectedAvatar);
  };

  const handleQuickLogin = (account) => {
    setUsername(account.username);
    setSelectedAvatar(account.avatarSeed);
    performLogin(account.username, account.avatarSeed);
  };

  return (
    <div className="modal-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <MessageSquare size={32} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '2rem' }}>ChatFlow</span>
          </div>
          <p>Join the real-time chat workspace</p>
        </div>

        {/* Quick Demo Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={14} style={{ color: 'var(--accent-primary)' }} /> Quick Demo Accounts (One-Click Login):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {DUMMY_ACCOUNTS.map((acc) => {
              const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.avatarSeed)}`;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'var(--bg-active)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-input)';
                  }}
                >
                  <img src={avatarUrl} alt={acc.username} style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{acc.username}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.role}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>or custom login</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textAlign: 'left' }}>
              Choose avatar:
            </label>
            <div className="avatar-selector">
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
                return (
                  <img
                    key={seed}
                    src={url}
                    alt={seed}
                    className={`avatar-option ${selectedAvatar === seed ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(seed)}
                  />
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username-input">Username</label>
            <input
              id="username-input"
              type="text"
              className="form-input"
              placeholder="e.g. Alex, Sarah, DevGuy..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Joining Chat...' : 'Start Chatting'}
          </button>
        </form>
      </div>
    </div>
  );
};
