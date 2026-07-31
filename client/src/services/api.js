const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data.data;
}

export const roomService = {
  createRoom: (username) =>
    request('/rooms', { method: 'POST', body: JSON.stringify({ username }) }),

  checkRoom: (code) => request(`/rooms/${code}`),
};
