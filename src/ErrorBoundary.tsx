import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Se for erro de insertBefore ou removeChild provocado por tradutor do navegador, recarrega suavemente
    const msg = error?.message || '';
    if (msg.includes('insertBefore') || msg.includes('removeChild') || msg.includes('Node')) {
      const lastReload = sessionStorage.getItem('last_auto_reload_err');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_auto_reload_err', String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900">Portal do Mece</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ocorreu uma pequena instabilidade momentânea na exibição desta tela.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Recarregar Aplicativo
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.href = '/';
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
