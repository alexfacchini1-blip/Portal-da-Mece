const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    // Se estiver rodando no navegador (ais-dev, ais-pre ou qualquer domínio externo), usa caminho relativo
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
  }
  return '';
};

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
  if (url.startsWith('/api/') || url.startsWith('api/')) {
    const base = getApiBase();
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${base}${cleanPath}`;
  }
  return fetch(url, {
    ...init,
    credentials: 'include',
  });
}

export default apiFetch;
