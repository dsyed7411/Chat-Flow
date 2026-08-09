const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const loginUser = async (username, avatar) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, avatar }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const fetchMessages = async (receiver_id = 'global', sender_id = null) => {
  let url = `${API_BASE_URL}/messages?receiver_id=${encodeURIComponent(receiver_id)}`;
  if (sender_id && receiver_id !== 'global') {
    url += `&sender_id=${encodeURIComponent(sender_id)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

export const postMessage = async (sender_id, receiver_id, content) => {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, content }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
};

export const markReadApi = async (sender_id, receiver_id) => {
  const response = await fetch(`${API_BASE_URL}/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id }),
  });
  if (!response.ok) {
    throw new Error('Failed to update read status');
  }
  return response.json();
};
