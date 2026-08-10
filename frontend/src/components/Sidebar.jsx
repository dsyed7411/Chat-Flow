import React from 'react';
import { MessageSquare, Globe, LogOut } from 'lucide-react';

const DEFAULT_DEMO_USERS = [
  { id: 'usr_demo_alice', username: 'Alice', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka', status: 'online', role: 'Product Designer' },
  { id: 'usr_demo_bob', username: 'Bob', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix', status: 'online', role: 'Software Engineer' },
  { id: 'usr_demo_sarah', username: 'Sarah', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luna', status: 'online', role: 'UX Researcher' },
  { id: 'usr_demo_alex', username: 'Alex', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Milo', status: 'offline', role: 'Tech Lead' }
];

export const Sidebar = ({
  currentUser,
  users,
  activeChat,
  onSelectChat,
  onLogout,
  isOpen,
  onCloseMobile
}) => {
  // Combine real registered users with default demo accounts (filtering out current logged-in user)
  const combinedUsersMap = new Map();

  DEFAULT_DEMO_USERS.forEach((u) => {
    if (u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      combinedUsersMap.set(u.id, u);
    }
  });

  (users || []).forEach((u) => {
    if (u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      combinedUsersMap.set(u.id, u);
    }
  });

  const displayUsers = Array.from(combinedUsersMap.values());

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

        <div className="channels-title" style={{ marginTop: '16px' }}>Direct Messages ({displayUsers.length})</div>
        {displayUsers.map((user) => {
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
        })}
      </div>
    </aside>
  );
};
