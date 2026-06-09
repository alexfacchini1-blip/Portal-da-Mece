import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { User, Phone, Lock, BookOpen, Heart, UserPlus, Check, Cross, Unlock, MessageCircle, Trash2, Award, Eye, UserMinus } from 'lucide-react';
import type { User as UserType } from '../types';
import { toTitleCase, formatPhone } from '../utils';

function CoordenacaoCadastroView({ user, onNewUserRegistered, onSetView, onCustomConfirm, onImpersonate, onUpdateUser }) {
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [approvedMinisters, setApprovedMinisters] = useState<UserType[]>([]);
  const [showNovoCadastro, setShowNovoCadastro] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingMinister, setEditingMinister] = useState<UserType | null>(null);
  const [mainTab, setMainTab] = useState('aprovados');
  const [formTab, setFormTab] = useState('pessoais');
  const [paroquias, setParoquias] = useState<any[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'nome'>('nome');
  const [showExcecaoModal, setShowExcecaoModal] = useState(false);
  const [excecaoTelefone, setExcecaoTelefone] = useState('');
  const [excecaoHoras, setExcecaoHoras] = useState('24');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const [novoCadastro, setNovoCadastro] = useState({
    nome: '', nomeExibicao: '', nomeExibicaoConjuge: '', telefone: '', senha: '', senhaConjuge: '',
    paroquia: user.role !== 'admin' ? (user.paroquia || '') : '',
    tipo: 'individual', nomeConjuge: '', dataNascimento: '', dataNascimentoConjuge: '', telefoneConjuge: '',
    role: 'ministro', acessoCoordenacao: 'casal', afastado: false, afastadoConjuge: false,
    tempoMinisterio: 'novo' as 'antigo' | 'novo',
    tempoMinisterioConjuge: 'novo' as 'antigo' | 'novo',
    incompatibilidades: [] as number[]
  });

  useEffect(() => {
    fetchPendingUsers();
    fetchApprovedMinisters();
    fetchParoquias();
  }, []);

  const fetchParoquias = async () => {
    try {
      const res = await fetch('/api/paroquias');
      if (res.ok) {
        let data = await res.json();
        if (user.role !== 'admin' && user.paroquia) {
          data = data.filter((p: any) => p.nome === user.paroquia);
        }
        setParoquias(data);
        if (data.length > 0) {
          setNovoCadastro(prev => ({ ...prev, paroquia: prev.paroquia || data[0].nome }));
        } else if (user.role !== 'admin' && user.paroquia) {
          setNovoCadastro(prev => ({ ...prev, paroquia: user.paroquia }));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar paróquias:', err);
    }
  };

  const fetchApprovedMinisters = async () => {
    try {
      const url = user.role === 'admin' ? '/api/admin/ministros' : `/api/admin/ministros?paroquia=${encodeURIComponent(user.paroquia)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApprovedMinisters(data);
      }
    } catch (err) {
      console.error('Erro ao buscar ministros aprovados:', err);
      setError('Erro ao carregar ministros aprovados.');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const url = user.role === 'admin' ? '/api/admin/pending' : `/api/admin/pending?paroquia=${encodeURIComponent(user.paroquia)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Show all pending users, regardless of role
        setPendingUsers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários pendentes:', err);
      setError('Erro ao carregar usuários pendentes.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== id));
        setMessage('Usuário aprovado com sucesso!');
        onNewUserRegistered();
        fetchApprovedMinisters();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao aprovar usuário.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao aprovar usuário.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reject/${id}`, { method: 'POST' });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== id));
        setMessage('Usuário rejeitado com sucesso!');
        onNewUserRegistered();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao rejeitar usuário.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao rejeitar usuário.');
    }
  };

  const handleConcederExcecao = (telefone: string) => {
    setExcecaoTelefone(telefone);
    setExcecaoHoras('24');
    setShowExcecaoModal(true);
  };

  const handleConfirmarExcecao = async () => {
    setShowExcecaoModal(false);
    if (!excecaoHoras) return;

    try {
      const res = await fetch('/api/admin/conceder-excecao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: excecaoTelefone, horas: excecaoHoras })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        fetchApprovedMinisters();
        
        // Se for o próprio usuário da coordenação, atualiza o estado global para liberar o acesso
        if (onUpdateUser && data.ministro) {
          const clean = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
          const mTelefone = clean(data.ministro.telefone);
          const mTelefoneConjuge = clean(data.ministro.telefoneConjuge);
          const uTelefone = clean(user.telefone);
          const uTelefoneConjuge = clean(user.telefoneConjuge);

          if (mTelefone === uTelefone || (uTelefoneConjuge && mTelefone === uTelefoneConjuge) || 
              (mTelefoneConjuge && mTelefoneConjuge === uTelefone)) {
            onUpdateUser(data.ministro);
          }
        }

        setTimeout(() => setMessage(''), 5000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao conceder acesso.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conceder acesso.');
    }
  };

  const handleNovoCadastroChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nome' || name === 'nomeExibicao' || name === 'nomeExibicaoConjuge' || name === 'nomeConjuge') {
      setNovoCadastro(prev => ({ ...prev, [name]: toTitleCase(value) }));
    } else if (name === 'dataNascimento' || name === 'dataNascimentoConjuge') {
      let v = value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0, 4);
      if (v.length > 2) {
        v = `${v.slice(0, 2)}/${v.slice(2)}`;
      }
      setNovoCadastro(prev => ({ ...prev, [name]: v }));
    } else if (name === 'telefone' || name === 'telefoneConjuge') {
      setNovoCadastro(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === 'senha' || name === 'senhaConjuge') {
      const v = value.replace(/\D/g, '').slice(0, 3);
      setNovoCadastro(prev => ({ ...prev, [name]: v }));
    } else {
      setNovoCadastro(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleAlterarEscala = async (minister: UserType) => {
    try {
      const res = await fetch(`/api/ministros/${minister.telefone}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podeAlterarEscala: !minister.podeAlterarEscala })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Permissão de alteração ${!minister.podeAlterarEscala ? 'liberada' : 'bloqueada'} para ${minister.nome}.`);
        fetchApprovedMinisters();
        
        if (onUpdateUser && data.ministro) {
          const clean = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
          const mTelefone = clean(data.ministro.telefone);
          const uTelefone = clean(user.telefone);
          const uTelefoneConjuge = clean(user.telefoneConjuge);
          if (mTelefone === uTelefone || (uTelefoneConjuge && mTelefone === uTelefoneConjuge)) {
            onUpdateUser(data.ministro);
          }
        }

        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Erro ao atualizar permissão.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar permissão.');
    }
  };

  const handleToggleTempo = async (minister: UserType) => {
    const novoStatus = minister.tempoMinisterio === 'novo' ? 'antigo' : 'novo';
    try {
      const res = await fetch(`/api/ministros/${minister.telefone}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempoMinisterio: novoStatus,
          tempoMinisterioConjuge: minister.tipo === 'casal' ? novoStatus : minister.tempoMinisterioConjuge
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Status de ministério alterado para ${novoStatus === 'novo' ? 'Novo' : 'Antigo'} para ${minister.nome}.`);
        fetchApprovedMinisters();

        if (onUpdateUser && data.ministro) {
          const clean = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
          const mTelefone = clean(data.ministro.telefone);
          const uTelefone = clean(user.telefone);
          const uTelefoneConjuge = clean(user.telefoneConjuge);
          if (mTelefone === uTelefone || (uTelefoneConjuge && mTelefone === uTelefoneConjuge)) {
            onUpdateUser(data.ministro);
          }
        }

        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMinister = (minister: UserType) => {
    setEditingMinister(minister);
    setNovoCadastro({
      nome: minister.nome || '',
      nomeExibicao: minister.nomeExibicao || '',
      nomeExibicaoConjuge: minister.nomeExibicaoConjuge || '',
      telefone: formatPhone(minister.telefone || ''),
      senha: minister.senha || '',
      senhaConjuge: minister.senhaConjuge || '',
      paroquia: user.role !== 'admin' ? (user.paroquia || '') : (minister.paroquia || (paroquias.length > 0 ? paroquias[0].nome : '')),
      tipo: minister.tipo || 'individual',
      nomeConjuge: minister.nomeConjuge || '',
      dataNascimento: minister.dataNascimento || '',
      dataNascimentoConjuge: minister.dataNascimentoConjuge || '',
      telefoneConjuge: formatPhone(minister.telefoneConjuge || ''),
      role: minister.role || 'ministro',
      acessoCoordenacao: minister.acessoCoordenacao || 'casal',
      afastado: minister.afastado || false,
      afastadoConjuge: minister.afastadoConjuge || false,
      tempoMinisterio: minister.tempoMinisterio || 'novo',
      tempoMinisterioConjuge: minister.tempoMinisterioConjuge || 'novo',
      incompatibilidades: minister.incompatibilidades || []
    });
    setMainTab('novo');
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage('');
    setError('');
  };

  const handleDeleteUser = (id: string, role: string) => {
    const msg = `Tem certeza que deseja excluir este ${role?.toLowerCase().includes('coordena') ? 'coordenador' : 'ministro'}?`;
    if (onCustomConfirm) {
      onCustomConfirm(msg, async () => {
        try {
          const res = await fetch(`/api/admin/coordinators/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setMessage(`${role?.toLowerCase().includes('coordena') ? 'Coordenador' : 'Ministro'} excluído com sucesso!`);
            fetchApprovedMinisters();
            fetchPendingUsers();
            setTimeout(() => setMessage(''), 3000);
          } else {
            const data = await res.json();
            setError(data.error || 'Erro ao excluir usuário.');
          }
        } catch (err) {
          console.error(err);
          setError('Erro ao excluir usuário.');
        }
      });
    }
  };

  const handleNovoCadastroSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Clear any potential browser auto-fill values if they are still "Admin" in wrong fields
    if (novoCadastro.dataNascimento === 'Admin') {
      setError('Por favor, informe uma data de nascimento válida.');
      return;
    }

    const phoneDigits = novoCadastro.telefone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setError('O telefone deve conter exatamente 11 números (DDD + 9 dígitos).');
      return;
    }

    const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/;

    if (novoCadastro.dataNascimento && !dateRegex.test(novoCadastro.dataNascimento)) {
      setError('A data de nascimento deve estar no formato DD/MM (ex: 25/03).');
      return;
    }

    if (novoCadastro.tipo === 'casal') {
      const conjugePhoneDigits = novoCadastro.telefoneConjuge.replace(/\D/g, '');
      if (conjugePhoneDigits.length !== 11) {
        setError('O telefone do cônjuge deve conter exatamente 11 números (DDD + 9 dígitos).');
        return;
      }
      if (novoCadastro.dataNascimentoConjuge && !dateRegex.test(novoCadastro.dataNascimentoConjuge)) {
        setError('A data de nascimento do cônjuge deve estar no formato DD/MM (ex: 25/03).');
        return;
      }
    }

    try {
      const url = editingMinister ? `/api/ministros/${editingMinister.telefone}` : '/api/ministros';
      const method = editingMinister ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novoCadastro, aprovado: editingMinister ? editingMinister.aprovado : true })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(editingMinister ? 'Cadastro atualizado com sucesso!' : 'Cadastro realizado com sucesso!');
        
        if (editingMinister && onUpdateUser && data.ministro) {
          const clean = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
          const mTelefone = clean(data.ministro.telefone);
          const uTelefone = clean(user.telefone);
          const uTelefoneConjuge = clean(user.telefoneConjuge);
          if (mTelefone === uTelefone || (uTelefoneConjuge && mTelefone === uTelefoneConjuge)) {
            onUpdateUser(data.ministro);
          }
        }

        setMainTab('aprovados');
        setNovoCadastro({
          nome: '', nomeExibicao: '', nomeExibicaoConjuge: '', telefone: '', senha: '', senhaConjuge: '',
          paroquia: user.role !== 'admin' ? (user.paroquia || '') : (paroquias.length > 0 ? paroquias[0].nome : ''),
          tipo: 'individual', nomeConjuge: '', dataNascimento: '', dataNascimentoConjuge: '', telefoneConjuge: '',
          role: 'ministro', acessoCoordenacao: 'casal', afastado: false, afastadoConjuge: false,
          incompatibilidades: []
        });
        setEditingMinister(null); // Clear editing state
        onNewUserRegistered(); // Notify parent of new registration
        fetchPendingUsers();
        fetchApprovedMinisters();
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || (editingMinister ? 'Erro ao atualizar cadastro' : 'Erro ao cadastrar'));
      }
    } catch (err) {
      console.error(err);
      setError(editingMinister ? 'Erro ao atualizar ministro' : 'Erro ao cadastrar ministro');
    }
  };

  const ministersDisplay = approvedMinisters;
  const totalMinisters = ministersDisplay.reduce((acc, m) => acc + (m.tipo === 'casal' ? 2 : 1), 0);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-blue-600" />
        Gestão de Ministros
      </h2>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-medium text-center">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium text-center">
          {error}
        </div>
      )}

      {/* Main Tabs Selection */}
      <div className="mb-8 flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
        <button
          onClick={() => setMainTab('aprovados')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'aprovados' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
        >
          Aprovados
        </button>
        <button
          onClick={() => setMainTab('pendentes')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${mainTab === 'pendentes' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
        >
          Pendentes
          {pendingUsers.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-600 text-white text-[8px] font-black rounded-full leading-none min-w-[1.25rem] h-5 flex items-center justify-center shadow-sm">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setEditingMinister(null);
            setNovoCadastro({
              nome: '', nomeExibicao: '', nomeExibicaoConjuge: '', telefone: '', senha: '', senhaConjuge: '',
              paroquia: user.role !== 'admin' ? (user.paroquia || '') : (paroquias.length > 0 ? paroquias[0].nome : ''),
              tipo: 'individual', nomeConjuge: '', dataNascimento: '', dataNascimentoConjuge: '', telefoneConjuge: '',
              role: 'ministro', acessoCoordenacao: 'casal', afastado: false, afastadoConjuge: false,
              tempoMinisterio: 'novo', tempoMinisterioConjuge: 'novo'
            });
            setMainTab('novo');
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'novo' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
        >
          {editingMinister ? 'Editando' : 'Novo'}
        </button>
      </div>

      {mainTab === 'novo' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              {editingMinister ? `Editando: ${editingMinister.nome}` : 'Novo Cadastro'}
            </h3>
            {editingMinister && (
              <button
                onClick={() => {
                  setEditingMinister(null);
                  setMainTab('aprovados');
                }}
                className="text-xs font-bold text-slate-400 hover:text-red-500"
              >
                Cancelar
              </button>
            )}
          </div>
          
          <div className="flex border-b border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => setFormTab('pessoais')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[2px] transition-all ${formTab === 'pessoais' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Dados do Cadastro
            </button>
            <button
              type="button"
              onClick={() => setFormTab('restricoes')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[2px] transition-all ${formTab === 'restricoes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Restrições / Incompatibilidades
            </button>
          </div>

          <form onSubmit={handleNovoCadastroSubmit} className="space-y-4" autoComplete="off">
            {formTab === 'restricoes' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Aqui você pode selecionar ministros que <strong>NUNCA</strong> devem ser escalados junto com {(() => {
                      if (!novoCadastro.nome) return 'este ministro';
                      if (novoCadastro.tipo === 'casal' && novoCadastro.nomeConjuge) {
                        return `${novoCadastro.nomeExibicao || novoCadastro.nome} e ${novoCadastro.nomeExibicaoConjuge || novoCadastro.nomeConjuge}`;
                      }
                      return novoCadastro.nomeExibicao || novoCadastro.nome;
                    })()}. 
                    O sistema de geração automática de escala respeitará estas regras.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {approvedMinisters
                    .filter(m => m.id !== editingMinister?.id)
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map(m => {
                      const isSelected = (novoCadastro.incompatibilidades || []).includes(m.id as number);
                      const displayName = m.tipo === 'casal' && m.nomeConjuge 
                        ? `${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}` 
                        : (m.nomeExibicao || m.nome);
                      
                      return (
                        <div 
                          key={m.id} 
                          onClick={() => {
                            const current = novoCadastro.incompatibilidades || [];
                            const next = isSelected 
                              ? current.filter(id => id !== m.id)
                              : [...current, m.id as number];
                            setNovoCadastro(prev => ({ ...prev, incompatibilidades: next }));
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected 
                              ? 'bg-rose-600 border-rose-700 text-white shadow-md' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'border-white/40 bg-white/20' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-[10px] font-black truncate">
                            {displayName}
                          </span>
                        </div>
                      );
                    })}
                </div>
                {approvedMinisters.length <= 1 && (
                  <p className="text-xs text-slate-400 italic text-center py-8">Nenhum outro ministro aprovado para selecionar.</p>
                )}
              </div>
            )}

            {formTab === 'pessoais' && (
              <>
                {/* Hidden fields to trick browser autofill */}
                <input type="text" name="fake_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <input type="password" name="fake_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input
                      type="text"
                      name="nome"
                      value={novoCadastro.nome}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Como quer ser chamado (na escala)</label>
                    <input
                      type="text"
                      name="nomeExibicao"
                      value={novoCadastro.nomeExibicao || ''}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Telefone (DDD + 9 números)</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={novoCadastro.telefone}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="(14) 99999-9999"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Senha</label>
                    <input
                      type="password"
                      name="senha"
                      value={novoCadastro.senha}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      required
                      maxLength={3}
                      placeholder="Ex: 123"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Paróquia</label>
                    <select
                      name="paroquia"
                      value={novoCadastro.paroquia}
                      onChange={handleNovoCadastroChange}
                      disabled={user.role !== 'admin'}
                      className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none ${user.role !== 'admin' ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                      required
                      autoComplete="off"
                    >
                      {paroquias.length === 0 ? (
                        <option value={user.paroquia || "Santa Rita de Cássia - Bauru/SP"}>{user.paroquia || "Santa Rita de Cássia - Bauru/SP"}</option>
                      ) : (
                        paroquias.map(p => (
                          <option key={p.id} value={p.nome}>{p.nome}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Data de Nascimento</label>
                    <input
                      type="text"
                      name="dataNascimento"
                      value={novoCadastro.dataNascimento}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="DD/MM"
                      pattern="\d{2}/\d{2}"
                      title="Formato DD/MM (ex: 25/03)"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Tipo de Cadastro</label>
                    <select
                      name="tipo"
                      value={novoCadastro.tipo}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="individual">Individual</option>
                      <option value="casal">Casal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Tempo de Ministério</label>
                    <select
                      name="tempoMinisterio"
                      value={novoCadastro.tempoMinisterio}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="novo">Novo</option>
                      <option value="antigo">Antigo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Função</label>
                    <select
                      name="role"
                      value={novoCadastro.role}
                      onChange={handleNovoCadastroChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="ministro">Ministro</option>
                      <option value="coordenacao">Coordenação</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="afastado"
                      name="afastado"
                      checked={novoCadastro.afastado}
                      onChange={(e) => setNovoCadastro(prev => ({ ...prev, afastado: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="afastado" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      Afastado (Não escalar {novoCadastro.nome || 'Titular'})
                    </label>
                  </div>

                  {novoCadastro.role === 'coordenacao' && novoCadastro.tipo === 'casal' && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Liberar Acesso Para</label>
                      <select
                        name="acessoCoordenacao"
                        value={novoCadastro.acessoCoordenacao}
                        onChange={handleNovoCadastroChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="casal">Casal (Ambos)</option>
                        <option value="ele">Ele (Apenas {novoCadastro.nome || 'Nome'})</option>
                        <option value="ela">Ela (Apenas {novoCadastro.nomeConjuge || 'Cônjuge'})</option>
                      </select>
                    </div>
                  )}
                </div>

                {novoCadastro.tipo === 'casal' && (
                  <div className="border-t border-slate-200 pt-4 mt-4 space-y-4">
                    <h4 className="text-md font-semibold text-slate-800">Dados do Cônjuge</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Nome do Cônjuge</label>
                        <input
                          type="text"
                          name="nomeConjuge"
                          value={novoCadastro.nomeConjuge}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Como o cônjuge quer ser chamado (na escala)</label>
                        <input
                          type="text"
                          name="nomeExibicaoConjuge"
                          value={novoCadastro.nomeExibicaoConjuge || ''}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Telefone do Cônjuge</label>
                        <input
                          type="tel"
                          name="telefoneConjuge"
                          value={novoCadastro.telefoneConjuge}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="(14) 99999-9999"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Data de Nascimento (Cônjuge)</label>
                        <input
                          type="text"
                          name="dataNascimentoConjuge"
                          value={novoCadastro.dataNascimentoConjuge}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="DD/MM"
                          pattern="\d{2}/\d{2}"
                          title="Formato DD/MM (ex: 25/03)"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Senha do Cônjuge</label>
                        <input
                          type="password"
                          name="senhaConjuge"
                          value={novoCadastro.senhaConjuge}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                          maxLength={3}
                          autoComplete="new-password"
                          placeholder="Ex: 456 (Deixe em branco para usar a mesma)"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Tempo de Ministério (Cônjuge)</label>
                        <select
                          name="tempoMinisterioConjuge"
                          value={novoCadastro.tempoMinisterioConjuge}
                          onChange={handleNovoCadastroChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                          <option value="novo">Novo</option>
                          <option value="antigo">Antigo</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="afastadoConjuge"
                          name="afastadoConjuge"
                          checked={novoCadastro.afastadoConjuge}
                          onChange={(e) => setNovoCadastro(prev => ({ ...prev, afastadoConjuge: e.target.checked }))}
                          className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="afastadoConjuge" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          Afastado (Não escalar {novoCadastro.nomeConjuge || 'Cônjuge'})
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              {editingMinister ? 'Atualizar Cadastro' : 'Cadastrar Ministro'}
            </button>
          </form>
        </div>
      )}

      {mainTab === 'pendentes' && (
        <>
          <h3 className="text-sm font-black text-slate-400 mb-4 flex items-center gap-2 mt-4 uppercase tracking-widest">
            <User className="w-4 h-4 text-blue-600" />
            Cadastros Pendentes ({pendingUsers.reduce((acc, u) => acc + (u.tipo === 'casal' ? 2 : 1), 0)})
          </h3>
          {pendingUsers.length === 0 ? (
            <p className="text-slate-400 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs font-bold uppercase tracking-widest">Nenhum cadastro pendente.</p>
          ) : (
            <div className="space-y-4 mb-8">
              {pendingUsers.map(pendingUser => (
                <div key={pendingUser.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                  <div>
                    <p className="font-black text-slate-800">
                      {pendingUser.nomeExibicao || pendingUser.nome} 
                      {pendingUser.nomeConjuge ? ` e ${pendingUser.nomeExibicaoConjuge || pendingUser.nomeConjuge}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{pendingUser.telefone}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">{pendingUser.paroquia}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/55${pendingUser.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
                      title={`WhatsApp ${pendingUser.nomeExibicao || pendingUser.nome}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    {(user.role?.toLowerCase().includes('coordena') || user.role === 'admin') && (
                      <>
                        <button
                          onClick={() => handleApprove(pendingUser.id!)}
                          className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors shadow-sm"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditMinister(pendingUser)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                          title="Editar"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(pendingUser.id!)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                          title="Rejeitar"
                        >
                          <Cross className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mainTab === 'aprovados' && (
        <>
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6 flex items-start gap-4">
          <div className="flex-grow">
            <h3 className="text-sm font-black text-black flex items-center gap-2 uppercase tracking-widest">
              <Check className="w-4 h-4 text-emerald-600" />
              Ministros Aprovados ({totalMinisters} pessoas)
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
              Você pode gerenciar as <strong>incompatibilidades</strong> (quem não pode ser escalado junto) clicando no ícone <UserMinus className="w-3 h-3 inline pb-0.5" /> de cada ministro. Esta informação é <strong>estritamente restrita</strong> à coordenação.
            </p>
          </div>
        </div>

          {totalMinisters > 0 && (
            <div className="mb-6 flex flex-wrap gap-1 justify-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setSelectedLetter(null)}
                className={`px-3 h-10 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedLetter === null
                    ? 'bg-blue-100 text-black shadow-md border border-blue-200'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                TUDO
              </button>
              {alphabet.map(letter => {
                const hasMinisters = ministersDisplay.some(m => 
                  m.nome.toUpperCase().startsWith(letter) || 
                  (m.nomeConjuge && m.nomeConjuge.toUpperCase().startsWith(letter))
                );
                
                return (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    disabled={!hasMinisters}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                      selectedLetter === letter
                        ? 'bg-blue-100 text-black shadow-md border border-blue-200'
                        : hasMinisters
                          ? 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                          : 'text-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {totalMinisters === 0 ? (
            <p className="text-slate-400 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs font-bold uppercase tracking-widest">Nenhum ministro aprovado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ministersDisplay
                .filter(minister => {
                  if (!selectedLetter) return true;
                  return (
                    minister.nome.toUpperCase().startsWith(selectedLetter) ||
                    (minister.nomeConjuge && minister.nomeConjuge.toUpperCase().startsWith(selectedLetter))
                  );
                })
                .map(minister => (
                <div key={minister.id} className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                  <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="font-black text-slate-800 text-sm">
                        {minister.nomeExibicao || minister.nome} 
                        {minister.nomeConjuge && ` e ${minister.nomeExibicaoConjuge || minister.nomeConjuge}`}
                      </p>
                      {minister.role?.toLowerCase().includes('coordena') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
                          COORDENAÇÃO
                        </span>
                      )}
                      {minister.tempoMinisterio === 'novo' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                          NOVO
                        </span>
                      )}
                      {(minister.afastado || minister.afastadoConjuge) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                          {minister.afastado && minister.afastadoConjuge ? 'AFASTADOS' : 'AFASTADO'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {minister.telefone} • {minister.paroquia}
                      {minister.incompatibilidades && minister.incompatibilidades.length > 0 && (
                        <span className="ml-2 font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[8px] border border-rose-100 uppercase tracking-tighter">
                          {minister.incompatibilidades.length} Incompatibilitade(s)
                        </span>
                      )}
                      {minister.excecaoAcessoAte && new Date(minister.excecaoAcessoAte) > new Date() && (
                        <span className="ml-2 font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] border border-emerald-100 italic">
                          ACESSANDO...
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-4">
                    <button
                      onClick={() => {
                        handleEditMinister(minister);
                        setFormTab('restricoes');
                      }}
                      className="w-7 h-7 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center shadow-sm"
                      title="Gerenciar Incompatibilidades (Sigiloso)"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleTempo(minister)}
                      className={`w-7 h-7 rounded-full transition-all shadow-sm border flex items-center justify-center ${
                        minister.tempoMinisterio === 'novo' 
                          ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title={minister.tempoMinisterio === 'novo' ? 'Status: Novo' : 'Status: Antigo'}
                    >
                      <Award className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleConcederExcecao(minister.telefone)}
                      className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center shadow-sm"
                      title="Acesso Temporário (Liberar Disponibilidade)"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEditMinister(minister)}
                      className="w-7 h-7 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100 transition-all border border-amber-100 flex items-center justify-center shadow-sm"
                      title="Editar"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(minister.id!, minister.role)}
                      className="w-7 h-7 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-all border border-rose-100 flex items-center justify-center shadow-sm"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showExcecaoModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight">
                  Liberar Acesso Temporário
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configurar exceção para o ministro
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Tempo de Liberação (em horas)
              </label>
              <input
                type="number"
                min="1"
                value={excecaoHoras}
                onChange={(e) => setExcecaoHoras(e.target.value)}
                placeholder="Ex: 24"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-slate-800 transition-all font-medium"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-normal">
                Durante este período, o ministro terá acesso liberado para atualizar sua disponibilidade mesmo se o agendamento estiver fechado.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExcecaoModal(false)}
                className="flex-1 py-3 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-2xl transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcecao}
                className="flex-1 py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition duration-200 shadow-lg shadow-emerald-100"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordenacaoCadastroView;
