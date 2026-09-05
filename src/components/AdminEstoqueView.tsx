import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, RefreshCw, Search, ArrowUpCircle, ArrowDownCircle, History, X, Info, AlertTriangle, Edit2, Save } from 'lucide-react';
import { EstoqueItem, EstoqueMovimentacao } from '../types';

const getMinistroDisplayName = (m: any) => {
  if (!m) return "";
  const isCouple = m.tipo === "casal" || !!m.nomeConjuge || !!m.nomeExibicaoConjuge;
  if (isCouple) {
    const p1 = m.nomeExibicao || m.nome || "";
    const p2 = m.nomeExibicaoConjuge || m.nomeConjuge || "";
    if (p1 && p2) {
      return `${p1} e ${p2}`;
    }
    return p1 || p2;
  }
  return m.nomeExibicao || m.nome || "";
};

interface AdminEstoqueViewProps {
  user: any;
  onCustomConfirm: (message: string, onConfirm: () => void) => void;
}

export function AdminEstoqueView({ user, onCustomConfirm }: AdminEstoqueViewProps) {
  const [items, setItems] = useState<EstoqueItem[]>([]);
  const [paroquias, setParoquias] = useState<any[]>([]);
  const [ministros, setMinistros] = useState<any[]>([]);
  const [movements, setMovements] = useState<EstoqueMovimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [activeSubTab, setActiveSubTab] = useState<'estoque' | 'historico'>('estoque');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParoquia, setFilterParoquia] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState<string | null>(null); // itemId
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  
  const [newItem, setNewItem] = useState({
    item: '',
    quantidadeEmbalagens: 0,
    unidadesPorEmbalagem: 1,
    tipoEmbalagem: 'Caixa',
    unidadeMedida: 'unidades',
    paroquia: '',
    nivelMinimo: 2,
    nivelMinimoTipo: 'embalagem' as 'embalagem' | 'unidade'
  });

  const [newMovement, setNewMovement] = useState({
    quantidade: 0,
    isEmbalagem: true, // Se true, a quantidade refere-se a caixas/pacotes
    observacao: '',
    dataMissa: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
    horarioMissa: '',
    ministroResponsavel: ''
  });

  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [editingThresholdItem, setEditingThresholdItem] = useState<{id: string, value: number, tipo: 'embalagem' | 'unidade'} | null>(null);
  const [editingItemDetails, setEditingItemDetails] = useState<EstoqueItem | null>(null);

  const isGlobalAdmin = user.role === 'admin';

  const isLowStock = (item: EstoqueItem) => {
    const tipo = item.nivelMinimoTipo || 'embalagem';
    const unidadesPorEmb = item.unidadesPorEmbalagem || 1;
    const qtdEmb = item.quantidadeEmbalagens ?? (item.quantidade / unidadesPorEmb);
    const current = tipo === 'unidade' ? (item.quantidade || 0) : qtdEmb;
    
    const threshold = item.nivelMinimo ?? (tipo === 'unidade' ? 100 : 2);
    return current <= threshold;
  };

  const saveThresholdChanges = async () => {
    if (!editingThresholdItem) return;
    const { id, value, tipo } = editingThresholdItem;
    
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivelMinimo: value, nivelMinimoTipo: tipo })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === id ? updated : i));
        setEditingThresholdItem(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar limite:', err);
    }
  };

  const saveItemDetailsChanges = async () => {
    if (!editingItemDetails) return;
    try {
      const res = await fetch(`/api/estoque/${editingItemDetails.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item: editingItemDetails.item,
          unidadesPorEmbalagem: editingItemDetails.unidadesPorEmbalagem,
          tipoEmbalagem: editingItemDetails.tipoEmbalagem,
          unidadeMedida: editingItemDetails.unidadeMedida
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        setEditingItemDetails(null);
        setMessage('Configuração atualizada com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError('Erro ao atualizar configuração do item.');
    }
  };

  const updateThreshold = async (id: string, value: number, tipo?: 'embalagem' | 'unidade') => {
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivelMinimo: value, nivelMinimoTipo: tipo })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === id ? updated : i));
        setEditingThreshold(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar limite:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const paroquiaQuery = user.paroquia ? `?paroquia=${encodeURIComponent(user.paroquia)}` : '';
      const queryParams = !isGlobalAdmin ? paroquiaQuery : '';
      
      const responses = await Promise.all([
        fetch(`/api/estoque${queryParams}`),
        fetch('/api/paroquias'),
        fetch(`/api/estoque/movimentacoes${queryParams}`),
        fetch(`/api/ministros${queryParams}`)
      ]);
      
      // Check if all responses are OK
      for (const res of responses) {
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Erro na requisição ${res.url}: ${res.status} ${errorText}`);
          throw new Error(`Erro ${res.status} ao carregar dados de ${res.url}`);
        }
      }

      const [estoqueRes, paroquiasRes, movementsRes, ministrosRes] = responses;
      
      const estoqueData = await estoqueRes.json().catch(() => ({ error: 'Formato inválido em estoque' }));
      const paroquiasData = await paroquiasRes.json().catch(() => ({ error: 'Formato inválido em paróquias' }));
      const movementsData = await movementsRes.json().catch(() => ({ error: 'Formato inválido em movimentações' }));
      const ministrosData = await ministrosRes.json().catch(() => ({ error: 'Formato inválido em ministros' }));

      if (estoqueData.error) throw new Error(estoqueData.error);
      if (paroquiasData.error) throw new Error(paroquiasData.error);
      if (movementsData.error) throw new Error(movementsData.error);
      if (ministrosData.error) throw new Error(ministrosData.error);
      
      const sortedMovements = Array.isArray(movementsData) 
        ? [...movementsData].sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        : [];
      
      setItems(Array.isArray(estoqueData) ? estoqueData : []);
      setParoquias(Array.isArray(paroquiasData) ? paroquiasData : []);
      setMovements(sortedMovements);
      setMinistros(Array.isArray(ministrosData) ? ministrosData : []);
      
      if (!isGlobalAdmin && user.paroquia) {
        setFilterParoquia(user.paroquia);
        setNewItem(prev => ({ ...prev, paroquia: user.paroquia }));
      } else if (Array.isArray(paroquiasData) && paroquiasData.length > 0 && !newItem.paroquia) {
        setNewItem(prev => ({ ...prev, paroquia: paroquiasData[0].nome }));
      }
    } catch (err: any) {
      console.error('Erro detalhado ao buscar dados do estoque:', err);
      setError(`Erro ao carregar dados: ${err.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const parishToSave = isGlobalAdmin ? newItem.paroquia : user.paroquia;
    if (!newItem.item || !parishToSave) {
      setError('Preencha o nome do item e a paróquia.');
      return;
    }

    // Calcular quantidade total em unidades
    const totalUnidades = newItem.quantidadeEmbalagens * newItem.unidadesPorEmbalagem;

    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newItem, 
          quantidade: totalUnidades,
          paroquia: parishToSave, 
          entradas: totalUnidades, 
          saidas: 0 
        })
      });
      
      if (res.ok) {
        const saved = await res.json();
        setItems(prev => [...prev, saved]);
        setMessage('Item adicionado com sucesso!');
        setShowAddForm(false);
        setNewItem({
          item: '',
          quantidadeEmbalagens: 0,
          unidadesPorEmbalagem: 1,
          tipoEmbalagem: 'Caixa',
          unidadeMedida: 'unidades',
          paroquia: isGlobalAdmin ? (paroquias[0]?.nome || '') : user.paroquia,
          nivelMinimo: 2,
          nivelMinimoTipo: 'embalagem'
        });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError('Erro ao salvar item.');
    }
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovementForm || newMovement.quantidade <= 0) return;

    const item = items.find(i => i.id === showMovementForm);
    if (!item) return;

    // Se for por embalagem, multiplica pela quantidade por embalagem do item
    const unitsToMove = newMovement.isEmbalagem 
      ? newMovement.quantidade * item.unidadesPorEmbalagem 
      : newMovement.quantidade;

    try {
      const res = await fetch('/api/estoque/movimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: showMovementForm,
          tipo: movementType,
          quantidade: unitsToMove,
          isEmbalagem: newMovement.isEmbalagem,
          quantidadeOriginal: newMovement.quantidade,
          usuario: user.loggedInName || user.nome,
          paroquia: item.paroquia,
          observacao: newMovement.observacao,
          dataMissa: movementType === 'saida' ? newMovement.dataMissa : undefined,
          horarioMissa: movementType === 'saida' ? newMovement.horarioMissa : undefined,
          ministroResponsavel: movementType === 'saida' ? newMovement.ministroResponsavel : undefined
        })
      });
      
      if (res.ok) {
        const { item: updatedItem, movimentacao } = await res.json();
        setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        setMovements(prev => [movimentacao, ...prev]);
        setMessage(`${movementType === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        setShowMovementForm(null);
        setNewMovement({ 
          quantidade: 0, 
          isEmbalagem: movementType === 'entrada', 
          observacao: '',
          dataMissa: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
          horarioMissa: '',
          ministroResponsavel: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(`Erro: ${errorData.error || 'Erro ao registrar movimentação.'}`);
      }
    } catch (err) {
      setError('Erro de conexão ao registrar movimentação.');
    }
  };

  const handleDeleteItem = (id: string) => {
    onCustomConfirm('Deseja realmente excluir este item do estoque?', async () => {
      try {
        const res = await fetch(`/api/estoque/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setItems(prev => prev.filter(i => i.id !== id));
          setMovements(prev => prev.filter(m => m.itemId !== id));
          setMessage('Item excluído com sucesso.');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (err) {
        setError('Erro ao excluir item.');
      }
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParoquia = !filterParoquia || item.paroquia === filterParoquia;
    return matchesSearch && matchesParoquia;
  });

  const isCoordenador = user.role === 'admin' || user.role === 'coordenacao' || user.role === 'coordenador' || (user.role && user.role.toLowerCase().includes('coordena'));
  const isMinistro = user.role === 'ministro';
  if (!isCoordenador && !isMinistro) return <div className="p-8 text-center text-red-600 font-bold">Acesso negado.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('estoque')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'estoque' ? 'border-liturgy-600 text-liturgy-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Estoque Atual
        </button>
        <button
          onClick={() => setActiveSubTab('historico')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'historico' ? 'border-liturgy-600 text-liturgy-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Histórico de Movimentação
        </button>
      </div>

      {activeSubTab === 'estoque' ? (
        <>
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-liturgy-600" />
                Controle de Estoque
              </h3>
              <p className="text-slate-500 text-sm">{isGlobalAdmin ? 'Gerencie o estoque de todas as paróquias.' : (isMinistro ? 'Consulte o estoque e registre retiradas.' : `Estoque da ${user.paroquia}.`)}</p>
            </div>
            {isCoordenador && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-liturgy-600 text-slate-900 rounded-xl font-bold text-sm hover:bg-liturgy-700 transition-all shadow-sm"
              >
                {showAddForm ? 'Cancelar' : <><Plus className="w-4 h-4" /> Novo Item</>}
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {message && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95 duration-200">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nome do Item</label>
                  <input
                    type="text"
                    placeholder="Ex: Hóstia Pequena..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-liturgy-500/20 transition-all font-bold"
                    value={newItem.item}
                    onChange={e => setNewItem({ ...newItem, item: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 truncate block">Unid/Embalagem</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-liturgy-500/20 transition-all"
                      value={newItem.unidadesPorEmbalagem || ''}
                      onChange={e => setNewItem({ ...newItem, unidadesPorEmbalagem: Number(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 truncate block">Qtd {newItem.tipoEmbalagem}s</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-liturgy-500/20 transition-all"
                      placeholder="0"
                      value={newItem.quantidadeEmbalagens || ''}
                      onChange={e => setNewItem({ ...newItem, quantidadeEmbalagens: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 truncate block">Total Unid.</label>
                    <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-black flex items-center justify-center">
                      {(newItem.quantidadeEmbalagens || 0) * (newItem.unidadesPorEmbalagem || 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 truncate block">Tipo Emb.</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-liturgy-500/20 transition-all"
                      value={newItem.tipoEmbalagem}
                      onChange={e => setNewItem({ ...newItem, tipoEmbalagem: e.target.value })}
                    >
                      <option value="Caixa">Caixa</option>
                      <option value="Pacote">Pacote</option>
                      <option value="Frasco">Frasco</option>
                      <option value="Garrafa">Garrafa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 truncate block">Alerta Nível</label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <input
                        type="number"
                        className="w-full px-2 py-2 text-sm font-black outline-none bg-transparent"
                        value={newItem.nivelMinimo}
                        onChange={e => setNewItem({ ...newItem, nivelMinimo: Number(e.target.value) })}
                        min="0"
                        required
                      />
                      <select
                        className="bg-slate-100 px-1 border-l text-[9px] font-black uppercase outline-none"
                        value={newItem.nivelMinimoTipo}
                        onChange={e => setNewItem({ ...newItem, nivelMinimoTipo: e.target.value as 'embalagem' | 'unidade' })}
                      >
                        <option value="unidade">Un.</option>
                        <option value="embalagem">Em.</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isGlobalAdmin && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Paróquia Responsável</label>
                      <select
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                        value={newItem.paroquia}
                        onChange={e => setNewItem({ ...newItem, paroquia: e.target.value })}
                      >
                        {paroquias.map(p => (
                          <option key={p.id} value={p.nome}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl text-sm hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]">
                    ADICIONAR AO ESTOQUE
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar item no estoque..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {isGlobalAdmin && (
              <div className="w-full md:w-64">
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                  value={filterParoquia}
                  onChange={e => setFilterParoquia(e.target.value)}
                >
                  <option value="">Todas as Paróquias</option>
                  {paroquias.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">Item</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Unid/Emb</th>
                    {isGlobalAdmin && <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Paróquia</th>}
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Emb. Atuais</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-l border-slate-100">Alerta de Estoque</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center text-sm font-black">Total (Unid.)</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum item em estoque.</td></tr>
                  ) : (
                    filteredItems.map(item => {
                      const embalagensAtuais = Number(item.quantidade / (item.unidadesPorEmbalagem || 1)).toFixed(1);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${isLowStock(item) ? 'bg-red-50/20' : ''}`}>
                          <td className="px-5 py-4 pl-6">
                            {editingItemDetails?.id === item.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                  value={editingItemDetails.item}
                                  onChange={e => setEditingItemDetails({ ...editingItemDetails, item: e.target.value })}
                                />
                                <div className="flex gap-1.5">
                                  <button onClick={saveItemDetailsChanges} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"><Save className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingItemDetails(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="group flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isLowStock(item) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <p className="font-bold text-slate-800 text-sm">{item.item || 'Item sem nome'}</p>
                                {isCoordenador && (
                                  <button 
                                    onClick={() => setEditingItemDetails(item)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-liturgy-600 transition-all"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {editingItemDetails?.id === item.id ? (
                              <div className="flex flex-col gap-1.5 items-center">
                                <div className="flex border rounded overflow-hidden">
                                  <input
                                    type="number"
                                    className="w-16 px-1 py-0.5 text-xs text-center border-r"
                                    value={editingItemDetails.unidadesPorEmbalagem}
                                    onChange={e => setEditingItemDetails({ ...editingItemDetails, unidadesPorEmbalagem: Number(e.target.value) })}
                                  />
                                  <select 
                                    className="text-[10px] px-1 bg-slate-50"
                                    value={editingItemDetails.tipoEmbalagem}
                                    onChange={e => setEditingItemDetails({ ...editingItemDetails, tipoEmbalagem: e.target.value })}
                                  >
                                    <option value="Caixa">Caixa</option>
                                    <option value="Pacote">Pacote</option>
                                    <option value="Frasco">Frasco</option>
                                    <option value="Garrafa">Garrafa</option>
                                  </select>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Por {editingItemDetails.tipoEmbalagem}</span>
                              </div>
                            ) : (
                              <div className={`flex flex-col items-center ${isCoordenador ? 'cursor-pointer hover:bg-slate-100/50 rounded p-1' : ''}`} onClick={() => isCoordenador && setEditingItemDetails(item)}>
                                <span className="text-sm font-black text-slate-700">{item.unidadesPorEmbalagem}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Unid / {item.tipoEmbalagem}</span>
                              </div>
                            )}
                          </td>
                          {isGlobalAdmin && (
                            <td className="px-4 py-4 text-center">
                              <span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold uppercase">{item.paroquia}</span>
                            </td>
                          )}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">{embalagensAtuais}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-black">{item.tipoEmbalagem}(s)</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-slate-100/50 min-w-[140px]">
                            <div className="flex flex-col items-center justify-center">
                              {editingThresholdItem?.id === item.id ? (
                                <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-200">
                                  <div className="flex bg-white border border-liturgy-300 rounded-lg overflow-hidden">
                                    <input
                                      type="number"
                                      className="w-14 px-2 py-1 text-center text-sm font-black outline-none border-r border-slate-100"
                                      value={editingThresholdItem.value}
                                      autoFocus
                                      onChange={(e) => setEditingThresholdItem({ ...editingThresholdItem, value: Number(e.target.value) })}
                                    />
                                    <select 
                                      className="text-[9px] font-black uppercase px-2 outline-none bg-slate-50"
                                      value={editingThresholdItem.tipo}
                                      onChange={(e) => setEditingThresholdItem({ ...editingThresholdItem, tipo: e.target.value as 'embalagem' | 'unidade' })}
                                    >
                                      <option value="unidade">Unid.</option>
                                      <option value="embalagem">{item.tipoEmbalagem}s</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-1.5">
                                     <button onClick={saveThresholdChanges} className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded-md hover:bg-emerald-700 transition-all">
                                       <Save className="w-2.5 h-2.5" /> Salvar
                                     </button>
                                     <button onClick={() => setEditingThresholdItem(null)} className="flex items-center gap-1 px-1.5 py-1 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-md hover:bg-slate-300 transition-all">
                                       <X className="w-2.5 h-2.5" />
                                     </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`flex flex-col items-center gap-0.5 cursor-pointer hover:bg-slate-200/50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-slate-200 ${isCoordenador ? '' : 'pointer-events-none'}`}
                                  onClick={() => isCoordenador && setEditingThresholdItem({ id: item.id, value: item.nivelMinimo ?? 2, tipo: item.nivelMinimoTipo || 'embalagem' })}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-black ${isLowStock(item) ? 'text-red-700 underline underline-offset-4 decoration-red-300 decoration-2' : 'text-slate-700'}`}>
                                      {item.nivelMinimo ?? 2}
                                    </span>
                                    {isCoordenador && <Edit2 className="w-3 h-3 text-slate-400" />}
                                  </div>
                                  <span className={`text-[9px] uppercase font-black tracking-widest ${isLowStock(item) ? 'text-red-600' : 'text-slate-400'}`}>
                                    {item.nivelMinimoTipo === 'unidade' ? 'Unidades' : `${item.tipoEmbalagem}(s)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className={`inline-flex items-center justify-center min-w-[70px] h-9 rounded-xl px-2 font-black text-base shadow-sm border ${
                              isLowStock(item) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {item.quantidade}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                               {isCoordenador && (
                                 <button
                                   onClick={() => { 
                                     setMovementType('entrada'); 
                                     setNewMovement(prev => ({ 
                                       ...prev, 
                                       isEmbalagem: true, 
                                       quantidade: 0,
                                       observacao: ''
                                     }));
                                     setShowMovementForm(item.id); 
                                   }}
                                   className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase flex items-center gap-1.5"
                                 >
                                   <ArrowUpCircle className="w-4 h-4" />
                                   Entrada
                                 </button>
                               )}
                               <button
                                 onClick={() => { 
                                   setMovementType('saida'); 
                                   setNewMovement(prev => ({ 
                                     ...prev, 
                                     isEmbalagem: false, 
                                     quantidade: 0, 
                                     observacao: '',
                                     ministroResponsavel: user.role === 'ministro' ? getMinistroDisplayName(user) : ''
                                   }));
                                   setShowMovementForm(item.id); 
                                 }}
                                 className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all uppercase flex items-center gap-1.5"
                               >
                                 <ArrowDownCircle className="w-4 h-4" />
                                 Saída
                               </button>
                               {isCoordenador && (
                                 <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
           <div className="p-0 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-liturgy-600" />
                  Registros de Movimentação
               </h4>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">Data</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missa / Responsável</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">Entrada</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-orange-600 uppercase tracking-widest text-center">Saída</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Obs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 italic">Nenhum registro encontrado.</td></tr>
                    ) : (
                      movements.map(m => {
                        const item = items.find(i => i.id === m.itemId);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 pl-6 text-slate-500 text-[11px] font-medium whitespace-nowrap">{new Date(m.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-3">
                               {m.ministroResponsavel ? (
                                 <p className="font-bold text-slate-700 text-xs">{m.ministroResponsavel}</p>
                               ) : (
                                 m.usuario && !m.usuario.toLowerCase().includes("coordena") && !m.usuario.toLowerCase().includes("admin") ? (
                                   <p className="font-bold text-slate-700 text-xs">{m.usuario}</p>
                                 ) : null
                               )}
                               {m.dataMissa && (
                                 <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                   Missa: {new Date(m.dataMissa + 'T12:00:00Z').toLocaleDateString('pt-BR')} {m.horarioMissa ? `- ${m.horarioMissa}` : ''}
                                 </p>
                               )}
                            </td>
                            <td className="px-4 py-3">
                               <p className="font-bold text-slate-800 text-xs">{item?.item || 'Item Removido'}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{m.paroquia}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                               {m.tipo === 'entrada' ? (
                                 <div className="flex flex-col items-center justify-center">
                                   <span className="font-black text-emerald-700 text-sm">+{m.quantidadeOriginal || m.quantidade}</span>
                                   <span className="text-[8px] text-emerald-500 font-black tracking-tighter uppercase whitespace-nowrap">
                                     {m.isEmbalagem ? (item?.tipoEmbalagem || 'Emb.') : (item?.unidadeMedida || 'Un.')}
                                   </span>
                                 </div>
                               ) : <span className="text-slate-200">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                               {m.tipo === 'saida' ? (
                                 <div className="flex flex-col items-center justify-center">
                                   <span className="font-black text-orange-700 text-sm">-{m.quantidadeOriginal || m.quantidade}</span>
                                   <span className="text-[8px] text-orange-500 font-black tracking-tighter uppercase whitespace-nowrap">
                                     {m.isEmbalagem ? (item?.tipoEmbalagem || 'Emb.') : (item?.unidadeMedida || 'Un.')}
                                   </span>
                                 </div>
                               ) : <span className="text-slate-200">-</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic text-[10px] max-w-xs truncate">{m.observacao || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
             </div>
           </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                {movementType === 'entrada' ? <ArrowUpCircle className="w-5 h-5 text-blue-500" /> : <ArrowDownCircle className="w-5 h-5 text-orange-500" />}
                Registrar {movementType === 'entrada' ? 'Entrada' : 'Saída'}
              </h3>
              <button 
                onClick={() => setShowMovementForm(null)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-2xl flex items-start gap-4">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                  <Package className="w-5 h-5 text-liturgy-600" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-800">{items.find(i => i.id === showMovementForm)?.item}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    Estoque: <span className="font-black text-slate-900">{items.find(i => i.id === showMovementForm)?.quantidade} {items.find(i => i.id === showMovementForm)?.unidadeMedida}</span>
                  </p>
               </div>
            </div>

            <form onSubmit={handleRegisterMovement} className="space-y-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Modo de Lançamento</label>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                   <button 
                     type="button"
                     onClick={() => setNewMovement({ ...newMovement, isEmbalagem: true })}
                     className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${newMovement.isEmbalagem ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                   >
                     Por {items.find(i => i.id === showMovementForm)?.tipoEmbalagem || 'Embalagem'}
                   </button>
                   <button 
                     type="button"
                     onClick={() => setNewMovement({ ...newMovement, isEmbalagem: false })}
                     className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!newMovement.isEmbalagem ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                   >
                     Por {items.find(i => i.id === showMovementForm)?.unidadeMedida || 'Unidade'}
                   </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Quantidade ({newMovement.isEmbalagem ? items.find(i => i.id === showMovementForm)?.tipoEmbalagem : items.find(i => i.id === showMovementForm)?.unidadeMedida})
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:border-liturgy-500 focus:ring-4 focus:ring-liturgy-500/10 transition-all"
                  placeholder="0"
                  value={newMovement.quantidade || ''}
                  onChange={e => setNewMovement({ ...newMovement, quantidade: Number(e.target.value) })}
                  min="0.1"
                  step="0.1"
                  required
                />
                {newMovement.isEmbalagem && (
                  <p className="text-[10px] font-bold text-liturgy-600 px-2">
                    Equivale a {newMovement.quantidade * (items.find(i => i.id === showMovementForm)?.unidadesPorEmbalagem || 0)} {items.find(i => i.id === showMovementForm)?.unidadeMedida}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observação (Opcional)</label>
                <textarea
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-liturgy-500 transition-all resize-none h-20"
                  placeholder="Motivo da movimentação..."
                  value={newMovement.observacao}
                  onChange={e => setNewMovement({ ...newMovement, observacao: e.target.value })}
                />
              </div>

              {movementType === 'saida' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data da Missa</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-liturgy-500"
                      value={newMovement.dataMissa}
                      onChange={e => setNewMovement({ ...newMovement, dataMissa: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                    <input
                      type="text"
                      placeholder="Ex: 19:00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-liturgy-500"
                      value={newMovement.horarioMissa}
                      onChange={e => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 4) val = val.substring(0, 4);
                        if (val.length >= 3) {
                          val = val.substring(0, 2) + ':' + val.substring(2);
                        }
                        setNewMovement({ ...newMovement, horarioMissa: val });
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ministro Responsável</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-liturgy-500"
                      value={newMovement.ministroResponsavel}
                      onChange={e => setNewMovement({ ...newMovement, ministroResponsavel: e.target.value })}
                      required
                    >
                      <option value="">Selecione o Ministro...</option>
                      {ministros
                        .map(m => {
                          const displayName = getMinistroDisplayName(m);
                          return { id: m.id, displayName };
                        })
                        .sort((a, b) => a.displayName.localeCompare(b.displayName))
                        .map(m => (
                          <option key={m.id} value={m.displayName}>{m.displayName}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMovementForm(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 font-bold rounded-2xl text-white shadow-lg transition-all ${
                    movementType === 'entrada' ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-orange-600 shadow-orange-200 hover:bg-orange-700'
                  }`}
                >
                  Confirmar {movementType === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
