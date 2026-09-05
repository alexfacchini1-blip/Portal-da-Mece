import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { Heart, User, Phone, MapPin, Calendar, ChevronLeft, Clock, Trash2, Edit2, Users, BookOpen, X, Sparkles, Search, Loader2, CheckCircle2, Plus, Save } from 'lucide-react';
import { toTitleCase, formatPhone, formatCep, fetchAddressByCep } from '../utils';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface ComunhaoViewProps {
  user: any;
  voltar?: () => void;
  isTab?: boolean;
  onCustomConfirm?: (message: string, onConfirm: () => void) => void;
  onAlert?: (titulo: string, mensagem: string) => void;
}

export function ComunhaoView({ user, voltar, isTab = false, onCustomConfirm, onAlert }: ComunhaoViewProps) {
  console.log('ComunhaoView rendered with user:', user);
  if (!user) return <div>Usuário não encontrado.</div>;
  const [comunhaoList, setComunhaoList] = useState<any[]>([]);
  const [approvedMinisters, setApprovedMinisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [loadingCepNovo, setLoadingCepNovo] = useState(false);
  const [cepStatusNovo, setCepStatusNovo] = useState<'success' | 'error' | 'loading' | ''>('');
  const [loadingCepEdit, setLoadingCepEdit] = useState(false);
  const [cepStatusEdit, setCepStatusEdit] = useState<'success' | 'error' | 'loading' | ''>('');
  const [filtroMinistro, setFiltroMinistro] = useState<string | null>(null);

  const stats = useMemo(() => {
    let totalAssistidos = 0;
    const porMinistro: { [nome: string]: { assistidos: number; atendimentos: number } } = {};

    comunhaoList.forEach(item => {
      let count = 0;
      if (item.tipoAtendimento === 'individual') {
        count = 1;
      } else if (item.tipoAtendimento === 'casal') {
        count = 2;
      } else if (item.tipoAtendimento === 'clinica') {
        count = Number(item.quantidadeIdosos) || (item.idosos ? item.idosos.length : 1);
      } else if (item.tipoAtendimento === 'familia') {
        const membersCount = item.familiaMembros ? item.familiaMembros.filter((m: string) => m.trim().length > 0).length : 0;
        count = Math.max(1, membersCount);
      } else {
        count = 1; // Fallback
      }

      totalAssistidos += count;

      const minNome = item.ministro_nome || 'Não Atribuído';
      if (!porMinistro[minNome]) {
        porMinistro[minNome] = { assistidos: 0, atendimentos: 0 };
      }
      porMinistro[minNome].assistidos += count;
      porMinistro[minNome].atendimentos += 1;
    });

    return {
      totalAssistidos,
      totalAtendimentos: comunhaoList.length,
      porMinistro
    };
  }, [comunhaoList]);

  const isCoordenador = user.role === 'admin' || user.role === 'coordenacao' || user.role === 'coordenador' || (user.role && user.role.toLowerCase().includes('coordena'));
  const [subTab, setSubTab] = useState<'cadastrar' | 'listar'>('listar');

  const [novoComunhao, setNovoComunhao] = useState({
    nomeIdoso: '',
    esposoNome: '',
    esposaNome: '',
    cep: '',
    numero: '',
    complemento: '',
    endereco: '',
    bairro: '',
    cidade: 'Bauru',
    uf: 'SP',
    telefone: '',
    responsavel: '',
    telefoneResponsavel: '',
    clinicaNome: '',
    familiaNome: '',
    familiaMembros: ['', '', ''],
    tipoAtendimento: 'individual',
    quantidadeIdosos: 1,
    idosos: [{ nome: '', idade: '' }] as any[],
    ministro_id: ''
  });

  const getMinisterOptions = () => {
    const options: { id: number | string; nome: string }[] = [];
    approvedMinisters.forEach(m => {
      if (m.tipo === 'casal' && (m.nomeConjuge || m.nomeExibicaoConjuge)) {
        // Add only the couple option
        options.push({
          id: Number(m.id) + 0.5,
          nome: `${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`
        });
      } else {
        // Add only the individual option
        options.push({
          id: m.id,
          nome: m.nomeExibicao || m.nome
        });
      }
    });
    return options.sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const handleIdosoChange = (index: number, value: string) => {
    const newIdosos = [...novoComunhao.idosos];
    newIdosos[index] = { nome: toTitleCase(value) };
    setNovoComunhao(prev => ({ ...prev, idosos: newIdosos }));
  };

  const handleQuantidadeIdososChange = (e: ChangeEvent<HTMLInputElement>) => {
    const qtd = parseInt(e.target.value) || 0;
    const newIdosos = Array.from({ length: qtd }, (_, i) => novoComunhao.idosos[i] || { nome: '' });
    setNovoComunhao(prev => ({ ...prev, quantidadeIdosos: qtd, idosos: newIdosos }));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    console.log('comunhaoList updated:', comunhaoList);
  }, [comunhaoList]);

  const fetchData = async () => {
    console.log('ComunhaoView fetchData called, user:', user);
    setLoading(true);
    try {
      if (user.role === 'ministro') {
        console.log('Fetching communions for ministro:', user.id);
        const res = await fetch(`/api/comunhao/${user.id}`);
        const data = await res.json();
        console.log('Communions fetched for ministro:', data);
        setComunhaoList(Array.isArray(data) ? data : []);
      } else {
        // For coordination, fetch all ministers to populate the dropdown
        console.log('Fetching ministers for paroquia:', user.paroquia);
        const resMinisters = await fetch(`/api/admin/ministros?paroquia=${encodeURIComponent(user.paroquia)}`);
        const dataMinisters = await resMinisters.json();
        console.log('Ministers fetched:', dataMinisters);
        setApprovedMinisters(Array.isArray(dataMinisters) ? dataMinisters : []);

        // Also fetch all communions for this parish
        console.log('Fetching communions for paroquia:', user.paroquia);
        const resComunhao = await fetch(`/api/comunhao/paroquia/${encodeURIComponent(user.paroquia)}`);
        if (resComunhao.ok) {
          const dataComunhao = await resComunhao.json();
          console.log('Communions fetched for paroquia:', dataComunhao);
          console.log('Number of communions fetched:', dataComunhao.length);
          setComunhaoList(Array.isArray(dataComunhao) ? dataComunhao : []);
        } else {
          console.error('Failed to fetch communions for paroquia, status:', resComunhao.status);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados de comunhão:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoComunhaoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cep') {
      const formattedCep = formatCep(value);
      setNovoComunhao(prev => ({ ...prev, cep: formattedCep }));

      const cleanDigits = formattedCep.replace(/\D/g, '');
      if (cleanDigits.length === 8) {
        setLoadingCepNovo(true);
        setCepStatusNovo('loading');
        fetchAddressByCep(formattedCep).then(addr => {
          setLoadingCepNovo(false);
          if (addr) {
            setNovoComunhao(prev => ({
              ...prev,
              endereco: addr.logradouro ? toTitleCase(addr.logradouro) : prev.endereco,
              bairro: addr.bairro ? toTitleCase(addr.bairro) : prev.bairro,
              cidade: addr.localidade ? toTitleCase(addr.localidade) : prev.cidade,
              uf: addr.uf ? addr.uf.toUpperCase() : prev.uf,
            }));
            setCepStatusNovo('success');
          } else {
            setCepStatusNovo('error');
          }
        });
      } else {
        setCepStatusNovo('');
      }
      return;
    }

    // Apply capitalization to specific fields
    const fieldsToCapitalize = ['nomeIdoso', 'responsavel', 'clinicaNome', 'endereco', 'complemento', 'bairro', 'cidade', 'esposoNome', 'esposaNome', 'familiaNome'];
    let finalValue = fieldsToCapitalize.includes(name) ? toTitleCase(value) : value;
    
    if (name === 'telefone' || name === 'telefoneResponsavel') {
      finalValue = formatPhone(value);
    }
    
    setNovoComunhao(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleEditCepChange = (value: string) => {
    const formattedCep = formatCep(value);
    setEditingComunhao((prev: any) => ({ ...prev, cep: formattedCep }));
    const cleanDigits = formattedCep.replace(/\D/g, '');
    if (cleanDigits.length === 8) {
      setLoadingCepEdit(true);
      setCepStatusEdit('loading');
      fetchAddressByCep(formattedCep).then(addr => {
        setLoadingCepEdit(false);
        if (addr) {
          setEditingComunhao((prev: any) => ({
            ...prev,
            endereco: addr.logradouro ? toTitleCase(addr.logradouro) : (prev.endereco || ''),
            bairro: addr.bairro ? toTitleCase(addr.bairro) : (prev.bairro || ''),
            cidade: addr.localidade ? toTitleCase(addr.localidade) : (prev.cidade || ''),
            uf: addr.uf ? addr.uf.toUpperCase() : (prev.uf || ''),
          }));
          setCepStatusEdit('success');
        } else {
          setCepStatusEdit('error');
        }
      });
    } else {
      setCepStatusEdit('');
    }
  };

  const handleFamiliaMembroChange = (index: number, value: string) => {
    setNovoComunhao(prev => {
      const newMembros = [...prev.familiaMembros];
      newMembros[index] = toTitleCase(value);
      return { ...prev, familiaMembros: newMembros };
    });
  };

  const handleNovoComunhaoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    let payload = { ...novoComunhao };
    if (novoComunhao.tipoAtendimento === 'casal') {
      payload.nomeIdoso = `${novoComunhao.esposoNome} e ${novoComunhao.esposaNome}`;
    } else if (novoComunhao.tipoAtendimento === 'clinica') {
      payload.nomeIdoso = novoComunhao.clinicaNome;
    } else if (novoComunhao.tipoAtendimento === 'familia') {
      const membros = novoComunhao.familiaMembros.filter(m => m.trim().length > 0).join(', ');
      payload.nomeIdoso = `${novoComunhao.familiaNome}${membros ? ` (${membros})` : ''}`;
    }
    console.log('[DEBUG] Submitting payload:', payload);

    try {
      const response = await fetch('/api/comunhao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          paroquia: user.paroquia
        }),
      });

      if (response.ok) {
        setMessage('Comunhão cadastrada e enviada com sucesso!');
        setCepStatusNovo('');
        setNovoComunhao({
          nomeIdoso: '',
          esposoNome: '',
          esposaNome: '',
          cep: '',
          numero: '',
          complemento: '',
          endereco: '',
          bairro: '',
          cidade: 'Bauru',
          uf: 'SP',
          telefone: '',
          responsavel: '',
          telefoneResponsavel: '',
          clinicaNome: '',
          familiaNome: '',
          familiaMembros: ['', '', ''],
          tipoAtendimento: 'individual',
          quantidadeIdosos: 1,
          idosos: [{ nome: '', idade: '' }] as any[],
          ministro_id: ''
        });
        setSubTab('listar');
        fetchData();
        setTimeout(() => setMessage(''), 6000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao cadastrar comunhão.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  const [editingComunhao, setEditingComunhao] = useState<any | null>(null);

  const handleDelete = (id: number) => {
    const msg = 'Tem certeza que deseja excluir este registro de comunhão?';
    if (onCustomConfirm) {
      onCustomConfirm(msg, async () => {
        try {
          const response = await fetch(`/api/comunhao/${id}`, { method: 'DELETE' });
          if (response.ok) {
            fetchData();
          } else {
            console.error('Erro ao excluir comunhão.');
          }
        } catch (err) {
          console.error('Erro ao conectar com o servidor.');
        }
      });
    }
  };

  const handleEdit = (item: any) => {
    console.log('[DEBUG] Editing item:', item);
    let prepItem = { ...item };
    if (prepItem.tipoAtendimento === 'casal' && (!prepItem.esposoNome || !prepItem.esposaNome)) {
      const parts = (prepItem.nomeIdoso || '').split(/\s+e\s+/);
      prepItem.esposoNome = parts[0] || '';
      prepItem.esposaNome = parts[1] || '';
    }
    if (prepItem.tipoAtendimento === 'familia' && !prepItem.familiaNome) {
      prepItem.familiaNome = prepItem.nomeIdoso || '';
    }
    if (prepItem.telefone) prepItem.telefone = formatPhone(prepItem.telefone);
    if (prepItem.telefoneResponsavel) prepItem.telefoneResponsavel = formatPhone(prepItem.telefoneResponsavel);
    setEditingComunhao(prepItem);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/comunhao/${editingComunhao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingComunhao),
      });
      if (response.ok) {
        setEditingComunhao(null);
        fetchData();
      } else {
        onAlert?.('Erro', 'Erro ao atualizar comunhão.');
      }
    } catch (err) {
      onAlert?.('Erro de Conexão', 'Erro ao conectar com o servidor.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={isTab ? "w-full" : "bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans"}>
      <div className={isTab ? "w-full" : "max-w-4xl mx-auto w-full"}>
        {!isTab && (
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <img
                src="/hostia.jpg"
                alt="Comunhão"
                className="w-8 h-8 object-contain rounded-full shadow-xs"
                referrerPolicy="no-referrer"
              />
              Comunhão
            </h1>
            {voltar && (
              <button
                onClick={voltar}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold shadow-xs">
            {error}
          </div>
        )}

        {isCoordenador && (
          <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-none gap-2">
            <button
              type="button"
              id="subtab-listar"
              onClick={() => setSubTab('listar')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                subTab === 'listar'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              Comunhões Cadastradas
              {comunhaoList.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                  subTab === 'listar' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-600 font-medium'
                }`}>
                  {comunhaoList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              id="subtab-cadastrar"
              onClick={() => setSubTab('cadastrar')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                subTab === 'cadastrar'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Cadastrar Nova Comunhão
            </button>
          </div>
        )}

        {isCoordenador && subTab === 'cadastrar' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Cadastrar Nova Comunhão
            </h2>
            
            <form onSubmit={handleNovoComunhaoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Tipo de Atendimento</label>
                  <select
                    name="tipoAtendimento"
                    value={novoComunhao.tipoAtendimento}
                    onChange={handleNovoComunhaoChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="individual">Individual</option>
                    <option value="casal">Casal</option>
                    <option value="clinica">Clínica de Repouso</option>
                    <option value="familia">Família</option>
                  </select>
                </div>

                {novoComunhao.tipoAtendimento === 'clinica' ? (
                  <>
                    <div className="space-y-2">
                       <label className="block text-sm font-medium text-slate-700">Nome da Clínica</label>
                      <input type="text" name="clinicaNome" value={novoComunhao.clinicaNome} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-sm font-medium text-slate-700">Quantidade de Idosos</label>
                      <input type="number" name="quantidadeIdosos" value={novoComunhao.quantidadeIdosos} onChange={handleQuantidadeIdososChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                    </div>
                    {novoComunhao.idosos.map((idoso, index) => (
                      <div key={index} className="col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <input type="text" placeholder="Nome do Idoso" value={idoso.nome} onChange={(e) => handleIdosoChange(index, e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl" required />
                      </div>
                    ))}
                  </>
                ) : novoComunhao.tipoAtendimento === 'casal' ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Nome do Esposo</label>
                      <input type="text" name="esposoNome" value={novoComunhao.esposoNome || ''} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Nome da Esposa</label>
                      <input type="text" name="esposaNome" value={novoComunhao.esposaNome || ''} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                    </div>
                  </>
                ) : novoComunhao.tipoAtendimento === 'familia' ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Nome da Família</label>
                      <input type="text" name="familiaNome" value={novoComunhao.familiaNome || ''} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ex: Família Silva, Família Santos..." required />
                    </div>
                    {novoComunhao.familiaMembros.map((membro, index) => (
                      <div key={index} className="col-span-2 space-y-1">
                        <label className="block text-sm font-medium text-slate-700 text-slate-400">Membro da Família {index + 1} (Opcional)</label>
                        <input type="text" value={membro} onChange={(e) => handleFamiliaMembroChange(index, e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nome" />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Nome do Idoso/Doente</label>
                    <input type="text" name="nomeIdoso" value={novoComunhao.nomeIdoso} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cep"
                      value={novoComunhao.cep}
                      onChange={handleNovoComunhaoChange}
                      placeholder="17010-000"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      maxLength={9}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {loadingCepNovo ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : cepStatusNovo === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Search className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                  {cepStatusNovo === 'success' && (
                    <p className="text-[11px] font-semibold text-emerald-600">
                      ✓ Endereço localizado! Preencha o número da casa.
                    </p>
                  )}
                  {cepStatusNovo === 'error' && (
                    <p className="text-[11px] font-semibold text-amber-600">
                      CEP não encontrado. Preencha os campos manualmente.
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Endereço (Rua / Avenida)</label>
                    <input type="text" name="endereco" value={novoComunhao.endereco} onChange={handleNovoComunhaoChange} placeholder="Nome da rua ou avenida" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                  </div>
                  <div className="sm:col-span-1 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Número</label>
                    <input
                      type="text"
                      name="numero"
                      value={novoComunhao.numero}
                      onChange={handleNovoComunhaoChange}
                      placeholder="Ex: 18-50, 123"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      value={novoComunhao.complemento}
                      onChange={handleNovoComunhaoChange}
                      placeholder="Ex: Apt 4, Bloco B"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Bairro</label>
                  <input type="text" name="bairro" value={novoComunhao.bairro} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Cidade</label>
                  <input type="text" name="cidade" value={novoComunhao.cidade} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">UF</label>
                  <select
                    name="uf"
                    value={novoComunhao.uf}
                    onChange={handleNovoComunhaoChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    required
                  >
                    <option value="">Selecione</option>
                    {BRAZILIAN_STATES.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Telefone</label>
                  <input type="tel" name="telefone" value={novoComunhao.telefone} onChange={handleNovoComunhaoChange} placeholder="(14) 99999-9999" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Responsável (Opcional)</label>
                  <input type="text" name="responsavel" value={novoComunhao.responsavel} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Telefone do Responsável (Opcional)</label>
                  <input type="tel" name="telefoneResponsavel" value={novoComunhao.telefoneResponsavel} onChange={handleNovoComunhaoChange} placeholder="(14) 99999-9999" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                 <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Ministro Responsável</label>
                  <select name="ministro_id" value={novoComunhao.ministro_id || ''} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required>
                    <option value="">Selecione um ministro</option>
                    {getMinisterOptions().map(opt => <option key={opt.id} value={opt.id}>{opt.nome}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                Enviar para Ministro
              </button>
            </form>
          </div>
        )}

        {(!isCoordenador || subTab === 'listar') && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {user.role === 'ministro' ? 'Minhas Comunhões' : 'Comunhões Cadastradas'}
              </h2>

          {comunhaoList.length > 0 && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Balão 1: Total de Assistidos */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                    <Heart className="w-6 h-6 fill-red-100" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Assistidos</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{stats.totalAssistidos}</span>
                      <span className="text-xs text-slate-500 font-medium">Idosos/Doentes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantidade por Ministro (sempre visível ou foca nos ministros correspondentes) */}
              {Object.keys(stats.porMinistro).length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Distribuição por Ministro
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200/50 px-2.5 py-1 rounded-md">
                      Carga de Atendimento
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(Object.entries(stats.porMinistro) as [string, { assistidos: number; atendimentos: number }][])
                      .sort((a, b) => b[1].assistidos - a[1].assistidos)
                      .map(([minNome, counts]) => {
                        const isSelected = filtroMinistro === minNome;
                        return (
                          <button
                            type="button"
                            key={minNome}
                            onClick={() => setFiltroMinistro(isSelected ? null : minNome)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                : 'bg-white border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-sm'
                            }`}
                            title={`Clique para ver apenas os atendimentos de ${minNome}`}
                          >
                            <div className="truncate pr-2">
                              <p className={`text-xs font-bold truncate transition-colors ${
                                isSelected ? 'text-blue-700 font-extrabold' : 'text-slate-700 group-hover:text-blue-600'
                              }`} title={minNome}>
                                {minNome}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {counts.atendimentos} {counts.atendimentos === 1 ? 'visita' : 'visitas'}
                              </p>
                            </div>
                            <div className={`flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black min-w-[32px] border transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                            }`} title={`${counts.assistidos} idoso(s)`}>
                              {counts.assistidos}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Banner de Filtro Ativo com Botão para Voltar/Ver Todos */}
          {filtroMinistro && (
            <div className="mb-6 p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      Filtro Ativo
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Exibindo assistidos de:
                    </span>
                  </div>
                  <p className="text-base font-extrabold text-blue-950 mt-0.5">
                    {filtroMinistro}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiltroMinistro(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-blue-600" />
                Voltar (Ver Todos os Ministros)
              </button>
            </div>
          )}

          {comunhaoList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <img
                src="/hostia.jpg"
                alt="Comunhão"
                className="w-12 h-12 object-contain rounded-full opacity-40 mx-auto mb-4 grayscale"
                referrerPolicy="no-referrer"
              />
              <p className="text-slate-500 font-medium">Nenhum registro de comunhão encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comunhaoList
                .filter((item) => !filtroMinistro || (item.ministro_nome || 'Não Atribuído') === filtroMinistro)
                .map((item) => (
                <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 group-hover:bg-blue-50 transition-colors">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    {isCoordenador && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                    {/* Removed age display */}
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-1">{item.tipoAtendimento === 'clinica' ? (item.clinicaNome || item.nomeIdoso || 'Clínica de Repouso') : item.tipoAtendimento === 'familia' ? (item.familiaNome || item.nomeIdoso || 'Família') : item.nomeIdoso}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                      {item.tipoAtendimento === 'individual' ? 'Individual' : item.tipoAtendimento === 'casal' ? 'Casal' : item.tipoAtendimento === 'clinica' ? 'Clínica de Repouso' : item.tipoAtendimento === 'familia' ? 'Família' : 'Outro'}
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    {(item.tipoAtendimento === 'clinica' || item.tipoAtendimento === 'familia') && (
                      <div className="mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {item.tipoAtendimento === 'clinica' ? 'Idosos' : 'Membros da Família'}
                        </p>
                        <ul className="text-sm text-slate-700 list-disc list-inside">
                          {item.tipoAtendimento === 'clinica' ? (
                            item.idosos && item.idosos.length > 0 ? (
                              item.idosos.map((id: any, i: number) => <li key={i}>{id.nome}{id.idade ? ` (${id.idade} anos)` : ''}</li>)
                            ) : (
                              <li>{item.nomeIdoso || 'Nenhum idoso cadastrado'}</li>
                            )
                          ) : (
                            item.familiaMembros && item.familiaMembros.filter(m => m && m.trim().length > 0).length > 0 ? (
                              item.familiaMembros.filter(m => m && m.trim().length > 0).map((m: string, i: number) => <li key={i}>{m}</li>)
                            ) : (
                              <li>{item.familiaNome || 'Nenhum membro cadastrado'}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {item.endereco}
                        {item.numero && !item.endereco?.includes(item.numero) ? `, Nº ${item.numero}` : ''}
                        {item.complemento ? ` (${item.complemento})` : ''}
                        {item.bairro ? `, ${item.bairro}` : ''}
                        {item.cidade ? `, ${item.cidade}` : ''}
                        {item.uf ? ` - ${item.uf}` : ''}
                        {item.cep ? ` (CEP: ${item.cep})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{item.telefone}</span>
                    </div>
                    {(item.responsavel || item.telefoneResponsavel) && (
                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                        {item.responsavel && <p className="text-sm font-bold text-slate-700">{item.responsavel}</p>}
                        {item.telefoneResponsavel && <p className="text-xs text-slate-500">{item.telefoneResponsavel}</p>}
                      </div>
                    )}
                    {item.clinicaRepouso && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clínica</p>
                        <p className="text-sm text-slate-700">{item.clinicaRepouso}</p>
                      </div>
                    )}
                    {user.role !== 'ministro' && (
                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ministro Atribuído</p>
                        <p className="text-sm font-bold text-blue-600">{item.ministro_nome || 'Desconhecido'}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
        {editingComunhao && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-4xl my-auto shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Editar Comunhão</h2>
                    <p className="text-xs text-slate-500 font-medium">Atualize os dados do atendimento, assistidos e endereço</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingComunhao(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
                {/* 2 Colunas Horizontais */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-1 pb-2 flex-1">
                  {/* Coluna Esquerda: Assistidos / Idosos (5 de 12 colunas) */}
                  <div className="md:col-span-5 space-y-4 flex flex-col">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 flex flex-col">
                      {/* Tipo Casal */}
                      {editingComunhao.tipoAtendimento === 'casal' ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800">Atendimento Casal</span>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Nome do Esposo</label>
                            <input
                              type="text"
                              value={editingComunhao.esposoNome || ''}
                              onChange={e => {
                                const val = toTitleCase(e.target.value);
                                setEditingComunhao({
                                  ...editingComunhao,
                                  esposoNome: val,
                                  nomeIdoso: `${val} e ${(editingComunhao.esposaNome || '')}`
                                });
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Nome do Esposo"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Nome da Esposa</label>
                            <input
                              type="text"
                              value={editingComunhao.esposaNome || ''}
                              onChange={e => {
                                const val = toTitleCase(e.target.value);
                                setEditingComunhao({
                                  ...editingComunhao,
                                  esposaNome: val,
                                  nomeIdoso: `${(editingComunhao.esposoNome || '')} e ${val}`
                                });
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Nome da Esposa"
                              required
                            />
                          </div>
                        </div>
                      ) : editingComunhao.tipoAtendimento === 'clinica' ? (
                        <div className="space-y-4 flex flex-col flex-1">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Nome da Clínica de Repouso</label>
                            <input
                              type="text"
                              value={editingComunhao.clinicaNome || editingComunhao.nomeIdoso || ''}
                              onChange={e => {
                                const val = toTitleCase(e.target.value);
                                setEditingComunhao({
                                  ...editingComunhao,
                                  clinicaNome: val,
                                  nomeIdoso: val
                                });
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Ex: Lar São Vicente"
                              required
                            />
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200 flex-1 flex flex-col">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                Idosos Atendidos ({editingComunhao.idosos?.length || 0})
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextIdosos = [...(editingComunhao.idosos || []), { nome: '' }];
                                  setEditingComunhao({
                                    ...editingComunhao,
                                    idosos: nextIdosos,
                                    quantidadeIdosos: nextIdosos.length
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-extrabold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Idoso
                              </button>
                            </div>

                            <div className="space-y-2 flex-1 max-h-72 overflow-y-auto pr-1">
                              {editingComunhao.idosos && editingComunhao.idosos.length > 0 ? (
                                editingComunhao.idosos.map((idoso: any, idx: number) => (
                                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                                    <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}º</span>
                                    <input
                                      type="text"
                                      value={idoso.nome}
                                      placeholder={`Nome do ${idx + 1}º idoso`}
                                      onChange={(e) => {
                                        const nextIdosos = [...editingComunhao.idosos];
                                        nextIdosos[idx] = { ...idoso, nome: toTitleCase(e.target.value) };
                                        setEditingComunhao({ ...editingComunhao, idosos: nextIdosos });
                                      }}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextIdosos = editingComunhao.idosos.filter((_: any, i: number) => i !== idx);
                                        setEditingComunhao({
                                          ...editingComunhao,
                                          idosos: nextIdosos,
                                          quantidadeIdosos: nextIdosos.length
                                        });
                                      }}
                                      className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                      title="Remover este idoso"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                                  Nenhum idoso listado. Clique em "+ Adicionar Idoso" acima.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : editingComunhao.tipoAtendimento === 'familia' ? (
                        <div className="space-y-4 flex flex-col flex-1">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Nome da Família</label>
                            <input
                              type="text"
                              value={editingComunhao.familiaNome || editingComunhao.nomeIdoso || ''}
                              onChange={e => {
                                const val = toTitleCase(e.target.value);
                                setEditingComunhao({
                                  ...editingComunhao,
                                  familiaNome: val,
                                  nomeIdoso: val
                                });
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Ex: Família Silva"
                              required
                            />
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200 flex-1 flex flex-col">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                Membros da Família
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMembros = [...(editingComunhao.familiaMembros || []), ''];
                                  setEditingComunhao({
                                    ...editingComunhao,
                                    familiaMembros: nextMembros
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-extrabold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Membro
                              </button>
                            </div>

                            <div className="space-y-2 flex-1 max-h-72 overflow-y-auto pr-1">
                              {editingComunhao.familiaMembros && editingComunhao.familiaMembros.length > 0 ? (
                                editingComunhao.familiaMembros.map((membro: string, idx: number) => (
                                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                                    <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}º</span>
                                    <input
                                      type="text"
                                      value={membro}
                                      placeholder={`Nome do ${idx + 1}º membro`}
                                      onChange={(e) => {
                                        const nextMembros = [...editingComunhao.familiaMembros];
                                        nextMembros[idx] = toTitleCase(e.target.value);
                                        setEditingComunhao({ ...editingComunhao, familiaMembros: nextMembros });
                                      }}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextMembros = editingComunhao.familiaMembros.filter((_: any, i: number) => i !== idx);
                                        setEditingComunhao({ ...editingComunhao, familiaMembros: nextMembros });
                                      }}
                                      className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                      title="Remover este membro"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                                  Nenhum membro listado. Clique em "+ Adicionar Membro" acima.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800">Atendimento Individual</span>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Nome do Idoso / Doente</label>
                            <input
                              type="text"
                              value={editingComunhao.nomeIdoso || ''}
                              onChange={e => setEditingComunhao({...editingComunhao, nomeIdoso: toTitleCase(e.target.value)})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Nome completo do assistido"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna Direita: Endereço, Contatos e Ministro (7 de 12 colunas) */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Bloco Endereço */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">Endereço & Localização</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">CEP</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editingComunhao.cep || ''}
                              onChange={e => handleEditCepChange(e.target.value)}
                              className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="17010-000"
                              maxLength={9}
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                              {loadingCepEdit ? (
                                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              ) : cepStatusEdit === 'success' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Rua / Avenida</label>
                          <input
                            type="text"
                            value={editingComunhao.endereco || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, endereco: toTitleCase(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Nome da rua ou avenida"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Número</label>
                          <input
                            type="text"
                            value={editingComunhao.numero || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, numero: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Ex: 18-50, 123"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Complemento</label>
                          <input
                            type="text"
                            value={editingComunhao.complemento || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, complemento: toTitleCase(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Ex: Apt 4, Bloco B"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Bairro</label>
                          <input
                            type="text"
                            value={editingComunhao.bairro || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, bairro: toTitleCase(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Bairro"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Cidade</label>
                          <input
                            type="text"
                            value={editingComunhao.cidade || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, cidade: toTitleCase(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Cidade"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">UF</label>
                          <select
                            value={editingComunhao.uf || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, uf: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                          >
                            <option value="">UF</option>
                            {BRAZILIAN_STATES.map(uf => (
                              <option key={uf} value={uf}>{uf}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bloco Contatos e Ministro */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">Contatos & Ministro</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Telefone do Local</label>
                          <input
                            type="tel"
                            value={editingComunhao.telefone || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, telefone: formatPhone(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="(14) 99999-9999"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Responsável</label>
                          <input
                            type="text"
                            value={editingComunhao.responsavel || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, responsavel: toTitleCase(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Ex: Cuidador..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Tel. Responsável</label>
                          <input
                            type="tel"
                            value={editingComunhao.telefoneResponsavel || ''}
                            onChange={e => setEditingComunhao({...editingComunhao, telefoneResponsavel: formatPhone(e.target.value)})}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="(14) 99999-9999"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          Ministro Responsável pelo Atendimento
                        </label>
                        <select 
                          value={editingComunhao.ministro_id || ''} 
                          onChange={e => setEditingComunhao({...editingComunhao, ministro_id: Number(e.target.value)})} 
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="">Selecione um ministro</option>
                          {getMinisterOptions().map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações do Rodapé Fixo */}
                <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingComunhao(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
