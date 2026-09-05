import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flag, 
  Users, 
  Calendar, 
  Clock, 
  Package, 
  RefreshCw, 
  MessageSquare, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  Plus, 
  X, 
  Filter,
  UserX,
  ExternalLink,
  ChevronRight,
  Info,
  MessageCircle,
  PhoneOff
} from 'lucide-react';

interface CoordenacaoLideresViewProps {
  user: any;
  isTab?: boolean;
  onAlert?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCustomConfirm?: (msg: string, onConfirm: () => void, title?: string) => void;
}

export const CoordenacaoLideresView: React.FC<CoordenacaoLideresViewProps> = ({
  user,
  isTab = false,
  onAlert,
  onCustomConfirm
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'relatorios' | 'habilitados' | 'novo'>('relatorios');
  const [ministers, setMinisters] = useState<any[]>([]);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'comFaltas' | 'comTrocas' | 'comEstoque'>('todos');

  // Modal / Form state for manual coordination report entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    horario: '19:00',
    liderNome: '',
    faltasReportadas: '',
    trocasNaoRegistradas: '',
    usoEstoque: '',
    observacoes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const [minRes, relRes] = await Promise.all([
        fetch(`/api/admin/ministros?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`),
        fetch(`/api/relatorios-lider?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`)
      ]);

      if (minRes.ok) {
        const ct = minRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const minData = await minRes.json();
          if (Array.isArray(minData)) {
            minData.sort((a, b) =>
              (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
            );
            setMinisters(minData);
          }
        }
      }

      if (relRes.ok) {
        const ct = relRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const relData = await relRes.json();
          if (Array.isArray(relData)) {
            relData.sort((a, b) => {
              const dateA = new Date(`${a.data}T${a.horario || '00:00'}`).getTime() || 0;
              const dateB = new Date(`${b.data}T${b.horario || '00:00'}`).getTime() || 0;
              return dateB - dateA;
            });
            setRelatorios(relData);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de líderes:', err);
      if (onAlert) onAlert('Falha ao carregar relatórios dos líderes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.paroquia]);

  // Extract all enabled leaders (titular and spouse)
  const lideresHabilitados = useMemo(() => {
    const list: {
      id: string | number;
      nome: string;
      telefone: string;
      isConjuge: boolean;
      tempoMinisterio?: string;
      paroquia?: string;
    }[] = [];

    ministers.forEach(m => {
      if (m.isLider) {
        list.push({
          id: `${m.id}_titular`,
          nome: m.nomeExibicao || m.nome,
          telefone: m.telefone || '',
          isConjuge: false,
          tempoMinisterio: m.tempoMinisterio,
          paroquia: m.paroquia
        });
      }
      if (m.isLiderConjuge && m.nomeConjuge) {
        list.push({
          id: `${m.id}_conjuge`,
          nome: m.nomeExibicaoConjuge || m.nomeConjuge,
          telefone: m.telefoneConjuge || m.telefone || '',
          isConjuge: true,
          tempoMinisterio: m.tempoMinisterioConjuge || m.tempoMinisterio,
          paroquia: m.paroquia
        });
      }
    });

    return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [ministers]);

  // Filtered reports
  const filteredRelatorios = useMemo(() => {
    return relatorios.filter(r => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchLider = (r.liderNome || '').toLowerCase().includes(term);
        const matchData = (r.data || '').toLowerCase().includes(term);
        const matchHorario = (r.horario || '').toLowerCase().includes(term);
        const matchEstoque = (r.usoEstoque || '').toLowerCase().includes(term);
        const matchTrocas = (r.trocasNaoRegistradas || '').toLowerCase().includes(term);
        const matchObs = (r.observacoes || '').toLowerCase().includes(term);
        const matchFaltas = Array.isArray(r.faltasReportadas) && r.faltasReportadas.some(
          (f: any) => (f.ministroNome || '').toLowerCase().includes(term) || (f.justificativa || '').toLowerCase().includes(term)
        );

        if (!matchLider && !matchData && !matchHorario && !matchEstoque && !matchTrocas && !matchObs && !matchFaltas) {
          return false;
        }
      }

      // Filter type
      const hasFaltas = Array.isArray(r.faltasReportadas) && r.faltasReportadas.length > 0;
      const hasTrocas = Boolean(r.trocasNaoRegistradas && r.trocasNaoRegistradas.trim().length > 0);
      const hasEstoque = Boolean(r.usoEstoque && r.usoEstoque.trim().length > 0);
      const hasObs = Boolean(r.observacoes && r.observacoes.trim().length > 0);

      if (filterType === 'comFaltas') {
        return hasFaltas;
      }
      if (filterType === 'comTrocas') {
        return hasTrocas;
      }
      if (filterType === 'comEstoque') {
        return hasEstoque;
      }

      return true;
    });
  }, [relatorios, searchTerm, filterType]);

  // Filtered enabled leaders
  const filteredLideres = useMemo(() => {
    if (!searchTerm) return lideresHabilitados;
    const term = searchTerm.toLowerCase();
    return lideresHabilitados.filter(l => 
      l.nome.toLowerCase().includes(term) || l.telefone.includes(term)
    );
  }, [lideresHabilitados, searchTerm]);

  // Delete report
  const handleDeleteRelatorio = (id: string, info: string) => {
    const doDelete = async () => {
      try {
        const res = await fetch(`/api/relatorios-lider/${id}?paroquia=${encodeURIComponent(user?.paroquia || '')}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          if (onAlert) onAlert('Relatório de missa excluído com sucesso.', 'success');
          setRelatorios(prev => prev.filter(r => r.id !== id));
        } else {
          const err = await res.json();
          if (onAlert) onAlert(err.error || 'Erro ao excluir relatório.', 'error');
        }
      } catch (err) {
        console.error(err);
        if (onAlert) onAlert('Erro ao conectar com o servidor.', 'error');
      }
    };

    if (onCustomConfirm) {
      onCustomConfirm(`Deseja realmente excluir o relatório da celebração (${info})?`, doDelete, 'Excluir Relatório');
    } else if (window.confirm(`Deseja realmente excluir o relatório da celebração (${info})?`)) {
      doDelete();
    }
  };

  // Manual coordination report creation
  const handleSaveManualRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data || !formData.horario || !formData.liderNome) {
      if (onAlert) onAlert('Preencha a data, o horário e o nome do responsável.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const faltasArr = formData.faltasReportadas
        ? formData.faltasReportadas.split('\n').filter(Boolean).map(line => ({
            ministroNome: line.trim(),
            justificativa: 'Falta registrada pela Coordenação'
          }))
        : [];

      const payload = {
        paroquia: user?.paroquia,
        data: formData.data,
        horario: formData.horario,
        liderNome: formData.liderNome,
        presencas: {},
        faltasReportadas: faltasArr,
        trocasNaoRegistradas: formData.trocasNaoRegistradas,
        usoEstoque: formData.usoEstoque,
        observacoes: formData.observacoes
      };

      const res = await fetch('/api/relatorios-lider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onAlert) onAlert('Relatório da missa registrado com sucesso!', 'success');
        setIsModalOpen(false);
        setFormData({
          data: new Date().toISOString().split('T')[0],
          horario: '19:00',
          liderNome: '',
          faltasReportadas: '',
          trocasNaoRegistradas: '',
          usoEstoque: '',
          observacoes: ''
        });
        fetchData();
      } else {
        const err = await res.json();
        if (onAlert) onAlert(err.error || 'Erro ao registrar relatório.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (onAlert) onAlert('Erro ao conectar com o servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Área Restrita - Coordenação
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-blue-600" />
            Responsáveis pela Missa
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Acompanhe em tempo real os relatórios enviados pelos responsáveis: faltas ocorridas, trocas de última hora, consumo de estoque e observações da celebração.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Lançar Relatório
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsáveis Habilitados</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{lideresHabilitados.length}</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Ministros aptos a responsável de missa</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Flag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relatórios Recebidos</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{relatorios.length}</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Celebrações informadas</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trocas de Última Hora</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {relatorios.filter(r => r.trocasNaoRegistradas && r.trocasNaoRegistradas.trim().length > 0).length}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Não aprovadas no sistema</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consumo de Estoque</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {relatorios.filter(r => r.usoEstoque && r.usoEstoque.trim().length > 0).length}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Missas com uso informado</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Blue Theme Compliant) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('relatorios')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'relatorios'
                ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Relatórios das Missas ({relatorios.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('habilitados')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'habilitados'
                ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 text-slate-500" /> Responsáveis Habilitados ({lideresHabilitados.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={activeSubTab === 'relatorios' ? 'Filtrar relatórios por responsável, data...' : 'Buscar responsável por nome...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: RELATÓRIOS DAS MISSAS */}
      {activeSubTab === 'relatorios' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtros:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filterType === 'todos'
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Todos ({relatorios.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('comFaltas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filterType === 'comFaltas'
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Apenas com Faltas
            </button>
            <button
              type="button"
              onClick={() => setFilterType('comTrocas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filterType === 'comTrocas'
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Trocas não Aprovadas
            </button>
            <button
              type="button"
              onClick={() => setFilterType('comEstoque')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filterType === 'comEstoque'
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Uso de Estoque
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-600">Carregando relatórios dos responsáveis...</p>
            </div>
          ) : filteredRelatorios.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Flag className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-base font-black text-slate-800">Nenhum relatório encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchTerm || filterType !== 'todos'
                  ? 'Nenhum relatório corresponde aos filtros selecionados. Tente ajustar os termos de busca.'
                  : 'Os responsáveis pela missa preenchem o relatório diretamente pelo app na data da celebração. Quando enviarem, os relatórios aparecerão automaticamente aqui!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRelatorios.map((rel) => {
                const dateParts = rel.data ? rel.data.split('-').reverse().join('/') : '';
                const hasFaltas = Array.isArray(rel.faltasReportadas) && rel.faltasReportadas.length > 0;
                const hasTrocas = Boolean(rel.trocasNaoRegistradas && rel.trocasNaoRegistradas.trim().length > 0);
                const hasEstoque = Boolean(rel.usoEstoque && rel.usoEstoque.trim().length > 0);
                const hasObs = Boolean(rel.observacoes && rel.observacoes.trim().length > 0);
                const isClean = !hasFaltas && !hasTrocas && !hasEstoque && !hasObs;

                return (
                  <div
                    key={rel.id || `${rel.data}_${rel.horario}`}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Stripe for quick visual diagnosis */}
                    <div 
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        hasFaltas ? 'bg-red-500' : hasTrocas ? 'bg-amber-500' : hasEstoque ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                    />

                    <div>
                      {/* Header of Report */}
                      <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {dateParts}
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rel.horario}h
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mt-2 flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-amber-500" /> Responsável: <span className="text-blue-900">{rel.liderNome}</span>
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteRelatorio(rel.id, `${dateParts} - ${rel.horario}h`)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Excluir Relatório"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content Sections */}
                      <div className="space-y-3 mt-4">
                        {/* 1. FALTAS */}
                        {hasFaltas ? (
                          <div className="bg-red-50 border border-red-200/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1.5 text-red-800">
                              <UserX className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                Faltas na Missa ({rel.faltasReportadas.length})
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {rel.faltasReportadas.map((f: any, idx: number) => {
                                const isCasal = f.quantidade === 2 || f.tipoFalta === 'ambos' || (f.ministroNome && (f.ministroNome.includes(' e ') || f.ministroNome.includes(' & ') || f.ministroNome.includes(' / ')));
                                return (
                                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-red-200/60 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-red-950">{f.ministroNome}</span>
                                      {isCasal ? (
                                        <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md shrink-0">
                                          👥 Casal (2 faltas)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                                          1 falta
                                        </span>
                                      )}
                                    </div>
                                    {f.justificativa && (
                                      <div className="text-[11px] text-red-700 mt-0.5 italic">
                                        "{f.justificativa}"
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-50/70 border border-emerald-200/50 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium">Nenhuma falta reportada (Equipe completa presente).</span>
                          </div>
                        )}

                        {/* 2. TROCAS NÃO REGISTRADAS */}
                        {hasTrocas && (
                          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1 text-amber-900">
                              <RefreshCw className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                Troca de Última Hora / Não Registrada
                              </span>
                            </div>
                            <p className="text-xs text-amber-950 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-200/60">
                              {rel.trocasNaoRegistradas}
                            </p>
                          </div>
                        )}

                        {/* 3. USO DE ESTOQUE */}
                        {hasEstoque && (
                          <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1 text-indigo-900">
                              <Package className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                Uso do Estoque
                              </span>
                            </div>
                            <p className="text-xs text-indigo-950 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-indigo-200/60">
                              {rel.usoEstoque}
                            </p>
                          </div>
                        )}

                        {/* 4. OBSERVAÇÕES / OCORRÊNCIAS */}
                        {hasObs && (
                          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1 text-blue-900">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                Observações
                              </span>
                            </div>
                            <p className="text-xs text-blue-950 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-blue-200/60">
                              {rel.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Date/Time */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Registrado por: <strong>{rel.liderNome}</strong></span>
                      {rel.updatedAt && (
                        <span>Enviado às {new Date(rel.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: QUADRO DE LÍDERES HABILITADOS */}
      {activeSubTab === 'habilitados' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong className="font-bold">Critério de Escalação e Responsabilidade:</strong> Todos os ministros listados abaixo estão marcados no cadastro com a atribuição de Responsável pela Missa (🚩). O algoritmo de geração de escala utiliza o histórico de atuações para fazer o rodízio equilibrado entre eles mês a mês.
            </div>
          </div>

          {filteredLideres.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Flag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">Nenhum responsável encontrado</h4>
              <p className="text-xs text-slate-500 mt-1">
                Acesse a aba <strong>Ministros</strong> para marcar ministros como aptos a responsáveis de missa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLideres.map((lider) => (
                <div
                  key={lider.id}
                  className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex items-center gap-3.5"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-200 shrink-0">
                    {lider.nome.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
                    {lider.nome}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MANUAL REPORT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Lançar Relatório de Missa</h3>
                  <p className="text-xs text-slate-500">Lançamento direto pela coordenação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRelatorio} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data da Missa</label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horário</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 19:00"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsável pela Celebração</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do responsável ou da coordenação..."
                  value={formData.liderNome}
                  onChange={(e) => setFormData({ ...formData, liderNome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faltas Ocorridas (1 por linha, opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Carlos Eduardo&#10;Mariana Silva"
                  value={formData.faltasReportadas}
                  onChange={(e) => setFormData({ ...formData, faltasReportadas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trocas de Última Hora / Não Aprovadas no Sistema</label>
                <input
                  type="text"
                  placeholder="Ex: Pedro serviu no lugar de Carlos..."
                  value={formData.trocasNaoRegistradas}
                  onChange={(e) => setFormData({ ...formData, trocasNaoRegistradas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Uso do Estoque</label>
                <input
                  type="text"
                  placeholder="Ex: Aberto 1 pacote de hóstias e 1 vinho..."
                  value={formData.usoEstoque}
                  onChange={(e) => setFormData({ ...formData, usoEstoque: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Gerais</label>
                <textarea
                  rows={2}
                  placeholder="Algum imprevisto ou aviso litúrgico..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {submitting ? 'Salvando...' : 'Salvar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordenacaoLideresView;
