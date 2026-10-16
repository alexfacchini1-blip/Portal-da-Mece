import apiFetch from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, AlertCircle, Heart, Church, ExternalLink, ChevronLeft, Plus, Minus } from 'lucide-react';
import { getLiturgicalThemeDynamic } from '../utils/calendario';

interface LiturgiaTab {
  id: string;
  titulo: string;
  referencia: string;
  paragrafos: string[];
}

interface LiturgiaData {
  liturgia: LiturgiaTab[];
  evangelho?: {
    referencia?: string;
    texto?: string;
    papasText?: string;
    vaticanUrl?: string;
  };
  hasVigilia?: boolean;
  isVigilia?: boolean;
  data?: string;
}

interface LiturgiaDiariaViewProps {
  voltar?: () => void;
  initialSource?: 'vatican' | 'cancaonova';
}

export default function LiturgiaDiariaView({ voltar, initialSource = 'vatican' }: LiturgiaDiariaViewProps) {
  const [sourceTab, setSourceTab] = useState<'vatican' | 'cancaonova'>(initialSource);

  // Data states
  const [vaticanData, setVaticanData] = useState<LiturgiaData | null>(null);
  const [cancaoData, setCancaoData] = useState<LiturgiaData | null>(null);

  // Sub-tabs for readings
  const [activeVaticanTabId, setActiveVaticanTabId] = useState<string>('');
  const [activeCancaoTabId, setActiveCancaoTabId] = useState<string>('');

  // UI states
  const [loadingVatican, setLoadingVatican] = useState(false);
  const [loadingCancao, setLoadingCancao] = useState(false);
  const [errorVatican, setErrorVatican] = useState<string | null>(null);
  const [errorCancao, setErrorCancao] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(1);

  // Check Saturday Vigil (sábado após 17h)
  const isSaturdayVigil = useMemo(() => {
    const now = new Date();
    return now.getDay() === 6 && now.getHours() >= 17;
  }, []);

  // Liturgical theme
  const liturgyTheme = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return getLiturgicalThemeDynamic(today);
  }, []);

  const getThemeClass = (theme: string) => {
    switch (theme) {
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 shadow-purple-200';
      case 'red':
        return 'bg-red-600 hover:bg-red-700 shadow-red-200';
      case 'rose':
        return 'bg-rose-500 hover:bg-rose-600 shadow-rose-200';
      case 'white':
        return 'bg-slate-800 hover:bg-slate-900 shadow-slate-200 text-white';
      default:
        return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
    }
  };

  const themeBtnClass = getThemeClass(liturgyTheme);

  // Fetch Vatican News data
  const fetchVatican = async () => {
    if (vaticanData) return;
    try {
      setLoadingVatican(true);
      setErrorVatican(null);
      const url = `/api/liturgia${isSaturdayVigil ? '?vigilia=true' : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Falha ao carregar a palavra do dia do Vatican News.');
      const data: LiturgiaData = await res.json();
      setVaticanData(data);
      if (data.liturgia && data.liturgia.length > 0) {
        // Prefer evangelho tab by default if available
        const evTab = data.liturgia.find(t => t.id.includes('evangelho') || t.titulo.toLowerCase().includes('evangelho'));
        setActiveVaticanTabId(evTab ? evTab.id : data.liturgia[0].id);
      }
    } catch (err: any) {
      setErrorVatican(err.message || 'Erro ao carregar Vatican News.');
    } finally {
      setLoadingVatican(false);
    }
  };

  // Fetch Canção Nova data
  const fetchCancao = async () => {
    if (cancaoData) return;
    try {
      setLoadingCancao(true);
      setErrorCancao(null);
      const url = `/api/liturgia-diaria${isSaturdayVigil ? '?vigilia=true' : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Falha ao carregar a liturgia diária da Canção Nova.');
      const data: LiturgiaData = await res.json();
      setCancaoData(data);
      if (data.liturgia && data.liturgia.length > 0) {
        setActiveCancaoTabId(data.liturgia[0].id);
      }
    } catch (err: any) {
      setErrorCancao(err.message || 'Erro ao carregar Canção Nova.');
    } finally {
      setLoadingCancao(false);
    }
  };

  useEffect(() => {
    fetchVatican();
    fetchCancao();
  }, [isSaturdayVigil]);

  const currentTabs = useMemo(() => {
    if (sourceTab === 'vatican') {
      return vaticanData?.liturgia || [];
    }
    return cancaoData?.liturgia || [];
  }, [sourceTab, vaticanData, cancaoData]);

  const currentActiveTabId = sourceTab === 'vatican' ? activeVaticanTabId : activeCancaoTabId;
  const setCurrentActiveTabId = sourceTab === 'vatican' ? setActiveVaticanTabId : setActiveCancaoTabId;
  const currentLoading = sourceTab === 'vatican' ? loadingVatican : loadingCancao;
  const currentError = sourceTab === 'vatican' ? errorVatican : errorCancao;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header com Navegação e Controles de Fonte */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-md shadow-blue-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Liturgia Diária
                </h2>
                {isSaturdayVigil && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    Vigília de Domingo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Vatican News & Canção Nova • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Controle de Zoom / Tamanho da Fonte */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/70 shadow-inner">
              <button
                type="button"
                onClick={() => setFontScale((prev) => Math.max(0.75, prev - 0.15))}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Diminuir texto"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-500 px-1 select-none font-mono">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setFontScale((prev) => Math.min(2.2, prev + 0.15))}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Aumentar texto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {voltar && (
              <button
                type="button"
                onClick={voltar}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-slate-200/60 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
        </div>

        {/* Abas Principais de Seleção de Fonte: Vatican News vs Canção Nova */}
        <div className="pt-4">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setSourceTab('vatican');
                fetchVatican();
              }}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceTab === 'vatican'
                  ? 'bg-white text-blue-700 shadow-md border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Church className="w-4 h-4 text-blue-600" />
              <span>Vatican News</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceTab('cancaonova');
                fetchCancao();
              }}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceTab === 'cancaonova'
                  ? 'bg-white text-amber-700 shadow-md border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Canção Nova</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo da Liturgia */}
      {currentError ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium">{currentError}</p>
        </div>
      ) : currentLoading && currentTabs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center space-y-3">
          <div className="animate-spin h-9 w-9 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">
            Carregando leituras do dia ({sourceTab === 'vatican' ? 'Vatican News' : 'Canção Nova'})...
          </p>
          <p className="text-xs text-slate-400">Preparando a Palavra de Deus para sua oração e ministério</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Sub-abas de Leituras (1ª Leitura, Salmo, 2ª Leitura, Evangelho, Papa) */}
          {currentTabs.length > 0 && (
            <div className="w-full bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
              <div className="flex min-w-full">
                {currentTabs.map((tab) => {
                  const isActive = currentActiveTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCurrentActiveTabId(tab.id)}
                      className={`flex flex-col items-start px-5 sm:px-6 py-3.5 min-w-[130px] sm:min-w-[150px] text-left border-b-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-blue-600 bg-white shadow-sm font-bold text-blue-700'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{tab.titulo}</span>
                      {tab.referencia && (
                        <span className="text-[10px] text-slate-400 font-normal truncate max-w-[180px] mt-0.5">
                          {tab.referencia}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Área de Leitura com Estilo Sacro e Escala de Fonte */}
          <div className="p-6 sm:p-10 bg-[#fdfcf9] overflow-y-auto">
            <div
              className="max-w-prose mx-auto"
              style={{ fontSize: `${fontScale}rem`, lineHeight: 1.7 }}
            >
              {currentTabs.map((tab) => {
                if (tab.id !== currentActiveTabId) return null;

                // Caso especial da reflexão do Papa no Vatican News
                if (tab.id === 'tab-papa' || tab.titulo.toLowerCase().includes('papa')) {
                  return (
                    <div key={tab.id} className="animate-in fade-in duration-200">
                      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                        <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 shadow-sm">
                          <Church className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg sm:text-xl">O Pensamento do Papa</h3>
                          <p className="text-xs text-slate-500 font-medium">Vatican News • Reflexão Pastoral do Santo Padre</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        {tab.paragrafos.map((p, idx) => {
                          const clean = p.trim();
                          if (!clean) return null;
                          return (
                            <p key={idx} className="font-serif text-slate-700 leading-[1.8] italic text-base sm:text-lg">
                              {clean}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={tab.id} className="animate-in fade-in duration-200 space-y-4">
                    <div className="mb-6 pb-3 border-b border-slate-200">
                      <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1">
                        {tab.titulo}
                      </h3>
                      {tab.referencia && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 font-sans">
                          {tab.referencia}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {tab.paragrafos.map((p, idx) => {
                        const clean = p.trim();
                        if (!clean) return null;
                        if (idx === 0) {
                          return (
                            <p
                              key={idx}
                              className="font-serif text-slate-800 leading-[1.8] first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-slate-700 first-letter:leading-none mb-6"
                            >
                              {clean}
                            </p>
                          );
                        }
                        return (
                          <p key={idx} className="font-serif text-slate-800 leading-[1.8]">
                            {clean}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Botão de Rodapé e Link da Fonte Oficial */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                {sourceTab === 'vatican' ? (
                  <a
                    href="https://www.vaticannews.va/pt/palavra-do-dia.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Church className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fonte Oficial</span>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Vatican News</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 ml-1" />
                  </a>
                ) : (
                  <a
                    href="https://liturgia.cancaonova.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-110">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fonte Oficial</span>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Canção Nova</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 ml-1" />
                  </a>
                )}

                {voltar && (
                  <button
                    type="button"
                    onClick={voltar}
                    className={`w-full sm:w-auto px-10 py-3.5 ${themeBtnClass} text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    Amém
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
