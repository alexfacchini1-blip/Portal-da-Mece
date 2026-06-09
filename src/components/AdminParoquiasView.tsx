import React, { useState, useEffect } from 'react';

interface Paroquia {
  id: string;
  nome: string;
  status: 'testes' | 'bloqueado' | 'ativo';
}

interface AdminParoquiasViewProps {
  user: any;
  onCustomConfirm: (message: string, onConfirm: () => void) => void;
}

export function AdminParoquiasView({ user, onCustomConfirm }: AdminParoquiasViewProps) {
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchParoquias = async () => {
    try {
      const res = await fetch('/api/paroquias');
      const data = await res.json();
      setParoquias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar paróquias:', err);
      setParoquias([]);
    }
  };

  useEffect(() => {
    fetchParoquias();
  }, []);

  if (user.role !== 'admin') return <p>Acesso negado.</p>;

  return (
    <div className="space-y-6">
      {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">{message}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold">{error}</div>}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">Administração de Paróquias</h3>
        <div className="space-y-4">
          {paroquias.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-sm">{p.nome}</p>
                <div className="flex items-center gap-4">
                  {p.status === 'testes' && (
                    <input
                      type="date"
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
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
