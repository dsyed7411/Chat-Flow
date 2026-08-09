import React, { useState, useEffect, useCallback } from 'react';
import { LoginModal } from './components/LoginModal';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import {
  loginUser,
  fetchUsers,
  fetchMessages,
  postMessage,
  markReadApi
} from './services/api';
import { initSocket, disconnectSocket, getSocket } from './services/socket';

export const App = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chatflow_user') || localStorage.getItem('pulsechat_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('chatflow_theme') || localStorage.getItem('pulsechat_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState({
    id: 'global',
    name: 'Global Workspace',
    isGlobal: true
  });
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply theme dataset
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulsechat_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load user list
  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // Load message history for current active chat
  const loadMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await fetchMessages(activeChat.id, currentUser.id);
      setMessages(data.messages || []);

      // If viewing direct messages from another user, mark as read
      if (!activeChat.isGlobal) {
        markReadApi(activeChat.id, currentUser.id).catch(() => {});
        const socket = getSocket();
        if (socket) {
          socket.emit('mark_read', { sender_id: activeChat.id, receiver_id: currentUser.id });
        }
      }
    } catch (err) {
      console.error('Error fetching message history:', err);
    }
  }, [currentUser, activeChat]);

  // Handle user login
  const handleLogin = async (username, avatar) => {
    const data = await loginUser(username, avatar);
    const user = data.user;
    setCurrentUser(user);
    localStorage.setItem('chatflow_user', JSON.stringify(user));
  };

  // Handle user logout
  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('chatflow_user');
    localStorage.removeItem('pulsechat_user');
    setCurrentUser(null);
  };

  // Socket.io initialization and real-time listeners
  useEffect(() => {
    if (!currentUser) return;

    loadUsers();

    const socket = initSocket(currentUser);

    const onConnect = () => {
      setConnectionStatus('connected');
      socket.emit('user_connected', currentUser);
    };

    const onDisconnect = () => {
      setConnectionStatus('offline');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    const onReceiveMessage = (newMessage) => {
      // Check if message belongs to current active view
      const isForGlobal = activeChat.isGlobal && newMessage.receiver_id === 'global';
      const isForDirect =
        !activeChat.isGlobal &&
        ((newMessage.sender_id === activeChat.id && newMessage.receiver_id === currentUser.id) ||
          (newMessage.sender_id === currentUser.id && newMessage.receiver_id === activeChat.id));

      if (isForGlobal || isForDirect) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Mark as read if user is currently looking at this DM
        if (isForDirect && newMessage.sender_id === activeChat.id) {
          socket.emit('mark_read', { sender_id: activeChat.id, receiver_id: currentUser.id });
        }
      }
    };

    const onUserStatusChanged = ({ userId, status, last_seen }) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, status, last_seen } : u))
      );
    };

    const onUserTyping = ({ sender_id, sender_name, receiver_id }) => {
      const isMatchingChat =
        (activeChat.isGlobal && receiver_id === 'global') ||
        (!activeChat.isGlobal && sender_id === activeChat.id && receiver_id === currentUser.id);

      if (isMatchingChat) {
        setTypingUsers((prev) => (prev.includes(sender_name) ? prev : [...prev, sender_name]));
      }
    };

    const onUserStoppedTyping = ({ sender_id, receiver_id }) => {
      setTypingUsers([]);
    };

    const onMessagesRead = ({ by_user }) => {
      if (!activeChat.isGlobal && activeChat.id === by_user) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === currentUser.id ? { ...m, status: 'read' } : m))
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_status_changed', onUserStatusChanged);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);
    socket.on('messages_read', onMessagesRead);

    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_status_changed', onUserStatusChanged);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      socket.off('messages_read', onMessagesRead);
    };
  }, [currentUser, activeChat, loadUsers]);

  // Load message history when active chat changes
  useEffect(() => {
    if (currentUser) {
      loadMessages();
      setTypingUsers([]);
    }
  }, [activeChat, currentUser, loadMessages]);

  // Send message action
  const handleSendMessage = async (content) => {
    if (!currentUser || !content.trim()) return;

    const socket = getSocket();
    if (socket && socket.connected) {
      // Send via Socket.io for instant real-time delivery
      socket.emit('send_message', {
        sender_id: currentUser.id,
        receiver_id: activeChat.id,
        content
      });
    } else {
      // Fallback via REST API
      try {
        const res = await postMessage(currentUser.id, activeChat.id, content);
        setMessages((prev) => [...prev, res.message]);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleTypingStart = () => {
    const socket = getSocket();
    if (socket && currentUser) {
      socket.emit('typing_start', {
        sender_id: currentUser.id,
        sender_name: currentUser.username,
        receiver_id: activeChat.id
      });
    }
  };

  const handleTypingStop = () => {
    const socket = getSocket();
    if (socket && currentUser) {
      socket.emit('typing_stop', {
        sender_id: currentUser.id,
        receiver_id: activeChat.id
      });
    }
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        currentUser={currentUser}
        users={users}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="chat-main">
        <ChatHeader
          activeChat={activeChat}
          connectionStatus={connectionStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <MessageList
          messages={messages}
          currentUser={currentUser}
          typingUsers={typingUsers}
          isGlobal={activeChat.isGlobal}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTypingStart}
          onStopTyping={handleTypingStop}
        />
      </div>
    </div>
  );
};
