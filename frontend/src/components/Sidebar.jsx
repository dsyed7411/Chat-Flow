import React from 'react';
import { MessageSquare, Globe, Users, LogOut, ShieldCheck } from 'lucide-react';

export const Sidebar = ({
  currentUser,
  users,
  activeChat,
  onSelectChat,
  onLogout,
  isOpen,
  onCloseMobile
}) => {
  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-logo">
          <MessageSquare size={24} />
          <span>ChatFlow</span>
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {currentUser && (
        <div className="user-profile-badge">
          <img src={currentUser.avatar} alt={currentUser.username} className="user-avatar" />
          <div className="user-info">
            <div className="user-name">{currentUser.username}</div>
            <div className="user-status">
              <span className="status-dot"></span>
              Online
            </div>
          </div>
        </div>
      )}

      <div className="contacts-list">
        <div className="channels-title">Channels</div>
        <div
          className={`contact-item ${activeChat.id === 'global' ? 'active' : ''}`}
          onClick={() => {
            onSelectChat({ id: 'global', name: 'Global Workspace', isGlobal: true });
            if (onCloseMobile) onCloseMobile();
          }}
        >
          <div className="contact-avatar-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-glow)' }}>
            <Globe size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="user-info">
            <div className="user-name">Global Workspace</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public broadcast channel</div>
          </div>
        </div>

        <div className="channels-title" style={{ marginTop: '16px' }}>Direct Messages ({otherUsers.length})</div>
        {otherUsers.length === 0 ? (
          <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No other users online. Open another browser tab to test 2-way chat!
          </div>
        ) : (
          otherUsers.map((user) => {
            const isOnline = user.status === 'online';
            const isActive = activeChat.id === user.id;

            return (
              <div
                key={user.id}
                className={`contact-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectChat({ id: user.id, name: user.username, avatar: user.avatar, isGlobal: false });
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <div className="contact-avatar-wrapper">
                  <img src={user.avatar} alt={user.username} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                  <span className={`contact-status-dot ${isOnline ? 'online' : 'offline'}`} />
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: isOnline ? 'var(--status-online)' : 'var(--text-dim)' }}>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
