import React from 'react';
import { Menu, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';

export const ChatHeader = ({
  activeChat,
  connectionStatus,
  theme,
  onToggleTheme,
  onToggleSidebar
}) => {
  return (
    <header className="chat-header">
      <div className="header-user-info">
        <button className="toggle-sidebar-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>

        {activeChat.isGlobal ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-glow)' }}>
              <Globe size={22} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Global Workspace</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public Channel &bull; Everyone</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={activeChat.avatar} alt={activeChat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{activeChat.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct Message</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ConnectionBadge status={connectionStatus} />

        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
