import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [connectionStatus, setConnectionStatus] = useState('reconnecting');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Maintain activeChat reference for socket event handlers
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Apply theme dataset
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('chatflow_theme', theme);
    } catch (e) {}
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
    const cleanName = (username || '').trim() || 'Guest';
    const cleanAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

    let userToSet = null;
    try {
      const data = await loginUser(cleanName, cleanAvatar);
      if (data && data.user && data.user.id) {
        userToSet = data.user;
      }
    } catch (e) {
      console.warn('Backend login fallback:', e);
    }

    if (!userToSet) {
      userToSet = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        username: cleanName,
        avatar: cleanAvatar,
        status: 'online',
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    setCurrentUser(userToSet);
    try {
      localStorage.setItem('chatflow_user', JSON.stringify(userToSet));
    } catch (e) {}
  };

  // Handle user logout
  const handleLogout = () => {
    disconnectSocket();
    try {
      localStorage.removeItem('chatflow_user');
      localStorage.removeItem('pulsechat_user');
    } catch (e) {}
    setCurrentUser(null);
  };

  // Socket.io initialization and real-time listeners - ONLY depends on currentUser.id
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

    const onConnecting = () => {
      setConnectionStatus('reconnecting');
    };

    const onReceiveMessage = (newMessage) => {
      const currentActive = activeChatRef.current;
      const isForGlobal = currentActive.isGlobal && newMessage.receiver_id === 'global';
      const isForDirect =
        !currentActive.isGlobal &&
        ((newMessage.sender_id === currentActive.id && newMessage.receiver_id === currentUser.id) ||
          (newMessage.sender_id === currentUser.id && newMessage.receiver_id === currentActive.id));

      if (isForGlobal || isForDirect) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        if (isForDirect && newMessage.sender_id === currentActive.id) {
          socket.emit('mark_read', { sender_id: currentActive.id, receiver_id: currentUser.id });
        }
      }
    };

    const onUserStatusChanged = ({ userId, status, last_seen }) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, status, last_seen } : u))
      );
    };

    const onUserTyping = ({ sender_id, sender_name, receiver_id }) => {
      const currentActive = activeChatRef.current;
      const isMatchingChat =
        (currentActive.isGlobal && receiver_id === 'global') ||
        (!currentActive.isGlobal && sender_id === currentActive.id && receiver_id === currentUser.id);

      if (isMatchingChat) {
        setTypingUsers((prev) => (prev.includes(sender_name) ? prev : [...prev, sender_name]));
      }
    };

    const onUserStoppedTyping = ({ sender_id, receiver_id }) => {
      setTypingUsers([]);
    };

    const onMessagesRead = ({ by_user }) => {
      const currentActive = activeChatRef.current;
      if (!currentActive.isGlobal && currentActive.id === by_user) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === currentUser.id ? { ...m, status: 'read' } : m))
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('reconnect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnecting);
    socket.on('reconnect_attempt', onConnecting);
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_status_changed', onUserStatusChanged);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);
    socket.on('messages_read', onMessagesRead);

    const syncStatus = () => {
      if (socket && socket.connected) {
        setConnectionStatus('connected');
      }
    };

    syncStatus();
    const statusInterval = setInterval(syncStatus, 1000);

    return () => {
      clearInterval(statusInterval);
      socket.off('connect', onConnect);
      socket.off('reconnect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnecting);
      socket.off('reconnect_attempt', onConnecting);
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_status_changed', onUserStatusChanged);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      socket.off('messages_read', onMessagesRead);
    };
  }, [currentUser?.id, loadUsers]);

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

    const userMsg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 12),
      sender_id: currentUser.id,
      receiver_id: activeChat.id,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      sender_name: currentUser.username,
      sender_avatar: currentUser.avatar
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === userMsg.id)) return prev;
      return [...prev, userMsg];
    });

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', {
        sender_id: currentUser.id,
        receiver_id: activeChat.id,
        content
      });
    } else {
      postMessage(currentUser.id, activeChat.id, content).catch(() => {});
    }

    // Automated interactive reply for Demo Accounts in Direct Messages
    if (!activeChat.isGlobal && (activeChat.id.startsWith('usr_demo_') || ['Alice', 'Bob', 'Sarah', 'Alex'].includes(activeChat.name))) {
      const demoName = activeChat.name;
      setTimeout(() => {
        setTypingUsers([demoName]);
      }, 800);

      setTimeout(() => {
        setTypingUsers([]);
        const replies = {
          Alice: `Hey ${currentUser.username}! Thanks for trying ChatFlow. Real-time messaging with Socket.io works great! 🚀`,
          Bob: `Hi ${currentUser.username}! Software looks super clean and responsive. Nice job! 👍`,
          Sarah: `Hello ${currentUser.username}! The dark mode UI and glassmorphism styling look awesome! ✨`,
          Alex: `Hey! Thanks for messaging. ChatFlow backend & database persistence are running smoothly! 💻`
        };

        const replyContent = replies[demoName] || `Hey ${currentUser.username}! Received your message: "${content.trim()}"`;

        const replyMsg = {
          id: 'msg_' + Math.random().toString(36).substring(2, 12),
          sender_id: activeChat.id,
          receiver_id: currentUser.id,
          content: replyContent,
          timestamp: new Date().toISOString(),
          status: 'read',
          sender_name: demoName,
          sender_avatar: activeChat.avatar
        };

        setMessages((prev) => [...prev, replyMsg]);
      }, 2200);
    }
  };

  const handleTypingStart = () => {
    const socket = getSocket();
    if (socket && currentUser && socket.connected) {
      socket.emit('typing_start', {
        sender_id: currentUser.id,
        sender_name: currentUser.username,
        receiver_id: activeChat.id
      });
    }
  };

  const handleTypingStop = () => {
    const socket = getSocket();
    if (socket && currentUser && socket.connected) {
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
