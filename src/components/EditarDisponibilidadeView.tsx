import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Calendar,
  Check,
  Save,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Heart,
  Sparkles,
  RefreshCw,
  Info,
  Edit,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ministro {
  id: number;
  nome: string;
  telefone?: string;
  tipo?: "individual" | "casal";
  nomeConjuge?: string;
  paroquia?: string;
  nomeExibicao?: string;
  nomeExibicaoConjuge?: string;
  ativo?: boolean;
}

interface SlotDisponivel {
  id: string;
  data: string;
  diaFormatado?: string;
  horario: string;
  nome: string;
  tipo?: string;
}

interface EditarDisponibilidadeViewProps {
  user: any;
  ministros: Ministro[];
  disponibilidades: any[];
  slotsDisponiveisApp: SlotDisponivel[];
  mesSelecionado: number | string;
  anoSelecionado: number | string;
  onRefreshDisponibilidades: () => void;
  onAlert?: (msg: string, type?: "success" | "error" | "info") => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const normalizeStr = (str: string | undefined | null) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export const EditarDisponibilidadeView: React.FC<EditarDisponibilidadeViewProps> = ({
  user,
  ministros,
  disponibilidades,
  slotsDisponiveisApp,
  mesSelecionado,
  anoSelecionado,
  onRefreshDisponibilidades,
  onAlert
}) => {
  const [selectedMinister, setSelectedMinister] = useState<Ministro | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<
    Record<string, { data: string; horario: string; nomeMissa: string; modo: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filter ministers by user's parish
  const parishMinisters = useMemo(() => {
    const userParoquiaNorm = normalizeStr(user?.paroquia);
    return ministros
      .filter((m) => {
        if (!userParoquiaNorm) return true;
        const mParoquiaNorm = normalizeStr(m.paroquia);
        return !mParoquiaNorm || mParoquiaNorm === userParoquiaNorm;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [ministros, user?.paroquia]);

  // Filtered by search query
  const filteredMinisters = useMemo(() => {
    if (!searchQuery.trim()) return parishMinisters;
    const q = normalizeStr(searchQuery);
    return parishMinisters.filter((m) => {
      const name = normalizeStr(m.nome);
      const conj = normalizeStr(m.nomeConjuge);
      const phone = m.telefone ? m.telefone.replace(/\D/g, "") : "";
      return name.includes(q) || conj.includes(q) || phone.includes(q);
    });
  }, [parishMinisters, searchQuery]);

  // Map of ministers who have already submitted availability for the target month
  const submittedMinistersMap = useMemo(() => {
    const map = new Map<number, { count: number; slots: any[] }>();
    disponibilidades.forEach((d: any) => {
      const slotsForMonth = (d.disponibilidade || []).filter((slot: any) => {
        if (!slot.data) return false;
        const [y, m] = slot.data.split("-").map(Number);
        return m === Number(mesSelecionado) && y === Number(anoSelecionado);
      });

      if (slotsForMonth.length > 0) {
        if (d.ministro_id) {
          map.set(Number(d.ministro_id), { count: slotsForMonth.length, slots: slotsForMonth });
        } else if (d.nome) {
          // Fallback match by name
          const mMatch = parishMinisters.find(
            (p) => normalizeStr(p.nome) === normalizeStr(d.nome)
          );
          if (mMatch) {
            map.set(mMatch.id, { count: slotsForMonth.length, slots: slotsForMonth });
          }
        }
      }
    });
    return map;
  }, [disponibilidades, mesSelecionado, anoSelecionado, parishMinisters]);

  // When selected minister changes or month/year changes, load their availability
  useEffect(() => {
    if (!selectedMinister) {
      setSelectedSlots({});
      return;
    }

    const loadMinisterAvailability = async () => {
      setLoading(true);
      setStatusMessage(null);
      try {
        let fetchedSlots: any[] = [];
        if (selectedMinister.telefone) {
          const res = await fetch(
            `/api/disponibilidade/${encodeURIComponent(selectedMinister.telefone)}?mes=${mesSelecionado}&ano=${anoSelecionado}`
          );
          if (res.ok) {
            fetchedSlots = await res.json();
          }
        }

        // If fetch yielded nothing, check submittedMinistersMap
        if (fetchedSlots.length === 0) {
          const sub = submittedMinistersMap.get(selectedMinister.id);
          if (sub && sub.slots) {
            fetchedSlots = sub.slots;
          }
        }

        const slotMap: Record<string, { data: string; horario: string; nomeMissa: string; modo: string }> = {};
        fetchedSlots.forEach((s: any) => {
          const key = `${s.data}_${s.horario}_${normalizeStr(s.nomeMissa || s.nome)}`;
          slotMap[key] = {
            data: s.data,
            horario: s.horario,
            nomeMissa: s.nomeMissa || s.nome || "",
            modo: s.modo || (selectedMinister.tipo === "casal" ? "casal" : "individual")
          };
        });

        setSelectedSlots(slotMap);
      } catch (err) {
        console.error("Erro ao carregar disponibilidade do ministro:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMinisterAvailability();
  }, [selectedMinister, mesSelecionado, anoSelecionado]);

  // Organize slots by day
  const slotsPorDiaMap = useMemo(() => {
    return (slotsDisponiveisApp || []).reduce(
      (acc: Record<string, { diaFormatado: string; slots: SlotDisponivel[] }>, slot) => {
        if (!slot || !slot.data) return acc;
        if (!acc[slot.data]) {
          let diaFmt = slot.diaFormatado;
          if (!diaFmt) {
            try {
              diaFmt = format(parseISO(slot.data), "EEEE, dd 'de' MMMM", { locale: ptBR });
            } catch {
              diaFmt = slot.data;
            }
          }
          acc[slot.data] = {
            diaFormatado: diaFmt,
            slots: []
          };
        }
        acc[slot.data].slots.push(slot);
        return acc;
      },
      {}
    );
  }, [slotsDisponiveisApp]);

  // Slot toggle handlers
  const handleToggleSlotIndividual = (slot: SlotDisponivel) => {
    const key = `${slot.data}_${slot.horario}_${normalizeStr(slot.nome)}`;
    setSelectedSlots((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          data: slot.data,
          horario: slot.horario,
          nomeMissa: slot.nome,
          modo: "individual"
        };
      }
      return next;
    });
  };

  const handleSetSlotModoCasal = (slot: SlotDisponivel, modo: string) => {
    const key = `${slot.data}_${slot.horario}_${normalizeStr(slot.nome)}`;
    setSelectedSlots((prev) => {
      const next = { ...prev };
      if (next[key] && next[key].modo === modo) {
        // Toggle off if same mode clicked
        delete next[key];
      } else {
        next[key] = {
          data: slot.data,
          horario: slot.horario,
          nomeMissa: slot.nome,
          modo
        };
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedSlots({});
  };

  // Save updated availability
  const handleSave = async () => {
    if (!selectedMinister) return;

    setSaving(true);
    setStatusMessage(null);

    const slotList = Object.values(selectedSlots);

    const payload = {
      ministro_id: selectedMinister.id,
      nome: selectedMinister.nome,
      telefone: selectedMinister.telefone || "",
      tipo: selectedMinister.tipo || "individual",
      nomeConjuge: selectedMinister.nomeConjuge || "",
      paroquia: selectedMinister.paroquia || user.paroquia,
      disponibilidade: slotList,
      isCoordenador: true,
      role: user.role
    };

    try {
      const res = await fetch("/api/disponibilidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar disponibilidade.");
      }

      setStatusMessage({
        text: `Disponibilidade de ${selectedMinister.nome} salva com sucesso! (${slotList.length} missas selecionadas)`,
        type: "success"
      });

      if (onAlert) {
        onAlert(`Disponibilidade de ${selectedMinister.nome} atualizada!`, "success");
      }

      onRefreshDisponibilidades();
    } catch (err: any) {
      console.error("Erro ao salvar disponibilidade:", err);
      setStatusMessage({
        text: err.message || "Ocorreu um erro ao salvar a disponibilidade.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = MONTH_NAMES[Number(mesSelecionado) - 1] || mesSelecionado;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-[600px] font-sans">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              Editar Disponibilidade de Ministro
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione um ministro e preencha ou altere os dias e missas disponíveis para{" "}
              <span className="font-bold text-blue-600">
                {monthLabel} / {anoSelecionado}
              </span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto bg-slate-100/80 p-1 rounded-xl text-xs">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="font-black text-slate-700 uppercase px-1">
            {monthLabel} {anoSelecionado}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Minister Selection */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
          <div className="mb-4">
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
              1. Selecionar Ministro ({parishMinisters.length})
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ministro por nome ou telefone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* List of Ministers */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredMinisters.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Nenhum ministro encontrado.
              </div>
            ) : (
              filteredMinisters.map((m) => {
                const isSelected = selectedMinister?.id === m.id;
                const submission = submittedMinistersMap.get(m.id);
                const isCouple = m.tipo === "casal";

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMinister(m)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {m.nomeExibicao || m.nome}
                        </span>
                        {isCouple && (
                          <span className="text-[9px] font-extrabold bg-pink-100 text-pink-700 px-1.5 py-0.2 rounded-md uppercase">
                            Casal
                          </span>
                        )}
                      </div>
                      {isCouple && m.nomeConjuge && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          Cônjuge: {m.nomeExibicaoConjuge || m.nomeConjuge}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {m.telefone || "Sem telefone registrado"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {submission ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                          <Check className="w-3 h-3" />
                          {submission.count} missas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">
                          Pendente
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Slot Selection Grid */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[650px]">
          {!selectedMinister ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-bold text-sm text-slate-600">Nenhum ministro selecionado</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Selecione um ministro na lista ao lado para carregar e editar suas opções de disponibilidade.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-5">
              {/* Minister Header */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">
                      {selectedMinister.nomeExibicao || selectedMinister.nome}
                    </h4>
                    {selectedMinister.tipo === "casal" && selectedMinister.nomeConjuge && (
                      <span className="text-xs font-medium text-slate-600">
                        e {selectedMinister.nomeExibicaoConjuge || selectedMinister.nomeConjuge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tipo:{" "}
                    <span className="font-bold text-slate-700">
                      {selectedMinister.tipo === "casal" ? "Casal" : "Individual"}
                    </span>{" "}
                    | Tel: {selectedMinister.telefone || "Não informado"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
                    {Object.keys(selectedSlots).length} missas selecionadas
                  </span>
                  {Object.keys(selectedSlots).length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors text-xs font-bold"
                      title="Limpar seleção"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slots Grid */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 max-h-[480px] custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs font-bold">Carregando disponibilidade do ministro...</p>
                  </div>
                ) : Object.keys(slotsPorDiaMap).length === 0 ? (
                  <div className="text-center py-16 text-slate-400 italic">
                    Nenhuma missa configurada no sistema para este mês.
                  </div>
                ) : (
                  Object.entries(slotsPorDiaMap).map(([dateStr, { diaFormatado, slots }]) => (
                    <div key={dateStr} className="space-y-2">
                      <h5 className="text-xs font-black uppercase text-blue-700 tracking-wider bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/60 inline-block">
                        {diaFormatado}
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {slots.map((slot) => {
                          const slotKey = `${slot.data}_${slot.horario}_${normalizeStr(slot.nome)}`;
                          const selectedInfo = selectedSlots[slotKey];
                          const isSelected = !!selectedInfo;

                          if (selectedMinister.tipo === "casal") {
                            return (
                              <div
                                key={slotKey}
                                className={`p-3.5 rounded-xl border transition-all ${
                                  isSelected
                                    ? "bg-blue-50/40 border-blue-400 ring-1 ring-blue-400/30"
                                    : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-xs font-black text-slate-900 block">
                                      {slot.horario} - {slot.nome}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Opções do Casal:
                                </p>

                                <div className="grid grid-cols-3 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSetSlotModoCasal(slot, "casal")}
                                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all text-center cursor-pointer ${
                                      selectedInfo?.modo === "casal"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    👥 Ambos
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetSlotModoCasal(slot, "esposo")}
                                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all text-center cursor-pointer ${
                                      selectedInfo?.modo === "esposo"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                    title={selectedMinister.nome}
                                  >
                                    👨 Apenas Ele
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetSlotModoCasal(slot, "esposa")}
                                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all text-center cursor-pointer ${
                                      selectedInfo?.modo === "esposa"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                    title={selectedMinister.nomeConjuge || "Cônjuge"}
                                  >
                                    👩 Apenas Ela
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // Individual Minister Slot Card
                          return (
                            <button
                              type="button"
                              key={slotKey}
                              onClick={() => handleToggleSlotIndividual(slot)}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div>
                                <span className="text-xs font-extrabold block leading-snug">
                                  {slot.horario} - {slot.nome}
                                </span>
                                <span
                                  className={`text-[10px] font-bold block mt-1 uppercase tracking-wider ${
                                    isSelected ? "text-blue-100" : "text-slate-400"
                                  }`}
                                >
                                  {isSelected ? "Disponível" : "Clique para selecionar"}
                                </span>
                              </div>

                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected
                                    ? "bg-white text-blue-600 border-white"
                                    : "bg-slate-50 border-slate-200 text-transparent"
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">
                  Total: <strong className="text-slate-900">{Object.keys(selectedSlots).length} missas</strong>{" "}
                  selecionadas para este ministro.
                </span>

                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Disponibilidade do Ministro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
