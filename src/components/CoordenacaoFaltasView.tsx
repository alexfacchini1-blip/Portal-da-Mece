import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  UserX,
  Plus,
  Search,
  Trash2,
  Trophy,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ChevronLeft,
  Calendar,
  FileText,
  Flag,
  Package,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { toTitleCase } from '../utils';

interface CoordenacaoFaltasViewProps {
  user: any;
  voltar?: () => void;
  isTab?: boolean;
  onCustomConfirm?: (message: string, onConfirm: () => void) => void;
  onAlert?: (titulo: string, mensagem: string) => void;
}

export function CoordenacaoFaltasView({
  user,
  voltar,
  isTab = false,
  onCustomConfirm,
  onAlert
}: CoordenacaoFaltasViewProps) {
  const isCoordenacao =
    user?.role === 'admin' ||
    user?.role === 'coordenacao' ||
    user?.role === 'coordenador' ||
    user?.role === 'vice_coordenacao' ||
    user?.isCoordenador ||
    (user?.role && user.role.toLowerCase().includes('coordena'));

  if (!isCoordenacao) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200 my-6">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-700">Acesso Restrito</h3>
        <p className="text-sm text-red-600 mt-1">
          Esta tela é exclusiva para a Coordenação da Paróquia.
        </p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'ranking_trocas' | 'lancar' | 'historico'>('ranking');
  const [ministers, setMinisters] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<any[]>([]);
  const [trocas, setTrocas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [selectedMinisterId, setSelectedMinisterId] = useState<string>('');
  const [tipoFaltaCasal, setTipoFaltaCasal] = useState<'principal' | 'conjuge' | 'ambos'>('ambos');
  const [dataFalta, setDataFalta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horarioFalta, setHorarioFalta] = useState<string>('08:00');
  const [justificativa, setJustificativa] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos'); // 'todos' or YYYY-MM
  const [selectedRankingMonth, setSelectedRankingMonth] = useState<string>(''); // YYYY-MM or ''
  const [selectedRankingYear, setSelectedRankingYear] = useState<string>(''); // YYYY or ''
  const [rankingFilter, setRankingFilter] = useState<'mes_atual' | 'geral'>('mes_atual');

  // Helper to determine absence weight (couples count as 2 when both miss, 1 when individual)
  const getFaltaWeight = (f: any): number => {
    if (!f) return 0;
    if (typeof f.quantidade === 'number' && f.quantidade > 0) {
      return f.quantidade;
    }
    if (f.tipoFalta === 'ambos') return 2;
    if (f.tipoFalta === 'principal' || f.tipoFalta === 'conjuge' || f.tipoFalta === 'individual') return 1;

    const name = String(f.ministroNome || '');
    const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (norm.includes(' e ') || norm.includes(' & ') || norm.includes(' / ')) {
      return 2;
    }
    return 1;
  };

  // Fetch ministers, faltas and relatorios-lider
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const now = Date.now();
      const [minRes, faltasRes, trocasRes] = await Promise.all([
        fetch(`/api/admin/ministros?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`),
        fetch(`/api/faltas?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`),
        fetch(`/api/trocas?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`)
      ]);

      if (minRes.ok) {
        const minData = await minRes.json();
        if (Array.isArray(minData)) {
          minData.sort((a, b) =>
            (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
          );
          setMinisters(minData);
        }
      }

      if (faltasRes.ok) {
        const faltasData = await faltasRes.json();
        if (Array.isArray(faltasData)) {
          setFaltas(faltasData);
        }
      }

      if (trocasRes.ok) {
        const trocasData = await trocasRes.json();
        if (Array.isArray(trocasData)) {
          setTrocas(trocasData);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de faltas:', err);
      setError('Falha ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.paroquia) {
      fetchData();
    }
  }, [user?.paroquia]);

  // Handle register new falta
  const handleSubmitFalta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinisterId) {
      setError('Por favor, selecione o ministro que faltou.');
      return;
    }
    if (!dataFalta || !horarioFalta) {
      setError('Por favor, informe a data e o horário da missa.');
      return;
    }

    const minister = ministers.find(m => String(m.id) === String(selectedMinisterId));
    if (!minister) {
      setError('Ministro selecionado não encontrado.');
      return;
    }

    const principalName = minister.nomeExibicao || minister.nome;
    const conjugeName = minister.nomeExibicaoConjuge || minister.nomeConjuge;
    let ministerName = principalName;
    let quantidadeFaltas = 1;
    let tipoFaltaFinal = 'individual';

    if (conjugeName) {
      if (tipoFaltaCasal === 'conjuge') {
        ministerName = conjugeName;
        quantidadeFaltas = 1;
        tipoFaltaFinal = 'conjuge';
      } else if (tipoFaltaCasal === 'ambos') {
        ministerName = `${principalName} e ${conjugeName}`;
        quantidadeFaltas = 2;
        tipoFaltaFinal = 'ambos';
      } else {
        ministerName = principalName;
        quantidadeFaltas = 1;
        tipoFaltaFinal = 'principal';
      }
    }

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/faltas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paroquia: user.paroquia,
          data: dataFalta,
          horario: horarioFalta,
          ministroId: selectedMinisterId,
          ministroNome: ministerName,
          quantidade: quantidadeFaltas,
          tipoFalta: tipoFaltaFinal,
          justificativa,
          registradoPor: user.nome || user.nomeExibicao || 'Coordenação'
        })
      });

      if (res.ok) {
        setMessage(`Falta registrada com sucesso para ${ministerName}! (${quantidadeFaltas} ${quantidadeFaltas === 1 ? 'falta contabilizada' : 'faltas contabilizadas'})`);
        setSelectedMinisterId('');
        setJustificativa('');
        setTipoFaltaCasal('ambos');
        fetchData();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao registrar falta.');
      }
    } catch (err) {
      console.error('Erro ao registrar falta:', err);
      setError('Erro de rede ao registrar falta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete falta
  const handleDeleteFalta = (faltaId: string, ministroNome: string, dataStr: string) => {
    const confirmMessage = `Tem certeza que deseja remover o registro de falta de ${ministroNome} no dia ${dataStr}?`;
    
    const executeDelete = async () => {
      try {
        const res = await fetch(`/api/faltas/${faltaId}`, { method: 'DELETE' });
        if (res.ok) {
          setMessage('Registro de falta removido com sucesso!');
          fetchData();
          setTimeout(() => setMessage(''), 3000);
        } else {
          setError('Erro ao remover falta.');
        }
      } catch (err) {
        console.error('Erro ao excluir falta:', err);
        setError('Erro ao remover falta.');
      }
    };

    if (onCustomConfirm) {
      onCustomConfirm(confirmMessage, executeDelete);
    } else if (window.confirm(confirmMessage)) {
      executeDelete();
    }
  };

  // Compute filtered faltas for ranking and history
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentYearStr = new Date().getFullYear().toString();

  const filteredFaltas = useMemo(() => {
    return faltas.filter(f => {
      if (!f) return false;
      if (selectedMonth !== 'todos' && (!f.data || !String(f.data).startsWith(selectedMonth))) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const mName = (f.ministroNome || '').toLowerCase();
        const just = (f.justificativa || '').toLowerCase();
        const dt = (f.data || '').toLowerCase();
        if (!mName.includes(term) && !just.includes(term) && !dt.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [faltas, selectedMonth, searchTerm]);

  // Ranking calculation
  const ranking = useMemo(() => {
    let relevantFaltas = faltas;

    if (rankingFilter === 'mes_atual') {
      relevantFaltas = faltas.filter(f => f.data && f.data.startsWith(currentMonthStr));
    } else if (rankingFilter === 'geral') {
      if (selectedRankingMonth) {
        relevantFaltas = faltas.filter(f => f.data && f.data.startsWith(selectedRankingMonth));
      } else if (selectedRankingYear) {
        relevantFaltas = faltas.filter(f => f.data && f.data.startsWith(selectedRankingYear));
      }
    }
    
    // Filtro de itens restritos: não devem aparecer no ranking (ex: "Justificativa")
    // Assumindo que faltas tem um campo 'restrito' ou similar, ou inferido pela justificativa
    relevantFaltas = relevantFaltas.filter(f => !f.restrito);

    // Group by minister or couple
    const map: { [mId: string]: { id: string; nome: string; isCasal: boolean; total: number; faltas: any[] } } = {};

    relevantFaltas.forEach(f => {
      if (!f) return;
      const weight = getFaltaWeight(f);

      // Find matching minister profile if any
      let canonicalName = f.ministroNome || 'Desconhecido';
      let key = String(f.ministroId || f.ministroNome || '');
      let isCasal = false;

      const mFound = ministers.find(m => {
        if (f.ministroId && String(m.id) === String(f.ministroId)) return true;
        const normNome = (m.nome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normExib = (m.nomeExibicao || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normConj = (m.nomeConjuge || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normExibConj = (m.nomeExibicaoConjuge || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normFNome = (f.ministroNome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        if (normFNome === normNome || normFNome === normExib) return true;
        if (normConj && (normFNome === normConj || normFNome === normExibConj)) return true;
        if (normConj && normFNome === `${normExib || normNome} e ${normExibConj || normConj}`) return true;
        return false;
      });

      if (mFound) {
        key = String(mFound.id);
        const pName = mFound.nomeExibicao || mFound.nome;
        const cName = mFound.nomeExibicaoConjuge || mFound.nomeConjuge;
        if (cName) {
          canonicalName = `${pName} e ${cName}`;
          isCasal = true;
        } else {
          canonicalName = pName;
        }
      } else {
        const normFNome = (f.ministroNome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (normFNome.includes(' e ') || normFNome.includes(' & ') || normFNome.includes(' / ')) {
          isCasal = true;
        }
      }

      if (!map[key]) {
        map[key] = {
          id: key,
          nome: canonicalName,
          isCasal,
          total: 0,
          faltas: []
        };
      }

      map[key].total += weight;
      map[key].faltas.push({ ...f, calculatedWeight: weight });
    });

    const list = Object.values(map).filter(item => item.nome && !item.nome.toLowerCase().includes('coordena'));
    list.sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    return list;
  }, [faltas, ministers, rankingFilter, currentMonthStr, currentYearStr, selectedRankingMonth, selectedRankingYear]);

  // Helper para identificar apenas o ministro solicitante (quem pediu ou precisou da troca)
  // Desconsidera a Coordenação e extrai o ministro real substituído em trocas rápidas
  const extractSolicitante = useCallback((t: any): { id?: string | number; name: string } | null => {
    const rawSolicitante = (t.solicitanteNome || '').trim();

    // 1. Se o solicitante for um ministro normal (não é coordenação)
    if (rawSolicitante && !rawSolicitante.toLowerCase().includes('coordena')) {
      return { id: t.solicitanteId, name: rawSolicitante };
    }

    // 2. Se a troca foi registrada pela Coordenação, verificar se foi substituição rápida de um ministro
    const text = `${t.missaDestinoMissa || ''} ${t.motivo || ''} ${t.observacao || ''}`;
    const match = text.match(/Substituição:\s*([^por\n\r]+?)\s+por\s+/i);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted && extracted !== 'undefined' && !extracted.toLowerCase().includes('coordena')) {
        return { name: extracted };
      }
    }

    // Nunca pontuar a Coordenação
    return null;
  }, []);

  // Ranking trocas calculation (apenas ministros que solicitaram troca, excluindo coordenação e quem aceitou)
  const rankingTrocas = useMemo(() => {
    // Apenas trocas aprovadas/realizadas
    let relevantTrocas = trocas.filter(t => t.status === 'aprovado');
    if (rankingFilter === 'mes_atual') {
      relevantTrocas = relevantTrocas.filter(t => (t.missaOrigemData || t.dataSolicitacao || t.data || t.createdAt || '').startsWith(currentMonthStr));
    } else if (rankingFilter === 'geral') {
      if (selectedRankingMonth) {
        relevantTrocas = relevantTrocas.filter(t => (t.missaOrigemData || t.dataSolicitacao || t.data || t.createdAt || '').startsWith(selectedRankingMonth));
      } else if (selectedRankingYear) {
        relevantTrocas = relevantTrocas.filter(t => (t.missaOrigemData || t.dataSolicitacao || t.data || t.createdAt || '').startsWith(selectedRankingYear));
      }
    }

    const map: { [key: string]: { id: string; nome: string; isCasal: boolean; total: number; trocas: any[] } } = {};

    relevantTrocas.forEach(t => {
      if (!t) return;
      const sol = extractSolicitante(t);
      if (!sol || !sol.name) return;

      // Buscar perfil canônico do ministro para evitar duplicidades
      let canonicalName = sol.name;
      let key = String(sol.id || sol.name);
      let isCasal = false;

      const mFound = ministers.find(m => {
        if (sol.id && String(m.id) === String(sol.id)) return true;
        const normNome = (m.nome || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normExib = (m.nomeExibicao || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normConj = (m.nomeConjuge || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normExibConj = (m.nomeExibicaoConjuge || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normSol = (sol.name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        if (normSol === normNome || normSol === normExib) return true;
        if (normConj && (normSol === normConj || normSol === normExibConj)) return true;
        if (normConj && normSol === `${normExib || normNome} e ${normExibConj || normConj}`) return true;
        return false;
      });

      if (mFound) {
        key = String(mFound.id);
        const pName = mFound.nomeExibicao || mFound.nome;
        const cName = mFound.nomeExibicaoConjuge || mFound.nomeConjuge;
        if (cName) {
          canonicalName = `${pName} e ${cName}`;
          isCasal = true;
        } else {
          canonicalName = pName;
        }
      } else {
        const normSol = (sol.name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (normSol.includes(' e ') || normSol.includes(' & ') || normSol.includes(' / ')) {
          isCasal = true;
        }
      }

      if (!map[key]) {
        map[key] = {
          id: key,
          nome: canonicalName,
          isCasal,
          total: 0,
          trocas: []
        };
      }

      map[key].total += 1;
      map[key].trocas.push(t);
    });

    const list = Object.values(map).filter(item => item.nome && !item.nome.toLowerCase().includes('coordena'));
    list.sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
    return list;
  }, [trocas, rankingFilter, currentMonthStr, selectedRankingMonth, selectedRankingYear, ministers, extractSolicitante]);

  // Unique months available in faltas history for filtering
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    faltas.forEach(f => {
      if (f?.data && f.data.length >= 7) {
        monthsSet.add(String(f.data).substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [faltas]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Área Restrita - Coordenação
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Gestão e Ranking de Faltas
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Registre as ausências dos ministros nas missas e acompanhe o ranking de faltas para controle de presença da paróquia.
            </p>
          </div>

          {voltar && !isTab && (
            <button
              onClick={voltar}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-2xl transition flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Informação confidencial:</strong> Estas informações não são exibidas aos ministros e servem apenas para a gestão interna da coordenação.
          </span>
        </div>
      </div>

      {/* Message / Alert banner */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Main Navigation Tabs inside View */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('ranking')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'ranking'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          Ranking de Faltas
        </button>

        <button
          onClick={() => setActiveSubTab('ranking_trocas')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'ranking_trocas'
              ? 'bg-white text-blue-700 shadow-md border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          Ranking de Trocas
        </button>

        <button
          onClick={() => setActiveSubTab('lancar')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'lancar'
              ? 'bg-white text-blue-700 shadow-md border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Plus className="w-4 h-4 text-blue-600" />
          Lançar Nova Falta
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Carregando registros de faltas...</p>
        </div>
      ) : (
        <>
          {/* SUBTAB 1: RANKING DE FALTAS */}
          {activeSubTab === 'ranking' && (
            <div className="space-y-6">
              {/* Ranking Filter Header */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Classificação dos Ministros por Quantidade de Faltas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ministros ordenados a partir do maior número de ausências acumuladas.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
                  <span className="text-slate-500 px-2 font-bold flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filtrar por:
                  </span>
                  <button
                    onClick={() => setRankingFilter('mes_atual')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      rankingFilter === 'mes_atual'
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Mês Atual
                  </button>
                  <button
                    onClick={() => setRankingFilter('geral')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      rankingFilter === 'geral'
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Classificação Geral
                  </button>
                  {rankingFilter === 'geral' && (
                    <div className="flex gap-1 ml-2">
                       <input type="month" className="px-2 py-1 rounded-lg border text-xs" onChange={(e) => setSelectedRankingMonth(e.target.value)} />
                       <input type="number" placeholder="Ano" className="w-16 px-2 py-1 rounded-lg border text-xs" onChange={(e) => setSelectedRankingYear(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {ranking.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Nenhuma falta registrada</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Excelente! Não há registros de ausências para o período selecionado ({rankingFilter === 'mes_atual' ? 'mês atual' : rankingFilter === 'geral' ? 'geral' : 'ano atual'}).
                  </p>
                  <button
                    onClick={() => setActiveSubTab('lancar')}
                    className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-sm transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Lançar Nova Falta
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-600 uppercase tracking-wider">
                          <th className="py-4 px-6 text-center w-20">Classificação</th>
                          <th className="py-4 px-6">Ministro / Casal</th>
                          <th className="py-4 px-6 text-center">Total de Faltas</th>
                          <th className="py-4 px-6">Histórico de Ausências</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium">
                        {ranking.map((item, idx) => {
                          const pos = idx + 1;
                          const isTop1 = pos === 1;
                          const isTop2 = pos === 2;
                          const isTop3 = pos === 3;

                          let posBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                          if (isTop1) posBadgeClass = "bg-red-100 text-red-800 border-red-300 font-black shadow-sm";
                          else if (isTop2) posBadgeClass = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                          else if (isTop3) posBadgeClass = "bg-orange-50 text-orange-800 border-orange-200 font-bold";

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border text-xs ${posBadgeClass}`}>
                                  {pos}º
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span>{item.nome}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-black">
                                  {(item.total ?? 0)} {Number(item.total ?? 0) === 1 ? 'falta' : 'faltas'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                  {item.faltas.map((f: any, fIdx: number) => {
                                    const formattedDate = f?.data
                                      ? String(f.data).split('-').reverse().join('/')
                                      : 'Data inválida';
                                    const isCoupleAbsence = f?.calculatedWeight === 2;
                                    return (
                                      <div key={fIdx} className="text-xs flex items-center justify-between gap-2 text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                          <span className="font-semibold text-slate-800">{formattedDate} às {f?.horario || 'N/A'}</span>
                                          {isCoupleAbsence ? (
                                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md">
                                              👥 Casal (2 faltas)
                                            </span>
                                          ) : item.isCasal ? (
                                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-md">
                                              👤 {f?.ministroNome || 'Individual'} (1 falta)
                                            </span>
                                          ) : null}
                                          {f?.justificativa && (
                                            <span className="text-slate-500 italic truncate max-w-[150px]" title={f.justificativa}>
                                              - "{f.justificativa}"
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFalta(f?.id, f?.ministroNome || item.nome, formattedDate)}
                                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                                          title="Remover falta"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: RANKING DE TROCAS */}
          {activeSubTab === 'ranking_trocas' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    Classificação dos Ministros por Trocas Realizadas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Classificação dos ministros que solicitaram trocas ou substituições nas celebrações (exclusivo para a Coordenação).
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
                  <span className="text-slate-500 px-2 font-bold flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filtrar por:
                  </span>
                  <button
                    onClick={() => setRankingFilter('mes_atual')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      rankingFilter === 'mes_atual'
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Mês Atual
                  </button>
                  <button
                    onClick={() => setRankingFilter('geral')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      rankingFilter === 'geral'
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Geral
                  </button>
                </div>
              </div>

              {rankingTrocas.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">Nenhuma troca registrada</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Não há registros de trocas solicitadas para o período selecionado.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-600 uppercase tracking-wider">
                          <th className="py-4 px-6 text-center w-20">Classificação</th>
                          <th className="py-4 px-6">Ministro / Casal</th>
                          <th className="py-4 px-6 text-center">Total de Trocas Solicitadas</th>
                          <th className="py-4 px-6">Histórico de Trocas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium">
                        {rankingTrocas.map((item, idx) => {
                          const pos = idx + 1;
                          const isTop1 = pos === 1;
                          const isTop2 = pos === 2;
                          const isTop3 = pos === 3;

                          let posBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                          if (isTop1) posBadgeClass = "bg-blue-100 text-blue-800 border-blue-300 font-black shadow-sm";
                          else if (isTop2) posBadgeClass = "bg-indigo-100 text-indigo-800 border-indigo-300 font-bold";
                          else if (isTop3) posBadgeClass = "bg-sky-50 text-sky-800 border-sky-200 font-bold";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border text-xs ${posBadgeClass}`}>
                                  {pos}º
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span>{item.nome}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black">
                                  {item.total} {item.total === 1 ? 'troca' : 'trocas'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                  {item.trocas.map((t: any, tIdx: number) => {
                                    const rawDate = t.missaOrigemData || t.dataSolicitacao || t.data || t.createdAt || '';
                                    const tDate = rawDate ? String(rawDate).substring(0, 10).split('-').reverse().join('/') : '';
                                    const destStr = typeof t.destinatarioNome === 'string' ? t.destinatarioNome : '';
                                    const subName = destStr && !destStr.toLowerCase().includes('coordena')
                                      ? `Substituto: ${destStr}`
                                      : (t.tipo || 'Troca rápida');
                                    return (
                                      <div key={tIdx} className="text-xs flex items-center justify-between gap-2 text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                          <span className="font-semibold text-slate-800">{tDate}</span>
                                          <span className="text-[10px] font-medium bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-md">
                                            {subName}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: LANÇAR NOVA FALTA */}
          {activeSubTab === 'lancar' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserX className="w-6 h-6 text-red-500" />
                  Registrar Falta de Ministro
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Selecione o ministro que faltou na missa para incluir na contagem oficial da coordenação.
                </p>
              </div>

              <form onSubmit={handleSubmitFalta} className="space-y-5">
                {/* Select Minister */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Ministro <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMinisterId}
                    onChange={e => {
                      setSelectedMinisterId(e.target.value);
                      setTipoFaltaCasal('ambos');
                    }}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">-- Selecione o ministro --</option>
                    {ministers.map(m => {
                      const coupleSuffix = m.nomeConjuge || m.nomeExibicaoConjuge ? ` (Casal: ${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge})` : '';
                      return (
                        <option key={m.id} value={m.id}>
                          {(m.nomeExibicao || m.nome)}{coupleSuffix}
                        </option>
                      );
                    })}
                  </select>

                  {selectedMinisterId && (() => {
                    const m = ministers.find(item => String(item.id) === String(selectedMinisterId));
                    const cName = m?.nomeExibicaoConjuge || m?.nomeConjuge;
                    const pName = m?.nomeExibicao || m?.nome;
                    if (!cName) return null;
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 mt-3 animate-fade-in">
                        <p className="text-xs font-bold text-amber-900">
                          Este cadastro é um casal ({pName} e {cName}). Quem faltou?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setTipoFaltaCasal('ambos')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                              tipoFaltaCasal === 'ambos'
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                            }`}
                          >
                            👥 O Casal (Ambos - 2 faltas)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTipoFaltaCasal('principal')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                              tipoFaltaCasal === 'principal'
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                            }`}
                          >
                            👤 Apenas {pName} (1 falta)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTipoFaltaCasal('conjuge')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                              tipoFaltaCasal === 'conjuge'
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                            }`}
                          >
                            👤 Apenas {cName} (1 falta)
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium pt-1">
                          {tipoFaltaCasal === 'ambos'
                            ? '✅ Serão contabilizadas 2 faltas no ranking (ambos os ministros faltaram).'
                            : `✅ Será contabilizada 1 falta no ranking (apenas ${tipoFaltaCasal === 'principal' ? pName : cName} faltou).`}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Data da Missa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={dataFalta}
                        onChange={e => setDataFalta(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* Horario */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Horário da Missa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={horarioFalta}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 4) val = val.substring(0, 4);
                          if (val.length >= 3) {
                            val = val.substring(0, 2) + ':' + val.substring(2);
                          }
                          setHorarioFalta(val);
                        }}
                        maxLength={5}
                        placeholder="Ex: 07:30, 19:00"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Justificativa / Observacao */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Justificativa / Motivo <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    value={justificativa}
                    onChange={e => setJustificativa(e.target.value)}
                    rows={3}
                    placeholder="Ex: Não avisou com antecedência / Problema de saúde / Viagem..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registrando falta...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Confirmar Registro de Falta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBTAB 3: HISTÓRICO DE REGISTROS */}
          {activeSubTab === 'historico' && (
            <div className="space-y-6">
              {/* Search & Month Filter */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar ministro ou motivo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos os Meses</option>
                    {availableMonths.map(m => {
                      if (!m || typeof m !== 'string' || !m.includes('-')) return null;
                      const [yr, mo] = m.split('-');
                      const yNum = Number(yr);
                      const mNum = Number(mo);
                      if (isNaN(yNum) || isNaN(mNum) || mNum < 1 || mNum > 12) return null;
                      const dateObj = new Date(yNum, mNum - 1, 1);
                      if (isNaN(dateObj.getTime())) return null;
                      const monthName = dateObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                      return (
                        <option key={m} value={m}>
                          {toTitleCase(monthName)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {filteredFaltas.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 shadow-sm">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">Nenhum registro encontrado</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Não foram encontradas faltas registradas com os filtros selecionados.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-black text-xs border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Data e Horário</th>
                          <th className="px-6 py-4">Ministro</th>
                          <th className="px-6 py-4">Justificativa</th>
                          <th className="px-6 py-4">Registrado por</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredFaltas.map(f => {
                          const formattedDate = f?.data
                            ? String(f.data).split('-').reverse().join('/')
                            : 'Data inválida';
                          return (
                            <tr key={f.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  {formattedDate}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {f?.horario || 'N/A'}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                                {f.ministroNome}
                              </td>

                              <td className="px-6 py-4">
                                {f.justificativa ? (
                                  <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-xl text-xs font-medium inline-block">
                                    {f.justificativa}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Sem justificativa</span>
                                )}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                {f.registradoPor || 'Coordenação'}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleDeleteFalta(f.id, f.ministroNome, formattedDate)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                  title="Remover este registro de falta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
