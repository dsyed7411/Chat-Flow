const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://chat-flow-backend.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const safeFetchJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error('Unable to connect to backend server. Make sure backend service is running.');
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
};

export const loginUser = async (username, avatar) => {
  return safeFetchJson(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, avatar }),
  });
};

export const fetchUsers = async () => {
  return safeFetchJson(`${API_BASE_URL}/auth/users`);
};

export const fetchMessages = async (receiver_id = 'global', sender_id = null) => {
  let url = `${API_BASE_URL}/messages?receiver_id=${encodeURIComponent(receiver_id)}`;
  if (sender_id && receiver_id !== 'global') {
    url += `&sender_id=${encodeURIComponent(sender_id)}`;
  }
  return safeFetchJson(url);
};

export const postMessage = async (sender_id, receiver_id, content) => {
  return safeFetchJson(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, content }),
  });
};

export const markReadApi = async (sender_id, receiver_id) => {
  return safeFetchJson(`${API_BASE_URL}/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id }),
  });
};
