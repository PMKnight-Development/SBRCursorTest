import axios from 'axios';

const API_URL = '/api/auth';

export async function login(username: string, password: string) {
  console.log('Making login request to:', `${API_URL}/login`);
  const response = await axios.post(`${API_URL}/login`, { username, password });
  console.log('Login response received:', response.data);
  return response.data;
}

export async function getCurrentUser(token: string) {
  console.log('Making getCurrentUser request to:', `${API_URL}/me`);
  const response = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GetCurrentUser response received:', response.data);
  return response.data;
} 