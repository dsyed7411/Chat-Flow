import React, { useState } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Zoe', 'Milo', 'Luna', 'Jasper'];

export const LoginModal = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setError('');
    setLoading(true);

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedAvatar)}`;
    try {
      await onLogin(username.trim(), avatarUrl);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <MessageSquare size={32} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '2rem' }}>PulseChat</span>
          </div>
          <p>Join the real-time chat workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Choose your avatar:
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
            <label htmlFor="username-input">Enter Username</label>
            <input
              id="username-input"
              type="text"
              className="form-input"
              placeholder="e.g. Alex, Sarah, DevGuy..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
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
