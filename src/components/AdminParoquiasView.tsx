import React, { useState, useEffect, useMemo } from 'react';
import { Info, Search } from 'lucide-react';

interface Paroquia {
  id: string;
  nome: string;
  status: 'testes' | 'bloqueado' | 'ativo';
  coordenador?: string;
  padre?: string;
  cidade?: string;
  estado?: string;
  dataBloqueio?: string;
}

interface AdminParoquiasViewProps {
  user: any;
  onCustomConfirm: (message: string, onConfirm: () => void) => void;
}

export function AdminParoquiasView({ user, onCustomConfirm }: AdminParoquiasViewProps) {
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCidade, setFilterCidade] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const fetchParoquias = async () => {
    try {
      const res = await fetch('/api/paroquias');
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro ao parsear paróquias:", text);
        throw new Error("Resposta inválida do servidor.");
      }
      
      console.log("[DEBUG] Paróquias recebidas:", data);
      setParoquias(Array.isArray(data) ? data : []);
    } catch (err) {
      const isNet = err instanceof Error && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("network") || err.message.includes("Failed to fetch") || err.message.includes("HTTP"));
      if (isNet) {
        console.warn("Aviso de conexão ao buscar paróquias (admin):", err instanceof Error ? err.message : err);
        setError("Erro de conexão ao buscar paróquias. Verifique se o servidor está ativo.");
      } else {
        console.error("Erro ao buscar paróquias:", err);
        setError("Erro ao buscar paróquias. " + (err instanceof Error ? err.message : "Verifique a conexão."));
      }
      setParoquias([]);
    }
  };

  useEffect(() => {
    console.log("[DEBUG] AdminParoquiasView montada. Usuario:", user);
    fetchParoquias();
  }, []);

  // Get unique cities and states for filters
  const uniqueCidades = useMemo(() => {
    const cities = paroquias
      .map((p) => p.cidade?.trim())
      .filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [paroquias]);

  const uniqueEstados = useMemo(() => {
    const states = paroquias
      .map((p) => p.estado?.trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(states)).sort();
  }, [paroquias]);

  // Apply search and filter criteria
  const filteredParoquias = useMemo(() => {
    return paroquias.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.coordenador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.padre?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCidade =
        !filterCidade ||
        p.cidade?.toLowerCase().trim() === filterCidade.toLowerCase().trim();

      const matchesEstado =
        !filterEstado ||
        p.estado?.toLowerCase().trim() === filterEstado.toLowerCase().trim();

      return matchesSearch && matchesCidade && matchesEstado;
    });
  }, [paroquias, searchTerm, filterCidade, filterEstado]);

  if (user.role !== 'admin') return <p>Acesso negado. Role atual: {user.role}</p>;
  
  console.log("[DEBUG] Renderizando paróquias filtradas:", filteredParoquias.length);

  return (
    <div className="space-y-6">
      {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">{message}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold">{error}</div>}

      {/* Filters box matching the layout of the uploaded image */}
      <div className="bg-white/80 p-5 rounded-3xl border border-slate-200/95 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Nome da Paróquia ou Coordenador
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* City Filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Filtrar por Cidade
            </label>
            <select
              value={filterCidade}
              onChange={(e) => setFilterCidade(e.target.value)}
              className="w-full px-3.5 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">Todas as Cidades</option>
              {uniqueCidades.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Estado
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-3.5 h-11 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">Todos</option>
              {uniqueEstados.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterCidade('');
                setFilterEstado('');
              }}
              className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-bold text-xs rounded-xl tracking-wider uppercase transition-all border border-slate-200/60"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Administração de Paróquias</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Gerencie status e bloqueios das paróquias nesta aba.
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {filteredParoquias.length === 0 && !error && (
            <p className="text-center text-slate-500 py-10 font-medium">
              {paroquias.length === 0 
                ? "Nenhuma paróquia cadastrada no sistema." 
                : "Nenhuma paróquia encontrada para os filtros selecionados."}
            </p>
          )}
          {filteredParoquias.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-sm">{p.nome}</p>
                <div className="flex items-center gap-4">
                  {p.status === 'testes' && (
                    <input
                      type="date"
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      value={p.dataBloqueio || ''}
                      onChange={async (e) => {
                        const date = e.target.value;
                        if (date) {
                          try {
                            await fetch(`/api/paroquias/${p.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ dataBloqueio: date })
                            });
                            setMessage(`Data de bloqueio definida para ${date}.`);
                            fetchParoquias();
                          } catch (err) {
                            setError('Erro ao salvar data de bloqueio.');
                          }
                        }
                      }}
                    />
                  )}
                  <select
                    value={p.status || 'ativo'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const res = await fetch(`/api/paroquias/${p.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: newStatus })
                        });
                        if (res.ok) {
                          setMessage(`Status da paróquia ${p.nome} alterado para ${newStatus}.`);
                          fetchParoquias();
                          setTimeout(() => setMessage(''), 3000);
                        } else {
                          setError('Erro ao atualizar status da paróquia.');
                        }
                      } catch (err) {
                        setError('Erro ao atualizar status da paróquia.');
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="testes">Teste</option>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="ativo">Ativo</option>
                  </select>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
