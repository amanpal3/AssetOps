const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}
