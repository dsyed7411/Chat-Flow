const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://chat-flow-backend-53ra.onrender.com/api';
  }
  return 'http://localhost:5000/api';
})();

const safeFetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
};

export const loginUser = async (username, avatar) => {
  const cleanUsername = username.trim();
  const avatarUrl = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const data = await safeFetchJson(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, avatar: avatarUrl }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    return {
      user: {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        username: cleanUsername,
        avatar: avatarUrl,
        status: 'online',
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    };
  }
};

export const fetchUsers = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const data = await safeFetchJson(`${API_BASE_URL}/auth/users`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return data;
  } catch (e) {
    return { users: [] };
  }
};

export const fetchMessages = async (receiver_id = 'global', sender_id = null) => {
  let url = `${API_BASE_URL}/messages?receiver_id=${encodeURIComponent(receiver_id)}`;
  if (sender_id && receiver_id !== 'global') {
    url += `&sender_id=${encodeURIComponent(sender_id)}`;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const data = await safeFetchJson(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return data;
  } catch (e) {
    return { messages: [] };
  }
};

export const postMessage = async (sender_id, receiver_id, content, sender_name, sender_avatar) => {
  return safeFetchJson(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, content, sender_name, sender_avatar }),
  });
};

export const markReadApi = async (sender_id, receiver_id) => {
  try {
    return await safeFetchJson(`${API_BASE_URL}/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id, receiver_id }),
    });
  } catch (e) {
    return { success: false };
  }
};
