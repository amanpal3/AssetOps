/**
 * API test client helper.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.API_URL || 'http://localhost:4000/api';
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  return res.json();
}
