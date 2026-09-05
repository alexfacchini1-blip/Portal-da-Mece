import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

// Unregister any active service worker to clean up aggressive caching by previous PWA implementations, EXCEPT our push notifications service worker
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || '';
      if (!scriptURL.includes('service-worker.js')) {
        registration.unregister().then(() => {
          console.log('[DEBUG] Stale Service Worker unregister success.');
        });
      }
    }
  });

  // Register our push service worker
  navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => {
      console.log('[DEBUG] Push Service Worker registered successfully:', reg.scope);
    })
    .catch((err) => {
      console.error('[DEBUG] Push Service Worker registration failed:', err);
    });
}

// Clear any Cache Storage caches to force asset updates
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.delete(key).then(() => {
        console.log('[DEBUG] Cache Storage clear success:', key);
      });
    });
  });
}

// Global API fetch interceptor
const nativeFetch = typeof window !== 'undefined' && window.fetch 
  ? window.fetch.bind(window) 
  : typeof globalThis !== 'undefined' && globalThis.fetch 
    ? globalThis.fetch.bind(globalThis) 
    : null;

const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let urlStr = '';
  if (typeof input === 'string') {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.toString();
  } else if (input && typeof (input as any).url === 'string') {
    urlStr = (input as any).url;
  }

  if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
    // Inject user identity headers if stored in session to ensure Alexandre and Admin bypass maintenance
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (!init) init = {};
          const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
          if (u.telefone && !headers.has('x-user-phone')) {
            headers.set('x-user-phone', u.telefone);
          }
          if (u.nome && !headers.has('x-user-name')) {
            headers.set('x-user-name', u.nome);
          }
          if (u.sessionToken && !headers.has('x-session-token')) {
            headers.set('x-session-token', u.sessionToken);
          }
          init.headers = headers;
        }
      }
    } catch (e) {
      // Ignore header injection error
    }

    // Support for standalone native Capacitor wrapper when origin is capacitor://
    const isCapacitor = typeof window !== 'undefined' && (
      (window as any).Capacitor !== undefined || 
      window.location.origin.startsWith('capacitor://')
    );

    if (isCapacitor && !window.location.origin.startsWith('http')) {
      const baseProductionUrl = "https://ais-pre-grqsbc4wilkaedjlus7wy3-45519709393.us-east1.run.app";
      const targetUrl = `${baseProductionUrl}${urlStr}`;
      
      if (typeof input === 'string') {
        input = targetUrl;
      } else if (input instanceof URL) {
        input = new URL(targetUrl);
      } else {
        try {
          const clonedRequest = (input as Request).clone();
          input = new Request(targetUrl, clonedRequest);
        } catch (e) {
          input = targetUrl;
        }
      }
    }
  }

  if (nativeFetch) {
    try {
      const response = await nativeFetch(input, init);
      if (response.status === 503) {
        // Dispara evento imediato de modo de manutenção ativado
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('maintenance_mode_active', { detail: { active: true } }));
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  }
  return fetch(input, init);
};

try {
  if (typeof window !== 'undefined') {
    (window as any).fetch = customFetch;
  }
} catch (e) {
  console.warn("Could not assign window.fetch", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
