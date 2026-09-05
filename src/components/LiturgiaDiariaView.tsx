import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, AlertCircle, Heart, Church, ExternalLink } from 'lucide-react';
import { getLiturgicalThemeDynamic } from '../utils/calendario';

interface LiturgiaTab {
  id: string;
  titulo: string;
  referencia: string;
  paragrafos: string[];
}

interface LiturgiaData {
  liturgia: LiturgiaTab[];
  hasVigilia: boolean;
  isVigilia: boolean;
  data: string;
}

interface LiturgiaDiariaViewProps {
  voltar?: () => void;
}

export default function LiturgiaDiariaView({ voltar }: LiturgiaDiariaViewProps) {
  const [liturgia, setLiturgia] = useState<LiturgiaData | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiturgia = async (isVigilia = false) => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/liturgia-diaria${isVigilia ? '?vigilia=true' : ''}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao carregar a liturgia diária da Canção Nova.');
      const data: LiturgiaData = await res.json();
      setLiturgia(data);
      if (data.liturgia && data.liturgia.length > 0) {
        setActiveTabId(data.liturgia[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao carregar a liturgia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiturgia();
  }, []);

  const tabs = liturgia?.liturgia || [];
  const liturgyTheme = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return getLiturgicalThemeDynamic(today);
  }, []);

  const getThemeClass = (theme: string) => {
    switch(theme) {
      case 'purple': return 'bg-purple-600 hover:bg-purple-700 shadow-purple-100';
      case 'red': return 'bg-red-600 hover:bg-red-700 shadow-red-100';
      case 'rose': return 'bg-rose-500 hover:bg-rose-600 shadow-rose-100';
      case 'white': return 'bg-slate-200 hover:bg-slate-300 shadow-slate-100 text-slate-900';
      default: return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100';
    }
  };

  const themeBtnClass = getThemeClass(liturgyTheme);
  const isWhiteTheme = liturgyTheme === 'white';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Liturgia Diária
          </h2>
          <p className="text-slate-500 mt-1">
            Fonte: Canção Nova • {liturgia?.data || 'Hoje'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      ) : loading && tabs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Buscando leituras do dia...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Tabs Top */}
          <div className="w-full bg-slate-50 border-b border-slate-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex flex-col items-start px-6 py-4 min-w-[140px] text-left border-b-2 transition-colors ${
                    activeTabId === tab.id
                      ? 'border-blue-600 bg-white'
                      : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <span className={`font-semibold text-sm ${activeTabId === tab.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {tab.titulo}
                  </span>
                  {tab.referencia && (
                    <span className="text-xs text-slate-500 mt-0.5 truncate w-full">
                      {tab.referencia}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {tabs.map((tab) => {
              if (tab.id !== activeTabId) return null;
              return (
                <div key={tab.id} className="animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{tab.titulo}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6 pb-4 border-b border-slate-100">
                    {tab.referencia}
                  </p>
                  <div className="space-y-4 text-slate-800 leading-relaxed font-serif text-lg">
                    {tab.paragrafos.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <a
                        href="https://liturgia.cancaonova.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Church className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fonte Oficial</span>
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Canção Nova</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 ml-2" />
                      </a>

                      <button
                        onClick={voltar}
                        className={`w-full sm:w-auto px-12 py-4 ${themeBtnClass} ${isWhiteTheme ? 'text-slate-900' : 'text-white'} font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer`}
                      >
                        <Heart className={`w-4 h-4 ${isWhiteTheme ? 'fill-slate-900' : 'fill-white'}`} />
                        Amém
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
