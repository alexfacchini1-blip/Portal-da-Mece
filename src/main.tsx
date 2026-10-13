import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

// Prevenção contra crash de insertBefore / removeChild provocado por ferramentas de tradução de navegadores (ex: Google Tradutor no Chrome)
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}

// Service Worker Registration for PWA Installability & Push Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('[SW] Service Worker registrado para PWA:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Aviso no registro do Service Worker:', err);
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
    // Inject user identity headers and query param to ensure Alexandre and Admin bypass maintenance
    try {
      if (typeof window !== 'undefined') {
        const stored = window.sessionStorage?.getItem('user') || window.localStorage?.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          const rawPhone = u.telefone || u.loginPhone || '';
          const cleanPhone = String(rawPhone).replace(/\D/g, '');

          if (cleanPhone && !urlStr.includes('userPhone=') && !urlStr.includes('telefone=')) {
            const sep = urlStr.includes('?') ? '&' : '?';
            urlStr += `${sep}userPhone=${encodeURIComponent(cleanPhone)}`;
            if (typeof input === 'string') {
              input = urlStr;
            } else if (input instanceof URL) {
              input = new URL(urlStr);
            }
          }

          if (!init) init = {};
          // Convert headers to plain object to prevent WebKit/Safari IDL validation error: "The string did not match the expected pattern"
          const plainHeaders: Record<string, string> = {};
          if (init.headers) {
            if (typeof (init.headers as any).forEach === 'function') {
              (init.headers as any).forEach((v: string, k: string) => {
                plainHeaders[k] = String(v);
              });
            } else if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
              Object.assign(plainHeaders, init.headers);
            }
          }
          if (cleanPhone && !plainHeaders['x-user-phone']) {
            plainHeaders['x-user-phone'] = cleanPhone;
          }
          if (u.nome && !plainHeaders['x-user-name']) {
            plainHeaders['x-user-name'] = encodeURIComponent(String(u.nome));
          }
          if (u.sessionToken && !plainHeaders['x-session-token']) {
            plainHeaders['x-session-token'] = encodeURIComponent(String(u.sessionToken));
          }
          init.headers = plainHeaders;
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
    } catch (err: any) {
      // Se for erro de validação de cabeçalho do Safari/WebKit ("The string did not match the expected pattern"),
      // refaz a requisição de forma limpa sem os cabeçalhos customizados
      const errMsg = String(err?.message || '');
      if (errMsg.includes('match the expected pattern') || errMsg.includes('pattern')) {
        try {
          const fallbackInit = init ? { ...init } : undefined;
          if (fallbackInit && fallbackInit.headers) {
            delete fallbackInit.headers;
          }
          return await nativeFetch(input, fallbackInit);
        } catch (_) {}
      }
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
