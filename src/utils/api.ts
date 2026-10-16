const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
  if (url.startsWith('/api/') || url.startsWith('api/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${API_BASE}${cleanPath}`;
  }
  return fetch(url, {
    ...init,
    credentials: 'include',
  });
}

export default apiFetch;
