import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Key,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Info,
  RefreshCw,
  Lock
} from 'lucide-react';

export interface FidelisCoordinator {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  paroquia: string;
  cargo?: 'coordenador' | 'vice_coordenador';
  tipo?: 'individual' | 'casal';
  nomeConjuge?: string;
  telefoneConjuge?: string;
  senha?: string;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  createdAt: string;
}

interface AdminFidelisViewProps {
  user: any;
  onCustomConfirm?: (message: string, onConfirm: () => void) => void;
}

export function AdminFidelisView({ user, onCustomConfirm }: AdminFidelisViewProps) {
  const [coordinators, setCoordinators] = useState<FidelisCoordinator[]>([]);
  const [paroquias, setParoquias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [paroquiaFilter, setParoquiaFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    paroquia: '',
    cargo: 'coordenador' as 'coordenador' | 'vice_coordenador',
    tipo: 'individual' as 'individual' | 'casal',
    nomeConjuge: '',
    telefoneConjuge: '',
    senha: '',
    status: 'ativo' as 'ativo' | 'inativo',
    observacoes: ''
  });

  const FIDELIS_URL = 'https://ais-dev-srs7nsnz675wo7vqxktxvd-45519709393.us-east1.run.app/';

  const fetchCoordinators = async () => {
    setLoading(true);
    setError('');
    try {
      const [resCoords, resPar] = await Promise.all([
        fetch('/api/fidelis/coordenadores'),
        fetch('/api/paroquias')
      ]);

      if (resCoords.ok) {
        const data = await resCoords.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } else {
        setError('Erro ao carregar coordenadores Fidelis.');
      }

      if (resPar.ok) {
        const parData = await resPar.json();
        setParoquias(Array.isArray(parData) ? parData : []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados Fidelis:', err);
      setError('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      telefone: '',
      paroquia: paroquias.length > 0 ? paroquias[0].nome : '',
      cargo: 'coordenador',
      tipo: 'individual',
      nomeConjuge: '',
      telefoneConjuge: '',
      senha: '123456',
      status: 'ativo',
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coord: FidelisCoordinator) => {
    setEditingId(coord.id);
    setFormData({
      nome: coord.nome || '',
      telefone: coord.telefone || '',
      paroquia: coord.paroquia || '',
      cargo: coord.cargo || 'coordenador',
      tipo: coord.tipo || 'individual',
      nomeConjuge: coord.nomeConjuge || '',
      telefoneConjuge: coord.telefoneConjuge || '',
      senha: coord.senha || '123456',
      status: coord.status || 'ativo',
      observacoes: coord.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.paroquia.trim()) {
      setError('Por favor, preencha os campos obrigatórios: Nome, Telefone e Paróquia.');
      return;
    }

    try {
      const url = editingId
        ? `/api/fidelis/coordenadores/${editingId}`
        : '/api/fidelis/coordenadores';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar coordenador Fidelis.');
      }

      setSuccessMsg(
        editingId
          ? 'Coordenador Fidelis atualizado com sucesso!'
          : 'Novo Coordenador Fidelis cadastrado com sucesso!'
      );
      setIsModalOpen(false);
      fetchCoordinators();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao processar solicitação.');
    }
  };

  const handleToggleStatus = async (coord: FidelisCoordinator) => {
    const nextStatus = coord.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      const res = await fetch(`/api/fidelis/coordenadores/${coord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setSuccessMsg(
          `Status do coordenador alterado para ${nextStatus === 'ativo' ? 'Ativo' : 'Inativo'}.`
        );
        fetchCoordinators();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const handleDelete = (coord: FidelisCoordinator) => {
    const confirmAction = async () => {
      try {
        const res = await fetch(`/api/fidelis/coordenadores/${coord.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setSuccessMsg('Coordenador Fidelis removido.');
          fetchCoordinators();
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setError('Erro ao remover coordenador.');
        }
      } catch (err) {
        console.error('Erro ao remover:', err);
        setError('Erro ao comunicar com servidor.');
      }
    };

    if (onCustomConfirm) {
      onCustomConfirm(
        `Tem certeza que deseja remover a Coordenação Fidelis de "${coord.nome}"? Esta ação é irreversível.`,
        confirmAction
      );
    } else {
      if (
        window.confirm(
          `Tem certeza que deseja remover a Coordenação Fidelis de "${coord.nome}"?`
        )
      ) {
        confirmAction();
      }
    }
  };

  const handleCopyCredentials = (coord: FidelisCoordinator) => {
    const isCasal = coord.tipo === 'casal';
    const nameStr = isCasal && coord.nomeConjuge ? `${coord.nome} & ${coord.nomeConjuge}` : coord.nome;
    const phoneStr = isCasal && coord.telefoneConjuge ? `${coord.telefone} / ${coord.telefoneConjuge}` : coord.telefone;

    const text = `*Fidelis - Gestão de Coroinhas e Acólitos*\n*Acesso da Coordenação*\n\n*Nome:* ${nameStr}\n*Tipo:* ${
      isCasal ? 'Casal Coordenador' : 'Individual'
    }\n*Função:* ${
      coord.cargo === 'vice_coordenador' ? 'Vice-Coordenador(a)' : 'Coordenador(a)'
    }\n*Paróquia:* ${coord.paroquia}\n*Telefone:* ${phoneStr}\n*Senha de Acesso:* ${
      coord.senha || '123456'
    }\n\n*Acesse pelo link:* ${FIDELIS_URL}`;

    navigator.clipboard.writeText(text);
    setCopiedId(coord.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Filter logic
  const filteredCoordinators = coordinators.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      c.nome.toLowerCase().includes(searchLower) ||
      (c.nomeConjuge && c.nomeConjuge.toLowerCase().includes(searchLower)) ||
      c.telefone.includes(searchTerm) ||
      (c.telefoneConjuge && c.telefoneConjuge.includes(searchTerm)) ||
      c.paroquia.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === 'todos' || c.status === statusFilter;

    const matchesParoquia =
      !paroquiaFilter || c.paroquia === paroquiaFilter;

    return matchesSearch && matchesStatus && matchesParoquia;
  });

  const activeCount = coordinators.filter((c) => c.status === 'ativo').length;
  const uniqueParoquiasCount = new Set(coordinators.map((c) => c.paroquia)).size;

  return (
    <div className="space-y-6">
      {/* Banner / Header informativo */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Sparkles className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Módulo Fidelis Independente
            </span>
            <span className="px-3 py-1 bg-white/10 text-slate-200 border border-white/20 rounded-full text-xs font-semibold">
              Coroinhas & Acólitos
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Fidelis - Coordenação de Coroinhas e Acólitos
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              Gestão de cadastros de coordenadores da pastoral de Coroinhas e Acólitos. Este cadastro é totalmente <strong className="text-amber-300">independente e isolado do MECE</strong> (Ministros Extraordinários da Sagrada Comunhão), garantindo total separação entre os sistemas.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href={FIDELIS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Acessar Sistema Fidelis
            </a>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-md border border-indigo-400/30"
            >
              <Key className="w-4 h-4 text-amber-300" />
              API Unificada (Tudo Junto)
            </button>
            <button
              onClick={fetchCoordinators}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-all border border-white/15"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar Dados
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Coordenadores</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{coordinators.length}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordenadores Ativos</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paróquias Fidelis</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{uniqueParoquiasCount}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* SearchInput */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar nome, tel ou paróquia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos Status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>

          {/* Paroquia Filter */}
          <select
            value={paroquiaFilter}
            onChange={(e) => setParoquiaFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas Paróquias</option>
            {paroquias.map((p) => (
              <option key={p.id} value={p.nome}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Coordenação Fidelis
        </button>
      </div>

      {/* Coordinators Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Carregando coordenações Fidelis...</p>
        </div>
      ) : filteredCoordinators.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-slate-800 font-bold text-base">Nenhum Coordenador Fidelis Encontrado</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchTerm || statusFilter !== 'todos' || paroquiaFilter
              ? 'Tente remover os filtros de busca para visualizar os registros.'
              : 'Clique no botão acima para cadastrar a primeira coordenação do Fidelis (Coroinhas & Acólitos).'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoordinators.map((coord) => (
            <div
              key={coord.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 hover:shadow-md ${
                coord.status === 'ativo' ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-100 text-indigo-800 rounded-xl flex items-center justify-center font-bold text-base uppercase flex-shrink-0">
                    {coord.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {coord.tipo === 'casal' && coord.nomeConjuge
                          ? `${coord.nome} e ${coord.nomeConjuge}`
                          : coord.nome}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        coord.cargo === 'vice_coordenador'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {coord.cargo === 'vice_coordenador' ? 'Vice-Coordenador' : 'Coordenador'}
                      </span>
                      {coord.tipo === 'casal' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          Casal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {coord.paroquia}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                    coord.status === 'ativo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {coord.status === 'ativo' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-500" /> Inativo
                    </>
                  )}
                </span>
              </div>

              {/* Contact & Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-mono font-medium text-slate-800">{coord.telefone}</span>
                  {coord.tipo === 'casal' && coord.telefoneConjuge && (
                    <span className="font-mono font-medium text-slate-500">/ {coord.telefoneConjuge} (Cônjuge)</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Senha de Acesso: <strong className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{coord.senha || '123456'}</strong></span>
                </div>

                {coord.observacoes && (
                  <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] mt-1">
                    "{coord.observacoes}"
                  </p>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyCredentials(coord)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                  title="Copiar dados de acesso"
                >
                  {copiedId === coord.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copiar Acesso
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(coord)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title={coord.status === 'ativo' ? 'Inativar Coordenador' : 'Ativar Coordenador'}
                  >
                    {coord.status === 'ativo' ? (
                      <XCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(coord)}
                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition"
                    title="Editar Coordenador Fidelis"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(coord)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition"
                    title="Remover Coordenador Fidelis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {editingId ? 'Editar Coordenação Fidelis' : 'Cadastrar Coordenação Fidelis'}
                  </h3>
                  <p className="text-xs text-slate-400">Coroinhas & Acólitos (Sistema Fidelis)</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo de Coordenação & Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Coordenação
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'individual' | 'casal' })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="individual">Individual</option>
                    <option value="casal">Casal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Função / Cargo
                  </label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="coordenador">Coordenador(a)</option>
                    <option value="vice_coordenador">Vice-Coordenador(a)</option>
                  </select>
                </div>
              </div>

              {/* Nome & Telefone Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formData.tipo === 'casal' ? 'Nome (Ele / Coordenador)' : 'Nome do Coordenador'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(14) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dados do Cônjuge (Se for Casal) */}
              {formData.tipo === 'casal' && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Dados do Cônjuge (Casal Coordenador)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nome do Cônjuge (Ela)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Maria Silva"
                        value={formData.nomeConjuge}
                        onChange={(e) => setFormData({ ...formData, nomeConjuge: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefone / WhatsApp do Cônjuge
                      </label>
                      <input
                        type="text"
                        placeholder="(14) 99999-9999"
                        value={formData.telefoneConjuge}
                        onChange={(e) => setFormData({ ...formData, telefoneConjuge: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paróquia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Paróquia <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.paroquia}
                    onChange={(e) => setFormData({ ...formData, paroquia: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Selecione uma Paróquia...</option>
                    {paroquias.map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Ou digite o nome da paróquia se não estiver na lista..."
                    value={formData.paroquia}
                    onChange={(e) => setFormData({ ...formData, paroquia: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Senha e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Senha de Acesso Fidelis
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status do Cadastro
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Responsável pela turma da manhã e formação dos acólitos."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Coordenador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Integration Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/30 border border-indigo-400/40 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Integração e Acesso Online - Sistema Fidelis</h3>
                  <p className="text-xs text-slate-300">APIs unificada e exclusiva para escala de missas</p>
                </div>
              </div>
              <button
                onClick={() => setIsApiModalOpen(false)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-xs sm:text-sm text-indigo-950 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-indigo-900">
                  <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" /> Acesso Exclusivo à Escala Online:
                </p>
                Disponibilizamos um endpoint protegido por token exclusivo para que o Sistema Fidelis consulte <strong>apenas a parte da escala de missas</strong> online, sem expor dados de ministros.
              </div>

              {/* Exclusive Schedule URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Acesso Exclusivo à Escala (Apenas Missas + Token)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/fidelis/escala-exclusiva?token=fidelis_exclusivo_2026`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/fidelis/escala-exclusiva?token=fidelis_exclusivo_2026`);
                      setCopiedApi(true);
                      setTimeout(() => setCopiedApi(false), 2000);
                    }}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    {copiedApi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedApi ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Token de acesso embutido: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-600">fidelis_exclusivo_2026</code>.
                </p>
              </div>

              {/* Unified API URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. API Unificada (Coordenação + Missas Tudo Junto)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/fidelis/integracao`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none"
                  />
                  <a
                    href="/api/fidelis/integracao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" /> Testar
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Filtre por paróquia adicionando <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">?paroquia=Nome</code>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
