import { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { Heart, User, Phone, MapPin, Calendar, ChevronLeft, Clock, Trash2, Edit2, Users } from 'lucide-react';
import { toTitleCase } from '../utils';

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
    
    // Apply capitalization to specific fields
    const fieldsToCapitalize = ['nomeIdoso', 'responsavel', 'clinicaNome', 'endereco', 'bairro', 'cidade', 'esposoNome', 'esposaNome', 'familiaNome'];
    const finalValue = fieldsToCapitalize.includes(name) ? toTitleCase(value) : value;
    
    setNovoComunhao(prev => ({ ...prev, [name]: finalValue }));
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
        setNovoComunhao({
          nomeIdoso: '',
          esposoNome: '',
          esposaNome: '',
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
              <Heart className="w-6 h-6 text-red-500" />
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
                    <div className="col-span-2 space-y-2">
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
                  <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Nome do Idoso/Doente</label>
                    <input type="text" name="nomeIdoso" value={novoComunhao.nomeIdoso} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Endereço</label>
                  <input type="text" name="endereco" value={novoComunhao.endereco} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
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
                  <input type="tel" name="telefone" value={novoComunhao.telefone} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Responsável (Opcional)</label>
                  <input type="text" name="responsavel" value={novoComunhao.responsavel} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Telefone do Responsável (Opcional)</label>
                  <input type="tel" name="telefoneResponsavel" value={novoComunhao.telefoneResponsavel} onChange={handleNovoComunhaoChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
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
                      .map(([minNome, counts]) => (
                        <div key={minNome} className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between group hover:border-blue-200 transition-colors">
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors" title={minNome}>
                              {minNome}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {counts.atendimentos} {counts.atendimentos === 1 ? 'visita' : 'visitas'}
                            </p>
                          </div>
                          <div className="flex items-center justify-center bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 text-xs font-black min-w-[32px]" title={`${counts.assistidos} idoso(s)`}>
                            {counts.assistidos}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {comunhaoList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum registro de comunhão encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comunhaoList.map((item) => (
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
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{item.endereco}, {item.bairro}, {item.cidade} - {item.uf}</span>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
              <h2 className="text-xl font-bold mb-4">Editar Comunhão</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                {editingComunhao.tipoAtendimento === 'casal' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Nome do Esposo</label>
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        placeholder="Nome do Esposo"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Nome da Esposa</label>
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        placeholder="Nome da Esposa"
                        required
                      />
                    </div>
                  </div>
                ) : editingComunhao.tipoAtendimento === 'clinica' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Nome da Clínica</label>
                      <input type="text" value={editingComunhao.clinicaNome || editingComunhao.nomeIdoso || ''} onChange={e => {
                        const val = toTitleCase(e.target.value);
                        setEditingComunhao({
                          ...editingComunhao,
                          clinicaNome: val,
                          nomeIdoso: val
                        });
                      }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nome da Clínica" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500">Idosos</label>
                      {editingComunhao.idosos && editingComunhao.idosos.map((idoso: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" value={idoso.nome} onChange={(e) => {
                            const nextIdosos = [...editingComunhao.idosos];
                            nextIdosos[idx] = { ...idoso, nome: toTitleCase(e.target.value) };
                            setEditingComunhao({...editingComunhao, idosos: nextIdosos});
                          }} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded" />
                          <button type="button" onClick={() => {
                            setEditingComunhao({...editingComunhao, idosos: editingComunhao.idosos.filter((_: any, i: number) => i !== idx)});
                          }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : editingComunhao.tipoAtendimento === 'familia' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Nome da Família</label>
                      <input type="text" value={editingComunhao.familiaNome || editingComunhao.nomeIdoso || ''} onChange={e => {
                        const val = toTitleCase(e.target.value);
                        setEditingComunhao({
                          ...editingComunhao,
                          familiaNome: val,
                          nomeIdoso: val
                        });
                      }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nome da Família" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-slate-500">Membros</label>
                       {editingComunhao.familiaMembros && editingComunhao.familiaMembros.filter((m: string) => m && m.trim().length > 0).map((membro: string, idx: number) => (
                         <div key={idx} className="flex gap-2 items-center">
                           <input type="text" value={membro} onChange={(e) => {
                             const nextMembros = [...editingComunhao.familiaMembros];
                             nextMembros[idx] = toTitleCase(e.target.value);
                             setEditingComunhao({...editingComunhao, familiaMembros: nextMembros});
                           }} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded" />
                           <button type="button" onClick={() => {
                             setEditingComunhao({...editingComunhao, familiaMembros: editingComunhao.familiaMembros.filter((_: any, i: number) => i !== idx)});
                           }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Nome do Idoso/Doente</label>
                    <input type="text" value={editingComunhao.nomeIdoso || ''} onChange={e => setEditingComunhao({...editingComunhao, nomeIdoso: toTitleCase(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Nome do Idoso" required />
                  </div>
                )}
                <input type="text" value={editingComunhao.endereco || ''} onChange={e => setEditingComunhao({...editingComunhao, endereco: toTitleCase(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Endereço" />
                <input type="text" value={editingComunhao.bairro || ''} onChange={e => setEditingComunhao({...editingComunhao, bairro: toTitleCase(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Bairro" />
                <input type="text" value={editingComunhao.cidade || ''} onChange={e => setEditingComunhao({...editingComunhao, cidade: toTitleCase(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Cidade" />
                <select
                  value={editingComunhao.uf || ''}
                  onChange={e => setEditingComunhao({...editingComunhao, uf: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="">Selecione UF</option>
                  {BRAZILIAN_STATES.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
                <input type="tel" value={editingComunhao.telefone || ''} onChange={e => setEditingComunhao({...editingComunhao, telefone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Telefone" />
                <input type="text" value={editingComunhao.responsavel || ''} onChange={e => setEditingComunhao({...editingComunhao, responsavel: toTitleCase(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Responsável (Opcional)" />
                <input type="tel" value={editingComunhao.telefoneResponsavel || ''} onChange={e => setEditingComunhao({...editingComunhao, telefoneResponsavel: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Telefone do Responsável (Opcional)" />
                <select 
                  value={editingComunhao.ministro_id || ''} 
                  onChange={e => setEditingComunhao({...editingComunhao, ministro_id: Number(e.target.value)})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Selecione um ministro</option>
                  {getMinisterOptions().map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditingComunhao(null)} className="px-4 py-2 bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
