import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { CalendarPlus, Trash2, AlertTriangle, Plus, Minus, Settings2, Edit2, X } from 'lucide-react';

const MISSAS_PADRAO = [
  // Fim de semana
  { id: 'padrao-sab-17', nome: 'Missa de Sábado', diaNome: 'Sábado', horario: '17:00', defaultQuantidade: 6, grupo: 'Fim de Semana' },
  { id: 'padrao-dom-07', nome: 'Missa de Domingo', diaNome: 'Domingo', horario: '07:30', defaultQuantidade: 5, grupo: 'Fim de Semana' },
  { id: 'padrao-dom-10', nome: 'Missa de Domingo', diaNome: 'Domingo', horario: '10:00', defaultQuantidade: 8, grupo: 'Fim de Semana' },
  { id: 'padrao-dom-19', nome: 'Missa de Domingo', diaNome: 'Domingo', horario: '19:00', defaultQuantidade: 8, grupo: 'Fim de Semana' },
];

function CoordenacaoMissasView({ user, mesSelecionado, anoSelecionado }: { user: any, mesSelecionado?: number, anoSelecionado?: number }) {
  const [missasTemporarias, setMissasTemporarias] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingMissa, setEditingMissa] = useState<any>(null);
  const [managingInactiveDates, setManagingInactiveDates] = useState<any>(null);
  const [showGestao, setShowGestao] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'primary' | 'success';
  } | null>(null);

  const missasPadrao = MISSAS_PADRAO;

  const targetMonth = mesSelecionado !== undefined ? mesSelecionado - 1 : new Date().getMonth();
  const targetYear = anoSelecionado !== undefined ? anoSelecionado : new Date().getFullYear();

  const [novaMissa, setNovaMissa] = useState({
    data: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`,
    horario: '',
    nome: '',
    quantidade: 4,
    frequencia: 'semanal', // 'temporaria' | 'diaria' | 'semanal' | 'quinzenal' | 'mensal'
    diaSemana: '0', // 0-6 (Domingo-Sábado)
    diaMes: '1'
  });

  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMissasTemporarias();
  }, []);

  const fetchMissasTemporarias = async () => {
    try {
      const res = await fetch(`/api/missas-temporarias?paroquia=${encodeURIComponent(user.paroquia || '')}`);
      if (res.ok) {
        setMissasTemporarias(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar missas temporárias:', err);
    }
  };

  const handleNovaMissaChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovaMissa(prev => ({ ...prev, [name]: value }));
  };

  const handleEditMissaChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingMissa(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (padrao: any, date: string) => {
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      // Validação básica de dia da semana para missas de fim de semana
      if (padrao.diaNome === 'Sábado' && dateObj.getDay() !== 6) {
        setError(`A data selecionada não é um Sábado.`);
        return;
      }
      if (padrao.diaNome === 'Domingo' && dateObj.getDay() !== 0) {
        setError(`A data selecionada não é um Domingo.`);
        return;
      }
    }
    setError('');
    setSelectedDates(prev => ({ ...prev, [padrao.id]: date }));
  };

  const handleNovaMissaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/missas-temporarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novaMissa, paroquia: user.paroquia })
      });

      if (res.ok) {
        setMessage('Missa cadastrada com sucesso!');
        setNovaMissa({ data: '', horario: '', nome: '', quantidade: 4, frequencia: 'temporaria', diaSemana: '0', diaMes: '1' });
        fetchMissasTemporarias();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao cadastrar missa.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  const handleUpdateMissaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!editingMissa || !editingMissa.id) {
      console.error('[DEBUG] Tentativa de atualizar missa sem ID ou objeto inválido');
      setError('Erro interno: ID da missa não encontrado.');
      return;
    }

    console.log('[DEBUG] Enviando atualização de missa:', editingMissa);

    try {
      // Garantir que quantidade seja número e outros campos básicos estejam presentes
      const payload = {
        ...editingMissa,
        quantidade: parseInt(String(editingMissa.quantidade || 0)),
        paroquia: editingMissa.paroquia || user.paroquia
      };

      const res = await fetch(`/api/missas-temporarias/${encodeURIComponent(editingMissa.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('[DEBUG] Missa atualizada com sucesso');
        setMessage('Missa atualizada com sucesso!');
        setEditingMissa(null);
        await fetchMissasTemporarias();
      } else {
        const data = await res.json();
        console.error('[DEBUG] Erro ao atualizar missa (Server response):', data);
        setError(data.error || 'Erro ao atualizar missa.');
      }
    } catch (err) {
      console.error('[DEBUG] Erro de rede ao atualizar missa:', err);
      setError('Erro de conexão ao servidor.');
    }
  };

  const handleDeleteMissaTemporaria = async (missa: any) => {
    try {
      const queryParams = new URLSearchParams({
        nome: missa.nome,
        horario: missa.horario,
        paroquia: user.paroquia || ''
      }).toString();
      
      const res = await fetch(`/api/missas-temporarias/${missa.id}?${queryParams}`, { method: 'DELETE' });
      if (res.ok) {
        setMissasTemporarias(prev => prev.filter((m: any) => m.id !== missa.id));
        setMessage('Missa excluída com sucesso!');
        fetchMissasTemporarias(); // Recarrega para aplicar o filtro de deletada
      } else {
        setError('Erro ao excluir missa.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  const handleUpdateQuantidade = async (id: string, novaQuantidade: number, extraData?: any) => {
    if (novaQuantidade < 0) return;
    
    // Suporte a quantidade 0 via botões - e + (reativar/inativar)
    // Mas mantemos a lógica de confirmação se for inativar/reativar?
    // O usuário relatou problemas nos botões, então vamos focar na reatividade.
    
    // Se já estiver processando esse ID, evita cliques duplos
    if (pendingUpdates.has(id)) return;

    // Guardar estado anterior para rollback se necessário
    const anterior = missasTemporarias.find((m: any) => m.id === id);
    
    // Atualização Otimista
    setMissasTemporarias(prev => prev.map((m: any) => m.id === id ? { ...m, quantidade: novaQuantidade } : m));
    setPendingUpdates(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const res = await fetch(`/api/missas-temporarias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade: novaQuantidade, ...extraData })
      });
      
      if (res.ok) {
        const updatedMissa = await res.json();
        // Sincroniza com o ID real retornado (caso tenha sido criado um override no backend)
        setMissasTemporarias(prev => {
          const exists = prev.some(m => m.id === updatedMissa.id);
          if (id !== updatedMissa.id) {
            // Se o ID mudou (override criado), substitui o temporário pelo final
            return prev.map(m => m.id === id ? updatedMissa : m);
          }
          return prev.map(m => m.id === updatedMissa.id ? updatedMissa : m);
        });

        if (novaQuantidade === 0) {
          setMessage('Missa inativada com sucesso!');
        } else if (anterior && anterior.quantidade === 0 && novaQuantidade > 0) {
          setMessage('Missa reativada com sucesso!');
        } else {
          // Não mostra mensagem para ajustes rápidos de número para não poluir
          // setMessage('Vagas atualizadas com sucesso!');
        }
      } else {
        // Rollback se falhar
        if (anterior) {
          setMissasTemporarias(prev => prev.map((m: any) => m.id === id ? anterior : m));
        }
        setError('Erro ao atualizar quantidade no servidor.');
      }
    } catch (err) {
      if (anterior) {
        setMissasTemporarias(prev => prev.map((m: any) => m.id === id ? anterior : m));
      }
      setError('Erro ao conectar com o servidor.');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.add(id); // O ID novo pode ser diferente se foi override
        // Na dúvida, limpamos ambos se soubermos, mas aqui limpamos o original
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleInactiveDate = async (id: string, date: string) => {
    try {
      const res = await fetch(`/api/missas-temporarias/${id}/toggle-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: date })
      });
      if (res.ok) {
        const updatedMissa = await res.json();
        setMissasTemporarias(prev => prev.map((m: any) => m.id === id ? updatedMissa : m));
        if (managingInactiveDates?.id === id) {
          setManagingInactiveDates(updatedMissa);
        }
      } else {
        setError('Erro ao alternar data inativa.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    }
  };

  const getNextOccurrences = (missa: any) => {
    const occurrences: string[] = [];
    let current = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // If it's a temporary mass, it only has one date
    if (missa.frequencia === 'temporaria') {
      const dataObj = new Date(missa.data + 'T00:00:00');
      if (dataObj.getMonth() === targetMonth && dataObj.getFullYear() === targetYear) {
        return [missa.data];
      }
      return [];
    }

    for (let dia = 1; dia <= lastDayOfMonth; dia++) {
      const dayOfWeek = current.getDay();
      const dayOfMonth = current.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      let match = false;
      if (missa.frequencia === 'diaria') {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) match = true;
      }
      else if (missa.frequencia === 'semanal' && dayOfWeek === parseInt(missa.diaSemana)) match = true;
      else if (missa.frequencia === 'quinzenal' && dayOfWeek === parseInt(missa.diaSemana) && (weekOfMonth === 1 || weekOfMonth === 3)) match = true;
      else if (missa.frequencia === 'mensal-1' && dayOfWeek === parseInt(missa.diaSemana) && weekOfMonth === 1) match = true;
      else if (missa.frequencia === 'mensal-2' && dayOfWeek === parseInt(missa.diaSemana) && weekOfMonth === 2) match = true;
      else if (missa.frequencia === 'mensal-3' && dayOfWeek === parseInt(missa.diaSemana) && weekOfMonth === 3) match = true;
      else if (missa.frequencia === 'mensal-4' && dayOfWeek === parseInt(missa.diaSemana) && weekOfMonth === 4) match = true;
      else if (missa.frequencia === 'mensal-data' && dayOfMonth === parseInt(missa.diaMes)) match = true;

      if (match) {
        occurrences.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    return occurrences;
  };

  const handleUpdateMissaPadrao = async (padrao: any, novaQuantidade: number) => {
    if (novaQuantidade < 0) return;
    
    const selectedDate = selectedDates[padrao.id] || '';

    const override = selectedDate
      ? missasTemporarias.find((m: any) => 
          m.tipo === 'unica' && 
          m.data === selectedDate &&
          m.nome === padrao.nome && 
          m.horario === padrao.horario
        )
      : missasTemporarias.find((m: any) => 
          (m.tipo === 'padrao' || m.tipo === 'fixa') && 
          m.nome === padrao.nome && 
          m.horario === padrao.horario
        );

    if (override) {
      await handleUpdateQuantidade(override.id, novaQuantidade, {
        nome: padrao.nome,
        horario: padrao.horario,
        diaSemana: padrao.diaSemana,
        frequencia: padrao.frequencia,
        paroquia: user.paroquia
      });
    } else {
      try {
        const res = await fetch('/api/missas-temporarias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: selectedDate ? 'unica' : 'padrao',
            nome: padrao.nome,
            diaSemana: padrao.diaNome === 'Sábado' ? '6' : '0',
            horario: padrao.horario,
            quantidade: novaQuantidade,
            data: selectedDate,
            paroquia: user.paroquia
          })
        });

        if (res.ok) {
          fetchMissasTemporarias();
          if (novaQuantidade === 0) {
            setMessage('Missa inativada com sucesso!');
          } else {
            setMessage('Missa reativada com sucesso!');
          }
        } else {
          setError('Erro ao atualizar limite padrão.');
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor.');
      }
    }
  };

  const isOverride = (m: any) => {
    if (m.tipo === 'fixa' || m.tipo === 'padrao') {
      return MISSAS_PADRAO.some(p => p.nome === m.nome && p.horario === m.horario);
    } else if (m.tipo === 'unica') {
      return MISSAS_PADRAO.some(p => p.nome === m.nome && p.horario === m.horario);
    }
    return false;
  };

  const missasExtras = missasTemporarias.filter((m: any) => {
    if (isOverride(m)) return false;
    
    return true; // Mostrar todas as missas, sem distinção de mês ou tipo
  });

  // Group MISSAS_PADRAO by grupo
  const gruposPadrao = MISSAS_PADRAO.reduce((acc, padrao) => {
    if (!acc[padrao.grupo]) acc[padrao.grupo] = [];
    acc[padrao.grupo].push(padrao);
    return acc;
  }, {} as Record<string, typeof MISSAS_PADRAO>);

  return (
    <div className="space-y-8">
      {/* Dialog de Confirmação Customizado */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-4 flex items-center gap-3 border-b ${
              confirmDialog.variant === 'danger' ? 'bg-red-50 border-red-100 text-red-700' :
              confirmDialog.variant === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
              confirmDialog.variant === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
              'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold">{confirmDialog.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`flex-1 px-4 py-2 text-white font-bold rounded-xl transition-colors text-sm shadow-md ${
                  confirmDialog.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' :
                  confirmDialog.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-100' :
                  confirmDialog.variant === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' :
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Missas de Fim de Semana */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-blue-600" />
            Missas de Fim de Semana
          </h3>
          <button
            onClick={() => setShowGestao(!showGestao)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            {showGestao ? 'Ocultar Missas' : 'Mostrar Missas'}
          </button>
        </div>

        {showGestao && (
          <div className="space-y-6">
            {Object.entries(gruposPadrao).map(([grupo, missas]) => (
              <div key={grupo} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4 text-blue-600" />
                    {grupo}
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {missas.map(padrao => {
                    const selectedDate = selectedDates[padrao.id] || '';
                    const override = selectedDate
                      ? missasTemporarias.find((m: any) => 
                          m.tipo === 'unica' && 
                          m.data === selectedDate &&
                          m.nome === padrao.nome && 
                          m.horario === padrao.horario
                        )
                      : missasTemporarias.find((m: any) => 
                          (m.tipo === 'padrao' || m.tipo === 'fixa') && 
                          m.nome === padrao.nome && 
                          m.horario === padrao.horario
                        );
                    
                    const quantidade = override ? override.quantidade : padrao.defaultQuantidade;

                    return (
                      <div key={padrao.id} className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{padrao.nome}</p>
                            <p className="text-sm text-slate-600">{padrao.diaNome} às {padrao.horario}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Limite Atual</p>
                            <div className={`flex items-center bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${pendingUpdates.has(override?.id || padrao.id) ? 'opacity-50 grayscale pointer-events-none' : 'border-slate-200'}`}>
                              <button
                                onClick={() => handleUpdateMissaPadrao(padrao, quantidade - 1)}
                                disabled={quantidade <= 0}
                                className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className="w-8 text-center text-sm font-bold text-slate-700 border-x border-slate-200 py-1 min-w-[2.5rem]">
                                {quantidade}
                              </div>
                              <button
                                onClick={() => handleUpdateMissaPadrao(padrao, quantidade + 1)}
                                className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ajustar para data específica:</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => handleDateChange(padrao, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {selectedDate && (
                              <button
                                onClick={() => handleDateChange(padrao, '')}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                title="Limpar data"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {selectedDate && (
                            <p className="mt-2 text-[10px] text-blue-600 font-medium italic">
                              * Alterando o limite apenas para o dia {selectedDate.split('-').reverse().join('/')}
                            </p>
                          )}
                        </div>
                        
                        {/* Botão de Inativar para data específica ou permanente */}
                        <div className="pt-2">
                          <button
            onClick={async () => {
              const isInactive = override && override.quantidade === 0;
              const title = isInactive ? 'Reativar Missa' : 'Inativar Missa';
              const message = isInactive
                ? `Deseja reativar a ${padrao.nome}?`
                : selectedDate 
                  ? `Deseja inativar a ${padrao.nome} no dia ${selectedDate.split('-').reverse().join('/')}?`
                  : `Deseja inativar a ${padrao.nome}?`;
              
              setConfirmDialog({
                isOpen: true,
                title,
                message,
                variant: isInactive ? 'success' : 'danger',
                confirmText: isInactive ? 'Reativar' : 'Inativar',
                onConfirm: () => handleUpdateMissaPadrao(padrao, isInactive ? padrao.defaultQuantidade : 0)
              });
            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                              override && override.quantidade === 0
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {override && override.quantidade === 0 
                              ? 'Reativar Missa' 
                              : selectedDate ? 'Inativar nesta data' : 'Inativar Missa'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Gerenciar Datas Inativas */}
      {managingInactiveDates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Gerenciar Datas Inativas
              </h3>
              <button onClick={() => setManagingInactiveDates(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm font-bold text-blue-900">{managingInactiveDates.nome}</p>
                <p className="text-xs text-blue-700">
                  {managingInactiveDates.frequencia === 'mensal-data'
                    ? `Mensal (Dia ${managingInactiveDates.diaMes}) às ${managingInactiveDates.horario}`
                    : `${managingInactiveDates.frequencia === 'diaria' ? 'Diária' : managingInactiveDates.frequencia === 'semanal' ? 'Semanal' : managingInactiveDates.frequencia === 'quinzenal' ? 'Quinzenal' : managingInactiveDates.frequencia === 'mensal-1' ? 'Mensal (1ª sem)' : managingInactiveDates.frequencia === 'mensal-2' ? 'Mensal (2ª sem)' : managingInactiveDates.frequencia === 'mensal-3' ? 'Mensal (3ª sem)' : managingInactiveDates.frequencia === 'mensal-4' ? 'Mensal (4ª sem)' : 'Mensal'} - ${['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][parseInt(managingInactiveDates.diaSemana || '0')]} às ${managingInactiveDates.horario}`}
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Próximas Ocorrências</p>
                {getNextOccurrences(managingInactiveDates).map(date => {
                  const isInactive = managingInactiveDates.datasInativas?.includes(date);
                  return (
                    <div key={date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">
                        {date.split('-').reverse().join('/')}
                      </span>
                      <button
                        onClick={() => handleToggleInactiveDate(managingInactiveDates.id, date)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          isInactive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {isInactive ? 'Inativa' : 'Ativa'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setManagingInactiveDates(null)}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingMissa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Editar Missa Definitiva
              </h3>
              <button onClick={() => setEditingMissa(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateMissaSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Nome da Missa</label>
                <input
                  type="text"
                  name="nome"
                  value={editingMissa.nome}
                  onChange={handleEditMissaChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Frequência</label>
                  <select
                    name="frequencia"
                    value={editingMissa.frequencia}
                    onChange={handleEditMissaChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal-1">Mensal (1ª sem)</option>
                    <option value="mensal-2">Mensal (2ª sem)</option>
                    <option value="mensal-3">Mensal (3ª sem)</option>
                    <option value="mensal-4">Mensal (4ª sem)</option>
                    <option value="mensal-data">Mensal (Dia fixo)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Horário</label>
                  <input
                    type="time"
                    name="horario"
                    value={editingMissa.horario}
                    onChange={handleEditMissaChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {editingMissa.frequencia === 'mensal-data' ? (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Dia do Mês</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    name="diaMes"
                    value={editingMissa.diaMes}
                    onChange={handleEditMissaChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Dia da Semana</label>
                  <select
                    name="diaSemana"
                    value={editingMissa.diaSemana}
                    onChange={handleEditMissaChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="0">Domingo</option>
                    <option value="1">Segunda-feira</option>
                    <option value="2">Terça-feira</option>
                    <option value="3">Quarta-feira</option>
                    <option value="4">Quinta-feira</option>
                    <option value="5">Sexta-feira</option>
                    <option value="6">Sábado</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Vagas (Ministros)</label>
                <input
                  type="number"
                  name="quantidade"
                  value={editingMissa.quantidade}
                  onChange={handleEditMissaChange}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMissa(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5" />
          Configurar Nova Missa Extra
        </h3>
        <form onSubmit={handleNovaMissaSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-blue-900">Frequência</label>
              <select
                name="frequencia"
                value={novaMissa.frequencia}
                onChange={handleNovaMissaChange}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              >
                <option value="temporaria">Temporária (Data Única)</option>
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal (1ª e 3ª semana)</option>
                <option value="mensal-1">Mensal (1ª semana do mês)</option>
                <option value="mensal-2">Mensal (2ª semana do mês)</option>
                <option value="mensal-3">Mensal (3ª semana do mês)</option>
                <option value="mensal-4">Mensal (4ª semana do mês)</option>
                <option value="mensal-data">Mensal (Dia específico do mês)</option>
              </select>
            </div>

            {novaMissa.frequencia === 'temporaria' ? (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-blue-900">Data</label>
                <input
                  type="date"
                  name="data"
                  value={novaMissa.data}
                  onChange={handleNovaMissaChange}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            ) : novaMissa.frequencia === 'mensal-data' ? (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-blue-900">Dia do Mês</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="diaMes"
                  value={novaMissa.diaMes}
                  onChange={handleNovaMissaChange}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-blue-900">Dia da Semana</label>
                <select
                  name="diaSemana"
                  value={novaMissa.diaSemana}
                  onChange={handleNovaMissaChange}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="0">Domingo</option>
                  <option value="1">Segunda-feira</option>
                  <option value="2">Terça-feira</option>
                  <option value="3">Quarta-feira</option>
                  <option value="4">Quinta-feira</option>
                  <option value="5">Sexta-feira</option>
                  <option value="6">Sábado</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-blue-900">Horário</label>
              <input
                type="time"
                name="horario"
                value={novaMissa.horario}
                onChange={handleNovaMissaChange}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-blue-900">Nome da Missa</label>
              <input
                type="text"
                name="nome"
                value={novaMissa.nome}
                onChange={handleNovaMissaChange}
                placeholder="Ex: Missa de Cura"
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-blue-900">Vagas (Ministros)</label>
              <input
                type="number"
                name="quantidade"
                value={novaMissa.quantidade}
                onChange={handleNovaMissaChange}
                min="1"
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            Salvar Missa
          </button>
        </form>
      </div>

      {missasExtras.length > 0 && (
        <div className="mt-8">
          <h3 id="lista-missas-cadastradas" className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              Gerenciar Missas Extras Cadastradas ({missasExtras.length})
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Limpar Missas Fixas',
                    message: 'Atenção: Deseja excluir TODAS as missas definitivas?',
                    variant: 'danger',
                    confirmText: 'Sim, excluir todas',
                    onConfirm: async () => {
                      try {
                        const res = await fetch(`/api/missas-temporarias/fixas?paroquia=${encodeURIComponent(user.paroquia || '')}`, { method: 'DELETE' });
                        if (res.ok) {
                          setMessage('Todas as missas fixas foram excluídas com sucesso!');
                          fetchMissasTemporarias();
                        } else {
                          setError('Erro ao excluir missas fixas.');
                        }
                      } catch (err) {
                        setError('Erro ao excluir missas fixas.');
                      }
                    }
                  });
                }}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors"
              >
                Limpar fixas
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Limpar Missas Temporárias',
                    message: 'Atenção: Deseja excluir TODAS as missas temporárias?',
                    variant: 'danger',
                    confirmText: 'Sim, excluir todas',
                    onConfirm: async () => {
                      try {
                        const res = await fetch(`/api/missas-temporarias?paroquia=${encodeURIComponent(user.paroquia || '')}`, { method: 'DELETE' });
                        if (res.ok) {
                          setMessage('Todas as missas foram excluídas com sucesso!');
                          fetchMissasTemporarias();
                        } else {
                          setError('Erro ao excluir todas as missas.');
                        }
                      } catch (err) {
                        setError('Erro ao excluir todas as missas.');
                      }
                    }
                  });
                }}
                className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full hover:bg-yellow-200 transition-colors"
              >
                Limpar temporárias
              </button>
            </div>
          </h3>
          <div className="mt-4 space-y-4">
              {missasExtras.map((missa: any) => (
                <div key={missa.id} className={`p-4 rounded-xl border flex items-center justify-between ${missa.frequencia !== 'temporaria' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${missa.frequencia !== 'temporaria' ? 'text-blue-900' : 'text-yellow-900'}`}>{missa.nome}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${missa.frequencia !== 'temporaria' ? 'bg-blue-200 text-blue-700' : 'bg-yellow-200 text-yellow-700'}`}>
                        {missa.frequencia !== 'temporaria' ? 'Definitiva' : 'Temporária'}
                      </span>
                    </div>
                    <p className={`text-sm ${missa.frequencia !== 'temporaria' ? 'text-blue-700' : 'text-yellow-700'}`}>
                      {missa.frequencia !== 'temporaria' 
                        ? missa.frequencia === 'mensal-data'
                          ? `Mensal (Dia ${missa.diaMes}) às ${missa.horario}`
                          : `${missa.frequencia === 'diaria' ? 'Diária' : missa.frequencia === 'semanal' ? 'Semanal' : missa.frequencia === 'quinzenal' ? 'Quinzenal' : missa.frequencia === 'mensal-1' ? 'Mensal (1ª sem)' : missa.frequencia === 'mensal-2' ? 'Mensal (2ª sem)' : missa.frequencia === 'mensal-3' ? 'Mensal (3ª sem)' : missa.frequencia === 'mensal-4' ? 'Mensal (4ª sem)' : 'Mensal'} - ${['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][parseInt(missa.diaSemana || '0')]} às ${missa.horario}`
                        : `${missa.data.split('-').reverse().join('/')} às ${missa.horario}`}
                    </p>
                    <p className={`text-xs font-medium mt-1 ${missa.frequencia !== 'temporaria' ? 'text-blue-600' : 'text-yellow-600'}`}>Vagas: {missa.quantidade} ministros</p>
                    
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ajustar Vagas:</span>
                        <div className={`flex items-center bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${pendingUpdates.has(missa.id) ? 'opacity-50 grayscale pointer-events-none' : 'border-slate-200'}`}>
                          <button
                            onClick={() => handleUpdateQuantidade(missa.id, missa.quantidade - 1)}
                            disabled={missa.quantidade <= 0}
                            className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 transition-colors"
                            title="Diminuir Vagas"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="w-8 text-center text-sm font-bold text-slate-700 border-x border-slate-200 py-1 min-w-[2.5rem]">
                            {missa.quantidade}
                          </div>
                          <button
                            onClick={() => handleUpdateQuantidade(missa.id, missa.quantidade + 1)}
                            className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                            title="Aumentar Vagas"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {missa.frequencia !== 'temporaria' && (
                          <>
                            <button
                              onClick={() => {
                                const isInactive = missa.quantidade === 0;
                                const newVal = isInactive ? 4 : 0; 
                                const action = isInactive ? 'reativar' : 'inativar';
                                
                                setConfirmDialog({
                                  isOpen: true,
                                  title: isInactive ? 'Reativar Missa' : 'Inativar Missa',
                                  message: `Deseja ${action} a ${missa.nome}?`,
                                  variant: isInactive ? 'success' : 'danger',
                                  confirmText: isInactive ? 'Reativar' : 'Inativar',
                                  onConfirm: () => handleUpdateQuantidade(missa.id, newVal)
                                });
                              }}
                              className={`flex items-center gap-1 px-2 py-1 border rounded-lg text-xs font-bold transition-all ${
                                missa.quantidade === 0 
                                  ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                              }`}
                            >
                              {missa.quantidade === 0 ? 'Reativar' : 'Inativar'}
                            </button>

                            <button
                              onClick={() => setManagingInactiveDates(missa)}
                              className="ml-2 flex items-center gap-1 px-2 py-1 bg-white text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                            >
                              <Settings2 className="w-3 h-3" />
                              Gerenciar Datas
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                  <div className="flex flex-row gap-2">
                    {missa.frequencia !== 'temporaria' && (
                      <button
                        onClick={() => setEditingMissa(missa)}
                        className="p-2 bg-white text-blue-600 border border-blue-100 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                        title="Editar Missa"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Missa',
                            message: `Deseja excluir a ${missa.nome} às ${missa.horario}?`,
                            variant: 'danger',
                            confirmText: 'Excluir',
                            onConfirm: () => handleDeleteMissaTemporaria(missa)
                          });
                        }}
                      className="p-2 bg-white text-red-500 border border-red-100 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                      title="Excluir Missa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordenacaoMissasView;

