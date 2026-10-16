import apiFetch from '../utils/api';
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
  PhoneOff,
  Check,
  Square,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Eye,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  isMinisterLiderForUser, 
  doesMinisterMatchLeader, 
  isCoupleSlot, 
  splitCoupleNames,
  isWithinActiveWindow,
  ITENS_ESTOQUE_RELATORIO,
  parseUsoEstoque,
  formatUsoEstoque,
  toTitleCase,
  hasCoordAccess
} from '../utils';

interface CoordenacaoLideresViewProps {
  user: any;
  isTab?: boolean;
  onAlert?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCustomConfirm?: (msg: string, onConfirm: () => void, title?: string) => void;
  onBack?: () => void;
}

export const CoordenacaoLideresView: React.FC<CoordenacaoLideresViewProps> = ({
  user,
  isTab = false,
  onAlert,
  onCustomConfirm,
  onBack
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'relatorios' | 'habilitados' | 'novo'>('relatorios');
  const [ministers, setMinisters] = useState<any[]>([]);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  type FilterType = 'todos' | 'pendentes' | 'enviados' | 'naoLidos' | 'comFaltas' | 'comTrocas' | 'comEstoque' | 'semAlteracao';

  const [celebracoesEscala, setCelebracoesEscala] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');

  const currentSystemYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentSystemYearMonth);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentSystemYearMonth);
    relatorios.forEach(r => {
      if (r.data && /^\d{4}-\d{2}-\d{2}$/.test(r.data)) {
        monthsSet.add(r.data.substring(0, 7));
      }
    });
    celebracoesEscala.forEach(c => {
      if (c.date && /^\d{4}-\d{2}-\d{2}$/.test(c.date)) {
        monthsSet.add(c.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [relatorios, celebracoesEscala, currentSystemYearMonth]);

  const formatYearMonth = (ym: string) => {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
    const [y, m] = ym.split('-');
    const monthNamesPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mIndex = parseInt(m, 10) - 1;
    return `${monthNamesPt[mIndex] || m}/${y}`;
  };

  // Tracking read reports by coordination
  const [readReportIds, setReadReportIds] = useState<string[]>(() => {
    const userKey = user?.id || user?.telefone || 'coord';
    try {
      return JSON.parse(localStorage.getItem(`read_relatorios_${userKey}`) || '[]');
    } catch (e) {
      return [];
    }
  });
  const [viewingRelatorio, setViewingRelatorio] = useState<any | null>(null);

  // Modal / Form state for coordination report entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCelebracaoKey, setSelectedCelebracaoKey] = useState<string>('');
  const [modalPresencas, setModalPresencas] = useState<{ [ministerName: string]: boolean }>({});
  const [modalCasalMembros, setModalCasalMembros] = useState<{ [coupleName: string]: { p1Faltou: boolean; p2Faltou: boolean } }>({});
  const [expandedCasais, setExpandedCasais] = useState<{ [coupleName: string]: boolean }>({});
  const [modalSemAlteracao, setModalSemAlteracao] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    horario: '10:00',
    liderNome: '',
    faltasReportadas: '',
    trocasNaoRegistradas: '',
    usoEstoque: '',
    observacoes: ''
  });
  const [modalEstoqueItems, setModalEstoqueItems] = useState<string[]>([]);
  const [modalEstoqueOutro, setModalEstoqueOutro] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const [minRes, relRes, escRes] = await Promise.all([
        apiFetch(`/api/admin/ministros?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`),
        apiFetch(`/api/relatorios-lider?paroquia=${encodeURIComponent(user?.paroquia || '')}&t=${now}`),
        apiFetch(`/api/escala?paroquia=${encodeURIComponent(user?.paroquia || '')}&preview=true&t=${now}`)
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

      let submittedKeys = new Set<string>();
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
            submittedKeys = new Set(relData.map((r: any) => `${r.data}_${r.horario}`));
          }
        }
      }

      if (escRes.ok) {
        const ct = escRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const escData = await escRes.json();
          if (escData && typeof escData === 'object') {
            const list: any[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            Object.entries(escData).forEach(([dateStr, missas]: [string, any]) => {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
              
              const parts = dateStr.split('-');
              const assignDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              assignDate.setHours(0, 0, 0, 0);
              const diffDays = Math.round((assignDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              // Inclui celebrações passadas/hoje (pendências de relatório) e dos próximos 2 dias (janela ativa)
              if (diffDays > 2) return;

              const checkAndAddMissa = (m: any, defaultHorario: string) => {
                const h = m.horario || m.time || defaultHorario;
                const key = `${dateStr}_${h}`;
                // REGRA: Uma vez enviado o relatório, ele NÃO aparece como pendência
                if (submittedKeys.has(key)) return;

                const ministros = Array.isArray(m.ministros) ? m.ministros : [];
                // Permite ao líder da missa ou a qualquer membro da coordenação:
                const isLeader = isMinisterLiderForUser(m.lider, user, ministros) || hasCoordAccess(user);
                if (!isLeader) return;

                const isPending = diffDays <= 0;

                list.push({
                  date: dateStr,
                  data: dateStr,
                  horario: h,
                  nome: m.nome || 'Missa',
                  lider: m.lider || '',
                  liderNome: m.lider || '',
                  ministros: ministros,
                  isPending
                });
              };

              if (Array.isArray(missas)) {
                missas.forEach((m: any) => checkAndAddMissa(m, '10:00'));
              } else if (typeof missas === 'object' && missas !== null) {
                Object.entries(missas).forEach(([horario, m]: [string, any]) => {
                  checkAndAddMissa(m, horario);
                });
              }
            });
            list.sort((a, b) => `${a.date}T${a.horario}`.localeCompare(`${b.date}T${b.horario}`));
            setCelebracoesEscala(list);
            if (list.length > 0) {
              const target = list[0];
              const key = `${target.date}_${target.horario}`;
              setSelectedCelebracaoKey(key);
              setFormData(prev => ({
                ...prev,
                data: target.date,
                horario: target.horario,
                liderNome: target.lider || ''
              }));
              const initialPresencas: { [name: string]: boolean } = {};
              const initialCasalMembros: { [name: string]: { p1Faltou: boolean; p2Faltou: boolean } } = {};
              (target.ministros || []).forEach((m: any) => {
                const name = typeof m === 'string' ? m : (m.nome || m.name || '');
                if (!name) return;
                if (doesMinisterMatchLeader(name, target.lider)) return;
                initialPresencas[name] = true;
                if (isCoupleSlot(name)) {
                  initialCasalMembros[name] = { p1Faltou: false, p2Faltou: false };
                }
              });
              setModalPresencas(initialPresencas);
              setModalCasalMembros(initialCasalMembros);
            } else {
              setSelectedCelebracaoKey('');
              setFormData(prev => ({
                ...prev,
                data: '',
                horario: '',
                liderNome: ''
              }));
              setModalPresencas({});
              setModalCasalMembros({});
            }
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

  // Read status utilities
  const isReportUnread = (r: any) => {
    if (!r || !r.id) return false;
    if (r.lidoPorCoordenacao === true) return false;
    if (readReportIds.includes(String(r.id))) return false;
    return true;
  };

  const unreadCount = useMemo(() => {
    return relatorios.filter(isReportUnread).length;
  }, [relatorios, readReportIds]);

  const markAsRead = async (id: string, forceStatus = true) => {
    const userKey = user?.id || user?.telefone || 'coord';
    setReadReportIds(prev => {
      let next;
      if (forceStatus) {
        next = prev.includes(String(id)) ? prev : [...prev, String(id)];
      } else {
        next = prev.filter(item => item !== String(id));
      }
      try {
        localStorage.setItem(`read_relatorios_${userKey}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setRelatorios(prev =>
      prev.map(r => (String(r.id) === String(id) ? { ...r, lidoPorCoordenacao: forceStatus } : r))
    );

    window.dispatchEvent(new Event('relatorios_lider_updated'));

    try {
      await apiFetch(`/api/relatorios-lider/${id}/marcar-lido`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paroquia: user?.paroquia,
          lido: forceStatus,
          usuarioNome: user?.nome || 'Coordenação'
        })
      });
    } catch (err) {
      console.error('Erro ao atualizar leitura do relatório no servidor:', err);
    }
  };

  const markAllAsRead = async () => {
    const userKey = user?.id || user?.telefone || 'coord';
    const allIds = relatorios.map(r => String(r.id)).filter(Boolean);
    setReadReportIds(allIds);
    try {
      localStorage.setItem(`read_relatorios_${userKey}`, JSON.stringify(allIds));
    } catch (e) {}

    setRelatorios(prev => prev.map(r => ({ ...r, lidoPorCoordenacao: true })));
    window.dispatchEvent(new Event('relatorios_lider_updated'));

    try {
      await apiFetch('/api/relatorios-lider/marcar-todos-lidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paroquia: user?.paroquia,
          usuarioNome: user?.nome || 'Coordenação'
        })
      });
      if (onAlert) onAlert('Todos os relatórios foram marcados como lidos!', 'success');
    } catch (err) {
      console.error('Erro ao marcar todos relatórios como lidos:', err);
    }
  };

  const handleOpenRelatorio = (rel: any) => {
    setViewingRelatorio(rel);
    if (isReportUnread(rel)) {
      markAsRead(rel.id, true);
    }
  };

  // Helper functions for robust report criteria
  const hasFaltasReport = (r: any) => {
    if (!r || r.isPending) return false;
    if (Array.isArray(r.faltasReportadas) && r.faltasReportadas.length > 0) return true;
    if (typeof r.faltasReportadas === 'string' && r.faltasReportadas.trim().length > 0) return true;
    if (r.presencas && typeof r.presencas === 'object') {
      return Object.values(r.presencas).some(v => v === false);
    }
    return false;
  };

  const isMeaningfulText = (text: any) => {
    if (!text || typeof text !== 'string') return false;
    const cleaned = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!cleaned) return false;
    const negatives = [
      'nao', 'nao.', 'nenhuma', 'nenhum', 'nao houve', 'nao houve.', 'nao houve trocas',
      'sem trocas', 'sem alteracao', 'sem alteracoes', 'tudo ok', 'tudo certo', 'nada',
      'sem utilizacao', 'nao utilizado', 'nao precisou', 'nenhum uso', '-'
    ];
    return !negatives.includes(cleaned);
  };

  const hasTrocasReport = (r: any) => {
    if (!r || r.isPending) return false;
    return isMeaningfulText(r.trocasNaoRegistradas);
  };

  const hasEstoqueReport = (r: any) => {
    if (!r || r.isPending) return false;
    return isMeaningfulText(r.usoEstoque);
  };

  const isSemAlteracaoReport = (r: any) => {
    if (!r || r.isPending) return false;
    if (r.semAlteracao) return true;
    return !hasFaltasReport(r) && !hasTrocasReport(r) && !hasEstoqueReport(r) && !isMeaningfulText(r.observacoes);
  };

  // Unified list of reports and pending celebrations filtered by month
  const monthRelatorios = useMemo(() => {
    const list: any[] = [
      ...relatorios.map(r => ({ ...r, isPending: false })),
      ...celebracoesEscala
        .filter(c => c.isPending)
        .map(c => ({
          ...c,
          id: `pending_${c.date}_${c.horario}`,
          isPending: true,
          data: c.date,
          horario: c.horario,
          liderNome: c.lider || 'Aguardando',
          faltasReportadas: [],
          trocasNaoRegistradas: '',
          usoEstoque: '',
          observacoes: '',
          lidoPorCoordenacao: false
        }))
    ];

    list.sort((a, b) => {
      const dateA = new Date(`${a.data}T${a.horario || '00:00'}`).getTime() || 0;
      const dateB = new Date(`${b.data}T${b.horario || '00:00'}`).getTime() || 0;
      return dateB - dateA;
    });

    if (!selectedMonthFilter || selectedMonthFilter === 'todos') {
      return list;
    }
    return list.filter(item => (item.data || '').substring(0, 7) === selectedMonthFilter);
  }, [relatorios, celebracoesEscala, selectedMonthFilter]);

  const countPendentes = useMemo(() => {
    return monthRelatorios.filter(r => r.isPending).length;
  }, [monthRelatorios]);

  const countEnviados = useMemo(() => {
    return monthRelatorios.filter(r => !r.isPending).length;
  }, [monthRelatorios]);

  const countComFaltas = useMemo(() => {
    return monthRelatorios.filter(hasFaltasReport).length;
  }, [monthRelatorios]);

  const countComTrocas = useMemo(() => {
    return monthRelatorios.filter(hasTrocasReport).length;
  }, [monthRelatorios]);

  const countComEstoque = useMemo(() => {
    return monthRelatorios.filter(hasEstoqueReport).length;
  }, [monthRelatorios]);

  const countSemAlteracao = useMemo(() => {
    return monthRelatorios.filter(isSemAlteracaoReport).length;
  }, [monthRelatorios]);

  const countNaoLidos = useMemo(() => {
    return monthRelatorios.filter(r => !r.isPending && isReportUnread(r)).length;
  }, [monthRelatorios, readReportIds]);

  // Filtered items (reports + pending celebrations)
  const filteredRelatorios = useMemo(() => {
    const normalize = (s: any) => {
      if (!s || typeof s !== 'string') return '';
      return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    };

    return monthRelatorios.filter(r => {
      // 1. Search term filter
      if (searchTerm) {
        const term = normalize(searchTerm);
        const dateParts = r.data ? r.data.split('-').reverse().join('/') : ''; // 04/10/2026
        const parts = (r.data || '').split('-');
        const dateDayMonth = parts.length === 3 ? `${parts[2]}/${parts[1]}` : ''; // 04/10
        const dateDayMonthNoZero = parts.length === 3 ? `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}` : ''; // 4/10
        const dateFullNoZero = parts.length === 3 ? `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}` : ''; // 4/10/2026
        
        const monthNamesPt = [
          'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const monthName = parts.length === 3 ? monthNamesPt[parseInt(parts[1], 10) - 1] || '' : '';

        const matchLider = normalize(r.liderNome || r.lider).includes(term);
        const matchData = (r.data || '').includes(term) ||
          dateParts.includes(term) ||
          dateDayMonth.includes(term) ||
          dateDayMonthNoZero.includes(term) ||
          dateFullNoZero.includes(term) ||
          monthName.includes(term);

        const hClean = (r.horario || '').replace(':', 'h');
        const matchHorario = (r.horario || '').includes(term) || hClean.includes(term);
        const matchEstoque = normalize(r.usoEstoque).includes(term);
        const matchTrocas = normalize(r.trocasNaoRegistradas).includes(term);
        const matchObs = normalize(r.observacoes).includes(term);
        
        const matchFaltas = Array.isArray(r.faltasReportadas) && r.faltasReportadas.some(
          (f: any) => normalize(f.ministroNome).includes(term) || normalize(f.justificativa).includes(term)
        );

        const matchPresencas = r.presencas && typeof r.presencas === 'object'
          ? Object.keys(r.presencas).some(name => normalize(name).includes(term))
          : false;

        const matchMinistros = Array.isArray(r.ministros)
          ? r.ministros.some((m: any) => normalize(typeof m === 'string' ? m : m.nome || '').includes(term))
          : false;

        const matchPendencia = r.isPending && (term.includes('pend') || term.includes('falta') || term.includes('nao') || term.includes('aberto'));

        if (!matchLider && !matchData && !matchHorario && !matchEstoque && !matchTrocas && !matchObs && !matchFaltas && !matchPresencas && !matchMinistros && !matchPendencia) {
          return false;
        }
      }

      // 2. Type filter
      if (filterType === 'pendentes') {
        return Boolean(r.isPending);
      }
      if (filterType === 'enviados') {
        return !r.isPending;
      }
      if (filterType === 'naoLidos') {
        return !r.isPending && isReportUnread(r);
      }
      if (filterType === 'comFaltas') {
        return !r.isPending && hasFaltasReport(r);
      }
      if (filterType === 'comTrocas') {
        return !r.isPending && hasTrocasReport(r);
      }
      if (filterType === 'comEstoque') {
        return !r.isPending && hasEstoqueReport(r);
      }
      if (filterType === 'semAlteracao') {
        return !r.isPending && isSemAlteracaoReport(r);
      }

      return true;
    });
  }, [monthRelatorios, searchTerm, filterType, readReportIds]);

  // Filtered enabled leaders
  const filteredLideres = useMemo(() => {
    if (!searchTerm) return lideresHabilitados;
    const term = searchTerm.toLowerCase();
    return lideresHabilitados.filter(l => 
      l.nome.toLowerCase().includes(term) || l.telefone.includes(term)
    );
  }, [lideresHabilitados, searchTerm]);

  const handleSelectFilterType = (type: FilterType) => {
    setFilterType(type);
    // NÃO reseta o filtro de mês automaticamente para evitar perda de contexto do usuário
  };

  // Delete report
  const handleDeleteRelatorio = (id: string, info: string) => {
    const doDelete = async () => {
      try {
        const res = await apiFetch(`/api/relatorios-lider/${id}?paroquia=${encodeURIComponent(user?.paroquia || '')}`, {
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

  // Report creation for current mass where user is responsible
  const handleOpenModal = (celebracao?: any) => {
    const target = celebracao || (celebracoesEscala && celebracoesEscala.length > 0 ? celebracoesEscala[0] : null);
    if (!target) {
      if (onAlert) {
        onAlert('Nenhuma celebração pendente selecionada no momento.', 'info');
      }
      return;
    }

    const key = `${target.date}_${target.horario}`;
    setSelectedCelebracaoKey(key);
    setModalSemAlteracao(false);
    
    // Check if an existing report already has info
    const existing = relatorios.find(r => r.data === target.date && r.horario === target.horario);
    if (existing && existing.usoEstoque) {
      const parsed = parseUsoEstoque(existing.usoEstoque);
      setModalEstoqueItems(parsed.selected);
      setModalEstoqueOutro(parsed.outro);
    } else {
      setModalEstoqueItems([]);
      setModalEstoqueOutro('');
    }

    setFormData({
      data: target.date,
      horario: target.horario,
      liderNome: target.lider || '',
      faltasReportadas: '',
      trocasNaoRegistradas: existing ? (existing.trocasNaoRegistradas || '') : '',
      usoEstoque: existing ? (existing.usoEstoque || '') : '',
      observacoes: existing ? (existing.observacoes || '') : ''
    });
    const initialPresencas: { [name: string]: boolean } = {};
    const initialCasalMembros: { [name: string]: { p1Faltou: boolean; p2Faltou: boolean } } = {};
    (target.ministros || []).forEach((m: any) => {
      const name = typeof m === 'string' ? m : (m.nome || m.name || '');
      if (!name) return;
      // O líder ou responsável já está designado e não deve aparecer na lista de ministros a conferir
      if (doesMinisterMatchLeader(name, target.lider)) return;
      initialPresencas[name] = true;
      if (isCoupleSlot(name)) {
        initialCasalMembros[name] = { p1Faltou: false, p2Faltou: false };
      }
    });
    setModalPresencas(initialPresencas);
    setModalCasalMembros(initialCasalMembros);
    setIsModalOpen(true);
  };

  const handleSelectCelebracaoChange = (key: string) => {
    setSelectedCelebracaoKey(key);
    setModalSemAlteracao(false);
    if (key === 'manual') {
      setModalPresencas({});
      setModalCasalMembros({});
      setModalEstoqueItems([]);
      setModalEstoqueOutro('');
      return;
    }
    const target = celebracoesEscala.find(c => `${c.date}_${c.horario}` === key);
    if (target) {
      const existing = relatorios.find(r => r.data === target.date && r.horario === target.horario);
      if (existing && existing.usoEstoque) {
        const parsed = parseUsoEstoque(existing.usoEstoque);
        setModalEstoqueItems(parsed.selected);
        setModalEstoqueOutro(parsed.outro);
      } else {
        setModalEstoqueItems([]);
        setModalEstoqueOutro('');
      }

      setFormData(prev => ({
        ...prev,
        data: target.date,
        horario: target.horario,
        liderNome: target.lider || '',
        trocasNaoRegistradas: existing ? (existing.trocasNaoRegistradas || '') : '',
        usoEstoque: existing ? (existing.usoEstoque || '') : '',
        observacoes: existing ? (existing.observacoes || '') : ''
      }));
      const initialPresencas: { [name: string]: boolean } = {};
      const initialCasalMembros: { [name: string]: { p1Faltou: boolean; p2Faltou: boolean } } = {};
      (target.ministros || []).forEach((m: any) => {
        const name = typeof m === 'string' ? m : (m.nome || m.name || '');
        if (!name) return;
        // O líder ou responsável já está designado e não deve aparecer na lista de ministros a conferir
        if (doesMinisterMatchLeader(name, target.lider)) return;
        initialPresencas[name] = true;
        if (isCoupleSlot(name)) {
          initialCasalMembros[name] = { p1Faltou: false, p2Faltou: false };
        }
      });
      setModalPresencas(initialPresencas);
      setModalCasalMembros(initialCasalMembros);
    }
  };

  const handleToggleModalSemAlteracao = (checked: boolean) => {
    setModalSemAlteracao(checked);
    if (checked) {
      const allPresent: { [name: string]: boolean } = {};
      const allCouples: { [name: string]: { p1Faltou: boolean; p2Faltou: boolean } } = {};
      Object.keys(modalPresencas).forEach((name) => {
        allPresent[name] = true;
        if (isCoupleSlot(name)) {
          allCouples[name] = { p1Faltou: false, p2Faltou: false };
        }
      });
      setModalPresencas(allPresent);
      setModalCasalMembros(allCouples);
      setModalEstoqueItems([]);
      setModalEstoqueOutro('');
      setFormData((prev) => ({
        ...prev,
        trocasNaoRegistradas: '',
        usoEstoque: '',
        observacoes: ''
      }));
    }
  };

  const toggleModalPresenca = (ministerName: string) => {
    if (modalSemAlteracao) setModalSemAlteracao(false);
    setModalPresencas(prev => ({
      ...prev,
      [ministerName]: prev[ministerName] === false ? true : false
    }));
  };

  const toggleModalCasalMember = (coupleName: string, member: 'p1' | 'p2') => {
    if (modalSemAlteracao) setModalSemAlteracao(false);
    setModalCasalMembros(prev => {
      const current = prev[coupleName] || { p1Faltou: false, p2Faltou: false };
      const next = {
        ...current,
        [member === 'p1' ? 'p1Faltou' : 'p2Faltou']: !current[member === 'p1' ? 'p1Faltou' : 'p2Faltou']
      };
      const anyFaltou = next.p1Faltou || next.p2Faltou;
      setModalPresencas(mp => ({ ...mp, [coupleName]: !anyFaltou }));
      return { ...prev, [coupleName]: next };
    });
  };

  const toggleCasalExpanded = (coupleName: string) => {
    setExpandedCasais(prev => ({ ...prev, [coupleName]: !prev[coupleName] }));
  };

  const setModalCasalStatus = (coupleName: string, status: 'ambos_presentes' | 'so_p1' | 'so_p2' | 'ambos_faltaram') => {
    if (modalSemAlteracao) setModalSemAlteracao(false);
    let next = { p1Faltou: false, p2Faltou: false };
    let anyFaltou = false;

    if (status === 'ambos_presentes') {
      next = { p1Faltou: false, p2Faltou: false };
      anyFaltou = false;
    } else if (status === 'so_p1') {
      // Apenas o cônjuge 1 esteve presente (cônjuge 2 faltou)
      next = { p1Faltou: false, p2Faltou: true };
      anyFaltou = true;
    } else if (status === 'so_p2') {
      // Apenas o cônjuge 2 esteve presente (cônjuge 1 faltou)
      next = { p1Faltou: true, p2Faltou: false };
      anyFaltou = true;
    } else if (status === 'ambos_faltaram') {
      next = { p1Faltou: true, p2Faltou: true };
      anyFaltou = true;
    }

    setModalPresencas(mp => ({ ...mp, [coupleName]: !anyFaltou }));
    setModalCasalMembros(prev => ({ ...prev, [coupleName]: next }));
  };

  const handleSaveManualRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data || !formData.horario || !formData.liderNome) {
      if (onAlert) onAlert('Preencha a data, o horário e o nome do responsável.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Faltas marcadas através dos botões e seleções individuais de casais:
      const faltasFromCheckboxes: Array<{ ministroNome: string; quantidade: number; tipoFalta: string; justificativa: string }> = [];

      Object.entries(modalPresencas).forEach(([name, isPresent]) => {
        if (isCoupleSlot(name)) {
          const [p1, p2] = splitCoupleNames(name);
          const cState = modalCasalMembros[name] || { p1Faltou: false, p2Faltou: false };
          if (cState.p1Faltou && cState.p2Faltou) {
            faltasFromCheckboxes.push({
              ministroNome: `${p1} e ${p2}`,
              quantidade: 2,
              tipoFalta: 'ambos',
              justificativa: 'Falta de ambos registrada no relatório da celebração'
            });
          } else if (cState.p1Faltou) {
            faltasFromCheckboxes.push({
              ministroNome: p1,
              quantidade: 1,
              tipoFalta: 'principal',
              justificativa: `Falta de ${p1} (casal) registrada no relatório da celebração`
            });
          } else if (cState.p2Faltou) {
            faltasFromCheckboxes.push({
              ministroNome: p2,
              quantidade: 1,
              tipoFalta: 'conjuge',
              justificativa: `Falta de ${p2} (casal) registrada no relatório da celebração`
            });
          }
        } else if (isPresent === false) {
          faltasFromCheckboxes.push({
            ministroNome: name,
            quantidade: 1,
            tipoFalta: 'individual',
            justificativa: 'Falta registrada no relatório da celebração'
          });
        }
      });

      const faltasFromTextarea = formData.faltasReportadas
        ? formData.faltasReportadas.split('\n').filter(Boolean).map(line => ({
            ministroNome: line.trim(),
            quantidade: 1,
            tipoFalta: 'individual',
            justificativa: 'Falta registrada pela Coordenação'
          }))
        : [];

      const faltasArr = [...faltasFromCheckboxes];
      faltasFromTextarea.forEach(f => {
        if (!faltasArr.some(item => item.ministroNome.toLowerCase() === f.ministroNome.toLowerCase())) {
          faltasArr.push(f);
        }
      });

      const payload = {
        paroquia: user?.paroquia,
        data: formData.data,
        horario: formData.horario,
        liderNome: formData.liderNome,
        presencas: modalPresencas,
        faltasReportadas: faltasArr,
        trocasNaoRegistradas: formData.trocasNaoRegistradas,
        usoEstoque: formData.usoEstoque,
        observacoes: formData.observacoes,
        semAlteracao: modalSemAlteracao
      };

      const res = await apiFetch('/api/relatorios-lider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onAlert) onAlert('Relatório da missa registrado com sucesso!', 'success');
        setIsModalOpen(false);
        setModalEstoqueItems([]);
        setModalEstoqueOutro('');
        setFormData({
          data: new Date().toISOString().split('T')[0],
          horario: '10:00',
          liderNome: '',
          faltasReportadas: '',
          trocasNaoRegistradas: '',
          usoEstoque: '',
          observacoes: ''
        });
        setModalPresencas({});
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Área Restrita - Coordenação
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 border border-red-200 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3 text-red-600" />
                {unreadCount} {unreadCount === 1 ? 'Relatório Não Lido' : 'Relatórios Não Lidos'}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-blue-600" />
            Responsáveis pela Missa
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Acompanhe em tempo real os relatórios enviados pelos responsáveis: faltas ocorridas, trocas de última hora, consumo de estoque e observações da celebração.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" /> Voltar ao Painel
            </button>
          )}

          {celebracoesEscala.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Lançar Relatório
            </button>
          )}
        </div>
      </div>

      {/* Unread Reports Notification Banner for Coordination */}
      {unreadCount > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border-2 border-red-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-red-950">
                  {unreadCount === 1 ? '1 Novo Relatório de Missa Enviado' : `${unreadCount} Novos Relatórios de Missa Enviados`}
                </h4>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Novo
                </span>
              </div>
              <p className="text-xs text-red-800 font-medium mt-0.5">
                Os responsáveis enviaram relatórios de celebrações recentes. Abra e leia cada um para acompanhar os detalhes litúrgicos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('naoLidos')}
              className="px-3.5 py-2 bg-white hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-red-600" /> Ver Não Lidos ({unreadCount})
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Marcar todos como lidos
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="group bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Responsáveis Aptos</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{lideresHabilitados.length}</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ministros aptos a liderança</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 border border-slate-100 group-hover:border-blue-100 transition-colors shadow-xs">
            <Flag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveSubTab('relatorios'); setFilterType('enviados'); }}
          className={`group p-4 sm:p-5 rounded-3xl border shadow-xs flex items-center justify-between transition-all hover:shadow-md cursor-pointer ${
            filterType === 'enviados' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30' : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
          title="Ver relatórios enviados"
        >
          <div>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>Relatórios Recebidos</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-black text-slate-900">{relatorios.length}</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-lg shadow-blue-600/30 animate-pulse">
                  {unreadCount} Novo{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {unreadCount > 0 ? 'Aguardando leitura' : 'Histórico completo'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl border transition-colors shadow-xs ${
            unreadCount > 0 ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
          }`}>
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveSubTab('relatorios'); setFilterType('pendentes'); }}
          className={`group p-4 sm:p-5 rounded-3xl border shadow-xs flex items-center justify-between transition-all hover:shadow-md cursor-pointer ${
            countPendentes > 0 
              ? (filterType === 'pendentes' ? 'border-rose-500 ring-3 ring-rose-500/30 bg-rose-50' : 'bg-rose-50/40 border-rose-200 hover:border-rose-300')
              : (filterType === 'pendentes' ? 'border-slate-400 ring-2 ring-slate-400/20 bg-slate-50' : 'bg-white border-slate-200 hover:border-slate-300')
          }`}
          title="Ver missas com pendência de relatório"
        >
          <div>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${countPendentes > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              Pendências
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className={`text-2xl font-black ${countPendentes > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {countPendentes}
              </h4>
              {countPendentes > 0 && (
                <span className="text-[10px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-full shadow-lg shadow-rose-600/30 animate-pulse">
                  Atenção
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {countPendentes > 0 ? 'Aguardando envio do líder' : 'Em dia'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl border transition-colors shadow-xs ${
            countPendentes > 0 ? 'bg-rose-600 text-white border-rose-500 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}>
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveSubTab('relatorios'); setFilterType('comTrocas'); }}
          className={`group p-4 sm:p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer ${
            filterType === 'comTrocas' ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20' : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
          title="Filtrar por trocas"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Trocas Informadas</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {countComTrocas}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Substituições na celebração</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 border border-slate-100 group-hover:border-amber-100 transition-colors shadow-xs">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div 
          onClick={() => { setActiveSubTab('relatorios'); setFilterType('comEstoque'); }}
          className={`group p-4 sm:p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer ${
            filterType === 'comEstoque' ? 'border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-50/20' : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
          title="Filtrar por consumo de estoque"
        >
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Consumo Estoque</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {countComEstoque}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Hóstias e vinho utilizados</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-100 group-hover:border-indigo-100 transition-colors shadow-xs">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
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
          {/* Month Filter Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Período dos Relatórios:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="todos">🌐 Todos os Meses ({relatorios.length} relatórios)</option>
                <option value={currentSystemYearMonth}>Mês Atual ({formatYearMonth(currentSystemYearMonth)})</option>
                {availableMonths.filter(ym => ym !== currentSystemYearMonth).map(ym => (
                  <option key={ym} value={ym}>
                    {formatYearMonth(ym)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtros:
            </span>
            <button
              type="button"
              onClick={() => handleSelectFilterType('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                filterType === 'todos'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos ({monthRelatorios.length})
            </button>
            {countPendentes > 0 && (
              <button
                type="button"
                onClick={() => handleSelectFilterType('pendentes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  filterType === 'pendentes'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                } animate-pulse`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Pendências ({countPendentes})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSelectFilterType('enviados')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'enviados'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Enviados ({countEnviados})
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilterType('naoLidos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'naoLidos'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" /> Não Lidos ({countNaoLidos})
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilterType('comFaltas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'comFaltas'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserX className="w-3.5 h-3.5" /> Apenas com Faltas ({countComFaltas})
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilterType('comTrocas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'comTrocas'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Trocas ({countComTrocas})
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilterType('comEstoque')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'comEstoque'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Uso de Estoque ({countComEstoque})
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilterType('semAlteracao')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterType === 'semAlteracao'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> 100% OK ({countSemAlteracao})
            </button>
            {(filterType !== 'todos' || searchTerm) && (
              <button
                type="button"
                onClick={() => { setFilterType('todos'); setSearchTerm(''); }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
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
              <h3 className="text-base font-black text-slate-800">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchTerm || filterType !== 'todos'
                  ? 'Nenhum relatório ou celebração corresponde aos filtros selecionados.'
                  : 'Os responsáveis pela missa preenchem o relatório diretamente pelo app na data da celebração. Quando enviarem, os relatórios aparecerão automaticamente aqui!'}
              </p>
              {(searchTerm || filterType !== 'todos' || selectedMonthFilter !== 'todos') && (
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  {(searchTerm || filterType !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => { setFilterType('todos'); setSearchTerm(''); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Limpar Filtros e Busca
                    </button>
                  )}
                  {selectedMonthFilter !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonthFilter('todos')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                    >
                      🌐 Ver em Todos os Meses
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredRelatorios.map((rel) => {
                const dateParts = rel.data ? rel.data.split('-').reverse().join('/') : '';
                
                // Card para Celebração com PENDÊNCIA de Relatório
                if (rel.isPending) {
                  const leaderMinister = ministers.find(m => doesMinisterMatchLeader(m.nome, rel.liderNome || rel.lider));
                  const leaderPhone = leaderMinister?.telefone || '';
                  return (
                    <div
                      key={rel.id || `pending_${rel.data}_${rel.horario}`}
                      className="group bg-gradient-to-br from-rose-50/50 via-white to-white rounded-xl border-2 border-rose-400 ring-2 ring-rose-500/10 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs p-2.5 sm:p-3 relative"
                    >
                      <div>
                        {/* Header Section */}
                        <div className="flex items-start justify-between gap-1.5 pb-2 border-b border-rose-100">
                          <div className="space-y-1 flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <div className="flex items-center bg-slate-900 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight">
                                <Calendar className="w-2.5 h-2.5 mr-0.5 opacity-70" /> {dateParts}
                              </div>
                              <div className="flex items-center bg-rose-100 text-rose-800 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-rose-200 uppercase tracking-tight">
                                <Clock className="w-2.5 h-2.5 mr-0.5 opacity-70" /> {rel.horario}h
                              </div>
                              <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs uppercase tracking-wider animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" /> Pendência
                              </span>
                            </div>

                            {/* Responsável Compact Row */}
                            <div className="flex items-center gap-1.5 bg-rose-50/80 p-1 px-1.5 rounded-lg border border-rose-200">
                              <div className="relative shrink-0">
                                <div className="w-6 h-6 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-2xs animate-pulse">
                                  {(rel.liderNome || 'R').charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[7.5px] font-bold uppercase tracking-wider text-rose-600 leading-none mb-0.5">Responsável da Missa</p>
                                <p className="text-[11px] font-black text-rose-950 truncate tracking-tight">{toTitleCase(rel.liderNome || "Aguardando")}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message & Alert details */}
                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900 text-[9.5px] font-medium leading-tight space-y-1">
                          <p>
                            ⚠️ <strong>Relatório não enviado.</strong> A celebração ocorreu e o responsável ainda não registrou o relatório litúrgico.
                          </p>
                          {rel.ministros && rel.ministros.length > 0 && (
                            <p className="text-[8.5px] text-rose-700">
                              👥 {rel.ministros.length} ministros escalados nesta celebração.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Footer */}
                      <div className="pt-2 mt-2 border-t border-rose-100 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(rel)}
                          className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Preencher Relatório
                        </button>
                        {leaderPhone && (
                          <a
                            href={`https://wa.me/55${leaderPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${toTitleCase(rel.liderNome)}! A Coordenação lembra que o Relatório Litúrgico da Missa de ${dateParts} às ${rel.horario}h ainda está pendente de envio no Portal do Mece. Por favor, acesse o app e envie assim que possível. Deus abençoe!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Lembrar pelo WhatsApp"
                          >
                            <Phone className="w-2.5 h-2.5" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }

                // Card para Relatório ENVIADO (Padrão)
                const hasFaltas = hasFaltasReport(rel);
                const hasTrocas = hasTrocasReport(rel);
                const hasEstoque = hasEstoqueReport(rel);
                const hasObs = isMeaningfulText(rel.observacoes);
                const isClean = isSemAlteracaoReport(rel);
                const unread = isReportUnread(rel);

                return (
                  <div
                    key={rel.id || `${rel.data}_${rel.horario}`}
                    className={`group bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs p-2.5 sm:p-3 ${
                      unread
                        ? 'border-blue-400 ring-2 ring-blue-500/10 bg-gradient-to-br from-blue-50/15 via-white to-white'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Header Section */}
                      <div className="flex items-start justify-between gap-1.5 pb-2 border-b border-slate-100">
                        <div className="space-y-1 flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <div className="flex items-center bg-slate-900 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight">
                              <Calendar className="w-2.5 h-2.5 mr-0.5 opacity-70" /> {dateParts}
                            </div>
                            <div className="flex items-center bg-blue-50 text-blue-700 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-blue-100/60 uppercase tracking-tight">
                              <Clock className="w-2.5 h-2.5 mr-0.5 opacity-70" /> {rel.horario}h
                            </div>
                            
                            {unread ? (
                              <span className="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs uppercase tracking-wider animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-white" /> Novo
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                                <Check className="w-2 h-2" /> Lido
                              </span>
                            )}

                            {(rel.semAlteracao || isClean) && (
                              <span className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs uppercase tracking-wider">
                                <ShieldCheck className="w-2 h-2" /> OK
                              </span>
                            )}
                          </div>
                          
                          {/* Responsável Compact Row */}
                          <div className="flex items-center gap-1.5 bg-slate-50/80 p-1 px-1.5 rounded-lg border border-slate-100 group-hover:bg-blue-50/20 transition-colors">
                            <div className="relative shrink-0">
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-[10px] flex items-center justify-center shadow-2xs">
                                {(rel.liderNome || 'R').charAt(0).toUpperCase()}
                              </div>
                              {unread && (
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 border border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Responsável</p>
                              <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{toTitleCase(rel.liderNome || "Aguardando")}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Eye & Trash */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRelatorio(rel)}
                            className="w-6 h-6 rounded-md bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-200 hover:border-blue-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer group/btn"
                            title="Ver Detalhes Completos"
                          >
                            <Eye className="w-3 h-3 transition-transform group-hover/btn:scale-110" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRelatorio(rel.id, `${dateParts} - ${rel.horario}h`)}
                            className="w-6 h-6 rounded-md bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Excluir Relatório"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Summary Data Grid: 4 super-compact indicators */}
                      <div className="grid grid-cols-2 gap-1 mt-1.5">
                        <div className={`p-1 px-1.5 rounded-md border transition-colors flex flex-col gap-0.5 ${hasFaltas ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50/70 border-slate-100'}`}>
                          <div className="flex items-center gap-1">
                            <UserX className={`w-2.5 h-2.5 ${hasFaltas ? 'text-rose-600' : 'text-slate-400'}`} />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">Ausências</span>
                          </div>
                          <p className={`text-[10px] font-bold truncate leading-tight ${hasFaltas ? 'text-rose-700' : 'text-slate-500'}`}>
                            {(() => {
                              if (!hasFaltas) return 'Nenhuma';
                              const count = Array.isArray(rel.faltasReportadas) && rel.faltasReportadas.length > 0
                                ? rel.faltasReportadas.length
                                : (rel.presencas ? Object.values(rel.presencas).filter(v => v === false).length : 1);
                              return `${count} Ministro(s)`;
                            })()}
                          </p>
                        </div>

                        <div className={`p-1 px-1.5 rounded-md border transition-colors flex flex-col gap-0.5 ${hasTrocas ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50/70 border-slate-100'}`}>
                          <div className="flex items-center gap-1">
                            <RefreshCw className={`w-2.5 h-2.5 ${hasTrocas ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">Trocas</span>
                          </div>
                          <p className={`text-[10px] font-bold truncate leading-tight ${hasTrocas ? 'text-amber-700' : 'text-slate-500'}`}>
                            {hasTrocas ? 'Informada' : 'Nenhuma'}
                          </p>
                        </div>

                        <div className={`p-1 px-1.5 rounded-md border transition-colors flex flex-col gap-0.5 ${hasEstoque ? 'bg-indigo-50/80 border-indigo-200' : 'bg-slate-50/70 border-slate-100'}`}>
                          <div className="flex items-center gap-1">
                            <Package className={`w-2.5 h-2.5 ${hasEstoque ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">Estoque</span>
                          </div>
                          <p className={`text-[10px] font-bold truncate leading-tight ${hasEstoque ? 'text-indigo-700' : 'text-slate-500'}`}>
                            {hasEstoque ? 'Consumo' : 'Nenhum'}
                          </p>
                        </div>

                        <div className={`p-1 px-1.5 rounded-md border transition-colors flex flex-col gap-0.5 ${hasObs ? 'bg-blue-50/80 border-blue-200' : 'bg-slate-50/70 border-slate-100'}`}>
                          <div className="flex items-center gap-1">
                            <MessageSquare className={`w-2.5 h-2.5 ${hasObs ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">Obs.</span>
                          </div>
                          <p className={`text-[10px] font-bold truncate leading-tight ${hasObs ? 'text-blue-700' : 'text-slate-500'}`}>
                            {hasObs ? 'Comentários' : 'Nenhum'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => markAsRead(rel.id, !unread ? false : true)}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            unread 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {unread ? 'Marcar Lido' : 'Como Novo'}
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[7.5px] font-medium text-slate-400 uppercase tracking-wider">Por {toTitleCase(rel.liderNome || 'Líder')}</p>
                        {rel.updatedAt && (
                          <p className="text-[7.5px] font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded inline-block mt-0.5">
                            {new Date(rel.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
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
              {celebracoesEscala.length > 1 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecionar Celebração da Escala
                  </label>
                  <select
                    value={selectedCelebracaoKey}
                    onChange={(e) => handleSelectCelebracaoChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {celebracoesEscala.map((c, idx) => {
                      const key = `${c.date}_${c.horario}`;
                      const parts = c.date.split('-');
                      const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : c.date;
                      const isUserActualLeader = isMinisterLiderForUser(c.lider, user, c.ministros);
                      return (
                        <option key={key || idx} value={key}>
                          {dateFormatted} às {c.horario} - {c.nome} {isUserActualLeader ? '(Você é o Responsável)' : `(Responsável: ${c.lider || 'Não definido'})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : celebracoesEscala.length === 1 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Celebração Selecionada
                  </label>
                  <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-950 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span>
                      {(() => {
                        const parts = celebracoesEscala[0].date.split('-');
                        const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : celebracoesEscala[0].date;
                        return `${dateFormatted} às ${celebracoesEscala[0].horario} - ${celebracoesEscala[0].nome}`;
                      })()}
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {isMinisterLiderForUser(celebracoesEscala[0].lider, user, celebracoesEscala[0].ministros) ? 'Você é o Responsável' : `Responsável: ${celebracoesEscala[0].lider || 'Coordenação'}`}
                    </span>
                  </div>
                </div>
              ) : null}

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
                    placeholder="Ex: 10:00"
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

              {/* Opção Quadrado Sem Alteração */}
              <div
                onClick={() => handleToggleModalSemAlteracao(!modalSemAlteracao)}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  modalSemAlteracao
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleModalSemAlteracao(!modalSemAlteracao);
                    }}
                    className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      modalSemAlteracao
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 hover:border-emerald-500'
                    }`}
                    role="checkbox"
                    aria-checked={modalSemAlteracao}
                  >
                    {modalSemAlteracao && <Check className="w-4 h-4 stroke-[3] text-white" />}
                  </button>
                  <span className="text-xs font-black text-slate-900">
                    Sem Alteração (Tudo Normal)
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 ${
                  modalSemAlteracao ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                }`}>
                  {modalSemAlteracao ? 'Tudo Normal' : 'Marcar'}
                </span>
              </div>

              {/* LISTA DE MINISTROS COM QUADRADINHO NA FRENTE */}
              {Object.keys(modalPresencas).length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Ministros e Casais Escalados
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Marque o quadradinho na frente caso alguém falte:
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {Object.keys(modalPresencas).length} ministros
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(modalPresencas).map(([mNome, isPresente]) => {
                      const isCouple = isCoupleSlot(mNome);

                      if (isCouple) {
                        const [p1, p2] = splitCoupleNames(mNome);
                        const cState = modalCasalMembros[mNome] || { p1Faltou: false, p2Faltou: false };
                        const hasAnyFalta = cState.p1Faltou || cState.p2Faltou;
                        const isExpanded = Boolean(expandedCasais[mNome]);

                        const currentStatus: 'ambos_presentes' | 'so_p1' | 'so_p2' | 'ambos_faltaram' =
                          !hasAnyFalta
                            ? 'ambos_presentes'
                            : cState.p1Faltou && cState.p2Faltou
                            ? 'ambos_faltaram'
                            : cState.p1Faltou
                            ? 'so_p2'
                            : 'so_p1';

                        return (
                          <div
                            key={mNome}
                            className={`rounded-xl border transition-all ${
                              !hasAnyFalta
                                ? 'bg-white border-slate-200 hover:border-slate-300'
                                : cState.p1Faltou && cState.p2Faltou
                                ? 'bg-rose-50/80 border-rose-300'
                                : 'bg-amber-50/80 border-amber-300'
                            }`}
                          >
                            {/* Nome do Casal normal - Ao clicar abre as opções */}
                            <button
                              type="button"
                              onClick={() => toggleCasalExpanded(mNome)}
                              className="w-full flex items-center justify-between p-2.5 text-xs text-left cursor-pointer transition hover:bg-slate-50/70 rounded-xl"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                  !hasAnyFalta
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                                    : cState.p1Faltou && cState.p2Faltou
                                    ? 'border-rose-500 bg-rose-500 text-white'
                                    : 'border-amber-500 bg-amber-500 text-white'
                                }`}>
                                  {!hasAnyFalta ? (
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : cState.p1Faltou && cState.p2Faltou ? (
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : (
                                    <span className="text-[10px] font-black leading-none">!</span>
                                  )}
                                </div>
                                <span className={`truncate ${!hasAnyFalta ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                                  {mNome}
                                </span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                                  Casal
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  !hasAnyFalta
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                    : cState.p1Faltou && cState.p2Faltou
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {!hasAnyFalta
                                    ? '✓ Ambos Presentes'
                                    : cState.p1Faltou && cState.p2Faltou
                                    ? '⚠️ Ambos Faltaram'
                                    : cState.p1Faltou
                                    ? `⚠️ Só ${p2}`
                                    : `⚠️ Só ${p1}`}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {/* Opções exibidas suavemente ao clicar no nome do casal */}
                            {isExpanded && (
                              <div className="p-2.5 pt-0 border-t border-slate-100 mt-1">
                                <p className="text-[10px] font-semibold text-slate-500 mb-1.5 px-0.5">
                                  Selecione a presença do casal:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setModalCasalStatus(mNome, 'ambos_presentes')}
                                    className={`p-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                      currentStatus === 'ambos_presentes'
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                    Ambos
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setModalCasalStatus(mNome, 'so_p1')}
                                    className={`p-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                                      currentStatus === 'so_p1'
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                    }`}
                                    title={`Apenas ${p1} esteve presente (${p2} faltou)`}
                                  >
                                    Só {p1}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setModalCasalStatus(mNome, 'so_p2')}
                                    className={`p-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                                      currentStatus === 'so_p2'
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                    }`}
                                    title={`Apenas ${p2} esteve presente (${p1} faltou)`}
                                  >
                                    Só {p2}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setModalCasalStatus(mNome, 'ambos_faltaram')}
                                    className={`p-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                      currentStatus === 'ambos_faltaram'
                                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                                    }`}
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                    Ambos Faltaram
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={mNome}
                          type="button"
                          onClick={() => toggleModalPresenca(mNome)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                            isPresente
                              ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                              isPresente
                                ? 'border-slate-300 bg-slate-50 text-slate-400'
                                : 'border-rose-500 bg-rose-500 text-white'
                            }`}>
                              {!isPresente ? (
                                <X className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-600 opacity-60" />
                              )}
                            </div>
                            <span className={isPresente ? 'font-medium' : 'font-bold line-through opacity-80'}>
                              {mNome}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isPresente
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {isPresente ? 'Presente' : 'Faltou'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faltas são controladas diretamente na lista de ministros acima */}

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Uso do Estoque
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Habilite os itens utilizados</span>
                </div>

                {/* 4 Quadrados de tamanho médio */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {ITENS_ESTOQUE_RELATORIO.map((item) => {
                    const isChecked = modalEstoqueItems.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => {
                          if (modalSemAlteracao) setModalSemAlteracao(false);
                          const next = isChecked
                            ? modalEstoqueItems.filter((i) => i !== item)
                            : [...modalEstoqueItems, item];
                          setModalEstoqueItems(next);
                          setFormData((prev) => ({
                            ...prev,
                            usoEstoque: formatUsoEstoque(next, modalEstoqueOutro),
                          }));
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isChecked
                            ? "bg-blue-50/90 border-blue-400 text-blue-900 font-semibold shadow-xs"
                            : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-300 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-xs leading-tight font-medium">{item}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Outro item ou observação do estoque (opcional)..."
                  value={modalEstoqueOutro}
                  onChange={(e) => {
                    if (modalSemAlteracao) setModalSemAlteracao(false);
                    const val = e.target.value;
                    setModalEstoqueOutro(val);
                    setFormData((prev) => ({
                      ...prev,
                      usoEstoque: formatUsoEstoque(modalEstoqueItems, val),
                    }));
                  }}
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

      {/* Modal de Leitura Completa do Relatório pelo Coordenador */}
      {viewingRelatorio && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {viewingRelatorio.data ? viewingRelatorio.data.split('-').reverse().join('/') : ''}
                  </span>
                  <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {viewingRelatorio.horario}h
                  </span>
                  {isReportUnread(viewingRelatorio) ? (
                    <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> Não Lido
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Lido pela Coordenação
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-amber-500" />
                  Responsável da Missa: <span className="text-blue-900">{toTitleCase(viewingRelatorio.liderNome)}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRelatorio(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Sections */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Presenças dos Ministros da Missa */}
              {viewingRelatorio.presencas && Object.keys(viewingRelatorio.presencas).length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2.5 text-slate-800">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider">
                      Chamada Litúrgica dos Ministros ({Object.keys(viewingRelatorio.presencas).length})
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(viewingRelatorio.presencas).map(([nome, presente]: [string, any]) => (
                      <div
                        key={nome}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          presente
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                            : 'bg-red-50 border-red-200 text-red-950 font-bold'
                        }`}
                      >
                        <span className="truncate">{nome}</span>
                        {presente ? (
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                            <Check className="w-3 h-3" /> Presente
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-200/80 text-red-800 font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                            <X className="w-3 h-3" /> Faltou
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Faltas Reportadas */}
              {Array.isArray(viewingRelatorio.faltasReportadas) && viewingRelatorio.faltasReportadas.length > 0 ? (
                <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-red-900">
                    <UserX className="w-4 h-4 text-red-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider">
                      Ausências Informadas pelo Responsável ({viewingRelatorio.faltasReportadas.length})
                    </h5>
                  </div>
                  <p className="text-[11px] text-red-700/90 mb-3 font-medium">
                    Informativo da celebração. O registro oficial de faltas no ranking e histórico é de competência exclusiva da Coordenação na aba "Faltas".
                  </p>
                  <div className="space-y-2">
                    {viewingRelatorio.faltasReportadas.map((f: any, idx: number) => (
                      <div key={idx} className="bg-white/80 p-3 rounded-xl border border-red-100 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{toTitleCase(f.ministroNome)}</span>
                          <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                            {f.tipoFalta === 'ambos' || f.quantidade === 2 ? 'Casal (2 faltas)' : 'Individual (1 falta)'}
                          </span>
                        </div>
                        {f.justificativa && (
                          <p className="text-slate-600 mt-1 italic text-[11px]">
                            Justificativa: "{f.justificativa}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-2 text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Nenhuma falta reportada nesta celebração (Equipe completa).</span>
                </div>
              )}

              {/* Trocas de Última Hora */}
              {viewingRelatorio.trocasNaoRegistradas && viewingRelatorio.trocasNaoRegistradas.trim().length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-900">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider">Trocas de Última Hora</h5>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed pl-6">
                    {viewingRelatorio.trocasNaoRegistradas}
                  </p>
                </div>
              )}

              {/* Consumo do Estoque */}
              {viewingRelatorio.usoEstoque && viewingRelatorio.usoEstoque.trim().length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-indigo-900">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider">Consumo de Estoque</h5>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed pl-6">
                    {viewingRelatorio.usoEstoque}
                  </p>
                </div>
              )}

              {/* Observações Gerais */}
              {viewingRelatorio.observacoes && viewingRelatorio.observacoes.trim().length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-800">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider">Observações / Recados Litúrgicos</h5>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed pl-6">
                    {viewingRelatorio.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-[11px] text-slate-400">
                Enviado por <strong>{toTitleCase(viewingRelatorio.liderNome)}</strong>
                {viewingRelatorio.updatedAt && (
                  <span> em {new Date(viewingRelatorio.updatedAt).toLocaleString('pt-BR')}</span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const currentUnread = isReportUnread(viewingRelatorio);
                    markAsRead(viewingRelatorio.id, currentUnread ? true : false);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 cursor-pointer"
                >
                  {isReportUnread(viewingRelatorio) ? '✓ Marcar como Lido' : 'Marcar como Não Lido'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isReportUnread(viewingRelatorio)) {
                      markAsRead(viewingRelatorio.id, true);
                    }
                    setViewingRelatorio(null);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Concluir e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordenacaoLideresView;
