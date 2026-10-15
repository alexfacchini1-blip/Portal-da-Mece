import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Plus, X, Trash2, Clock, Calendar, Info } from "lucide-react";
import { hasCoordAccess, safeFetchJson } from "../utils";
import { getCalendarioLiturgico, getLiturgicalThemeDynamic } from "../utils/calendario";

const getThemeClasses = (theme: string) => {
  const themes: Record<string, any> = {
    purple: {
      border: "border-purple-200",
      bgHeader: "bg-purple-50",
      textHeader: "text-purple-900",
      icon: "text-purple-500",
      selected: "bg-purple-600 border-purple-600 text-white",
      hover: "hover:border-purple-300 hover:bg-purple-50",
      badge: "bg-purple-100 text-purple-700",
      buttonSelected: "bg-purple-600 text-white",
      button: "text-purple-600 hover:bg-purple-50",
      textMissa: "text-purple-100",
      textMissaUnselected: "text-slate-500",
    },
    red: {
      border: "border-red-200",
      bgHeader: "bg-red-50",
      textHeader: "text-red-900",
      icon: "text-red-500",
      selected: "bg-red-600 border-red-600 text-white",
      hover: "hover:border-red-300 hover:bg-red-50",
      badge: "bg-red-100 text-red-700",
      buttonSelected: "bg-red-600 text-white",
      button: "text-red-600 hover:bg-red-50",
      textMissa: "text-red-100",
      textMissaUnselected: "text-slate-500",
    },
    green: {
      border: "border-emerald-200",
      bgHeader: "bg-emerald-50",
      textHeader: "text-emerald-900",
      icon: "text-emerald-500",
      selected: "bg-emerald-600 border-emerald-600 text-white",
      hover: "hover:border-emerald-300 hover:bg-emerald-50",
      badge: "bg-emerald-100 text-emerald-700",
      buttonSelected: "bg-emerald-600 text-white",
      button: "text-emerald-600 hover:bg-emerald-50",
      textMissa: "text-emerald-100",
      textMissaUnselected: "text-slate-500",
    },
    white: {
      border: "border-slate-200",
      bgHeader: "bg-slate-50",
      textHeader: "text-slate-900",
      icon: "text-slate-500",
      selected: "bg-slate-600 border-slate-600 text-white",
      hover: "hover:border-slate-300 hover:bg-slate-50",
      badge: "bg-slate-100 text-slate-800",
      buttonSelected: "bg-slate-600 text-white",
      button: "text-slate-600 hover:bg-slate-50",
      textMissa: "text-slate-100",
      textMissaUnselected: "text-slate-500",
    },
  };
  return themes[theme] || themes.green;
};

export default function CalendarioCatolicoView({ voltar, slots, user, escala, myAssignments, isTab = false }) {
  const [dataAtual, setDataAtual] = useState(new Date()); // Inicia no mês atual
  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [ministersList, setMinistersList] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedDayEvent, setSelectedDayEvent] = useState<{
    dia: number;
    dataString: string;
    eventos: any[];
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titulo: "",
    data: "",
    horario: "",
    tipo: "reuniao",
    descricao: "",
    paroquia: user?.paroquia || "",
    destinatario: "todos",
    alvoIds: [] as string[],
    alvoNomes: [] as string[],
  });

  const canManageEvents = hasCoordAccess(user);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const url = user?.paroquia
        ? `/api/eventos?paroquia=${encodeURIComponent(user.paroquia)}`
        : "/api/eventos";
      const data = await safeFetchJson<any[]>(url, undefined, []);
      setCustomEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao buscar eventos:", e);
    } finally {
      setLoadingEvents(false);
    }
  }, [user?.paroquia]);

  useEffect(() => {
    fetchEvents();
    if (user?.paroquia) {
      safeFetchJson<any[]>(`/api/admin/ministros?paroquia=${encodeURIComponent(user.paroquia)}`, undefined, [])
        .then(data => {
          if (Array.isArray(data)) setMinistersList(data);
        })
        .catch(err => console.error("Erro ao buscar ministros:", err));
    }
  }, [fetchEvents, user?.paroquia]);

  const isLiderUser = useMemo(() => {
    if (!user) return false;
    // Check profile flags - only registered leaders or coordination can be leader users
    const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    if (isLoggedAsConjuge) {
      return Boolean(user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');
    } else {
      return Boolean(user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');
    }
  }, [user]);

  const getEventosDoDia = (dia: number) => {
    const dataObj = new Date(
      dataAtual.getFullYear(),
      dataAtual.getMonth(),
      dia,
    );
    const yyyy = dataObj.getFullYear();
    const mm = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    const dataString = `${yyyy}-${mm}-${dd}`;
    const diaDaSemana = dataObj.getDay();
    const eventos: any[] = [];

    const liturgicalTheme = getLiturgicalThemeDynamic(dataString);
    const themeClasses = getThemeClasses(liturgicalTheme);

    // Preceitos e Santos
    const calendarioDoAno = getCalendarioLiturgico(dataAtual.getFullYear());
    const preceito = calendarioDoAno.find((p) => p.data === dataString);
    if (preceito) {
      eventos.push({
        tipo: "preceito",
        nome: preceito.nome,
        cor: `${themeClasses.badge} border ${themeClasses.border}`,
      });
    }

    // Missa em Oração a Coroa de Santa Rita
    const isSantaRita =
      user?.paroquia?.trim() === "Paróquia Santa Rita de Cássia";
    if (dia === 22 && diaDaSemana !== 0 && diaDaSemana !== 6 && isSantaRita) {
      eventos.push({
        tipo: "missa",
        nome: "Missa em Oração a Coroa de Santa Rita",
        cor: "bg-rose-100 text-rose-700 border border-rose-200",
      });
    }

    // Missas dos Slots
    if (slots) {
      const slotsDoDia = slots.filter((s: any) => {
        if (s.data !== dataString) return false;
        const d = new Date(s.data + "T12:00:00");
        const dw = d.getDay();
        return dw !== 0 && dw !== 6;
      });
      const nomesMissas = [
        ...new Set(
          slotsDoDia.map((s: any) => {
            if (s.tipo === "sagrado") return "Sagrado Coração";
            if (s.tipo === "penitencial") return "Missa Penitencial";
            if (s.tipo === "cura") return "Missa com Benção do Santíssimo";
            return s.nome;
          }),
        ),
      ];

      nomesMissas.forEach((nome: any) => {
        let cor = "bg-slate-100 text-slate-700 border border-slate-200";
        if (nome.includes("Penitencial"))
          cor = "bg-purple-100 text-purple-700 border border-purple-200";
        else if (nome.includes("Sagrado"))
          cor = "bg-red-100 text-red-700 border border-red-200";
        else if (nome.includes("Santíssimo"))
          cor = "bg-slate-100 text-slate-700 border border-slate-200";
        else if (nome.includes("Santa Rita"))
          cor = "bg-rose-100 text-rose-700 border border-rose-200";

        eventos.push({ tipo: "missa", nome, cor });
      });
    }

    // Eventos customizados da coordenação e agenda do admin
    const customEvts = customEvents.filter((e) => {
      if (e.data !== dataString) return false;
      if (e.criadoPorAdmin && !hasCoordAccess(user)) return false;
      
      // Filter by recipient for non-coordinators
      if (!hasCoordAccess(user) && !user?.isTesoureiro && e.destinatario && e.destinatario !== 'todos') {
        if (e.destinatario === 'lideres') {
          if (!isLiderUser) return false;
        } else {
          const uId = String(user.id);
          const uName = (user.nome || user.nomeExibicao || "").toLowerCase();
          
          let matches = false;
          if (e.alvoIds && Array.isArray(e.alvoIds) && e.alvoIds.includes(uId)) {
            matches = true;
          } else if (e.alvoId && String(e.alvoId) === uId) {
            matches = true;
          } else if (e.alvoNomes && Array.isArray(e.alvoNomes)) {
            matches = e.alvoNomes.some((n: string) => uName.includes(n.toLowerCase()) || n.toLowerCase().includes(uName));
          } else if (e.alvoNome && uName) {
            matches = uName.includes(e.alvoNome.toLowerCase()) || e.alvoNome.toLowerCase().includes(uName);
          }
          if (!matches) return false;
        }
      }
      
      return true;
    });
    customEvts.forEach((evt) => {
      let cor = "bg-blue-100 text-blue-800 border border-blue-200";
      let tipoLabel = "Reunião";
      if (evt.criadoPorAdmin) {
        if (evt.tipo === "reuniao_paroquia") {
          cor = "bg-blue-50 text-blue-800 border border-blue-200";
          tipoLabel = "Reunião";
        } else if (evt.tipo === "paralisacao") {
          cor = "bg-red-50 text-red-800 border border-red-200";
          tipoLabel = "Paralisação do Sistema";
        } else if (evt.tipo === "atualizacao") {
          cor = "bg-violet-50 text-violet-800 border border-violet-200";
          tipoLabel = "Atualização do Sistema";
        } else {
          cor = "bg-slate-50 text-slate-850 border border-slate-200";
          tipoLabel = "Comunicado";
        }
      } else {
        if (evt.tipo === "formacao") {
          cor = "bg-amber-100 text-amber-800 border border-amber-200";
          tipoLabel = "Formação";
        } else if (evt.tipo === "retiro") {
          cor = "bg-emerald-100 text-emerald-800 border border-emerald-200";
          tipoLabel = "Retiro";
        } else if (evt.tipo === "evento") {
          cor = "bg-purple-100 text-purple-800 border border-purple-200";
          tipoLabel = "Evento";
        } else if (evt.tipo === "outro") {
          cor = "bg-indigo-100 text-indigo-800 border border-indigo-200";
          tipoLabel = "Outro";
        }
      }

      eventos.push({
        id: evt.id,
        isCustom: true,
        criadoPorAdmin: evt.criadoPorAdmin === true,
        tipo: evt.tipo || "reuniao",
        tipoLabel,
        nome: `${evt.horario ? evt.horario + " - " : ""}${evt.titulo}`,
        tituloRaw: evt.titulo,
        horario: evt.horario,
        descricao: evt.descricao,
        paroquia: evt.paroquia,
        criadoPor: evt.criadoPor,
        cor,
      });
    });

    return eventos;
  };

  const diasNoMes = new Date(
    dataAtual.getFullYear(),
    dataAtual.getMonth() + 1,
    0,
  ).getDate();
  const primeiroDiaSemana = new Date(
    dataAtual.getFullYear(),
    dataAtual.getMonth(),
    1,
  ).getDay();

  const prevMonth = () => {
    setDataAtual(
      new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setDataAtual(
      new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1),
    );
  };

  const openAddModal = (initialDate?: string) => {
    const todayStr = initialDate || new Date().toISOString().split("T")[0];
    setNewEvent({
      titulo: "",
      data: todayStr,
      horario: "19:30",
      tipo: "reuniao",
      descricao: "",
      paroquia: user?.paroquia || "",
      destinatario: "todos",
      alvoIds: [],
      alvoNomes: [],
    });
    setShowAddModal(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.titulo || !newEvent.data) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          criadoPor: user?.nomeExibicao || user?.nome || "Coordenação",
          paroquia: user?.paroquia || newEvent.paroquia || "todas",
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        await fetchEvents();
      }
    } catch (err) {
      console.error("Erro ao criar evento:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Deseja realmente remover este evento?")) return;
    try {
      const res = await fetch(`/api/eventos/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchEvents();
        if (selectedDayEvent) {
          setSelectedDayEvent((prev) =>
            prev
              ? {
                  ...prev,
                  eventos: prev.eventos.filter((e) => e.id !== eventId),
                }
              : null,
          );
        }
      }
    } catch (err) {
      console.error("Erro ao deletar evento:", err);
    }
  };

  const calendarContent = (
    <>
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        {/* Header do Calendário */}
        <div className="flex flex-wrap items-center justify-between p-3 gap-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h2 className="text-base font-bold text-slate-800 capitalize min-w-[140px] text-center">
              {dataAtual.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
            </button>
          </div>

          {canManageEvents && (
            <button
              onClick={() => openAddModal()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agendar Evento / Reunião
            </button>
          )}
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[60px] border-b border-r border-slate-100 bg-slate-50/30"
            ></div>
          ))}

          {/* Dias do Mês */}
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1;
            const dataObj = new Date(
              dataAtual.getFullYear(),
              dataAtual.getMonth(),
              dia,
            );
            const yyyy = dataObj.getFullYear();
            const mm = String(dataObj.getMonth() + 1).padStart(2, "0");
            const dd = String(dia).padStart(2, "0");
            const dataString = `${yyyy}-${mm}-${dd}`;
            const eventos = getEventosDoDia(dia);
            const isToday =
              new Date().toDateString() === dataObj.toDateString();
            const liturgicalTheme = getLiturgicalThemeDynamic(dataString);
            const themeClasses = getThemeClasses(liturgicalTheme);

            return (
              <div
                key={dia}
                className={`min-h-[60px] p-1 border-b border-r border-slate-100 hover:opacity-80 transition-all cursor-pointer ${isToday ? "ring-2 ring-red-500 ring-inset z-10" : ""} ${themeClasses.bgHeader}`}
                onClick={() => {
                  setSelectedDayEvent({ dia, dataString, eventos });
                  // Mark all custom events on this day as read for the user
                  try {
                    const userKey = user?.id || user?.telefone || 'guest';
                    const stored = JSON.parse(localStorage.getItem(`read_events_${userKey}`) || '[]');
                    const dayCustomEvents = customEvents.filter((evt: any) => evt.data === dataString);
                    const newIds = Array.from(new Set([...stored, ...dayCustomEvents.map((e: any) => e.id)]));
                    localStorage.setItem(`read_events_${userKey}`, JSON.stringify(newIds));
                    window.dispatchEvent(new Event('events_read_updated'));
                  } catch (e) {
                    console.error("Erro ao salvar eventos lidos:", e);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <span
                    className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-red-600 text-white" : themeClasses.textHeader}`}
                  >
                    {dia}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {eventos.map((evento, idx) => (
                    <div
                      key={idx}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium truncate ${evento.cor}`}
                    >
                      {evento.nome}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de Detalhes do Dia */}
        {selectedDayEvent && typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setSelectedDayEvent(null)}
          >
            <div
              className="bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Dia {selectedDayEvent.dia}/
                    {String(dataAtual.getMonth() + 1).padStart(2, "0")}/
                    {dataAtual.getFullYear()}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Eventos e compromissos agendados
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayEvent(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedDayEvent.eventos.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nenhum evento ou missa agendada para este dia.
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedDayEvent.eventos.map((e, i) => (
                    <li
                      key={e.id || i}
                      className={`text-xs p-2.5 rounded-xl border flex items-start justify-between gap-2 ${e.cor}`}
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          {e.tipoLabel && (
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-white/60">
                              {e.tipoLabel}
                            </span>
                          )}
                          <span>{e.tituloRaw || e.nome}</span>
                        </div>
                        {e.horario && (
                          <div className="flex items-center gap-1 text-[11px] opacity-80 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{e.horario}</span>
                          </div>
                        )}
                        {e.descricao && (
                          <p className="text-[11px] mt-1 opacity-90 leading-snug">
                            {e.descricao}
                          </p>
                        )}
                        {e.criadoPor && (
                          <p className="text-[9px] opacity-70 mt-1">
                            Agendado por: {e.criadoPor}
                          </p>
                        )}
                      </div>

                      {e.isCustom && canManageEvents && !e.criadoPorAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(e.id)}
                          title="Excluir evento"
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2 space-y-2">
                {canManageEvents && (
                  <button
                    onClick={() => {
                      const dayStr = selectedDayEvent.dataString;
                      setSelectedDayEvent(null);
                      openAddModal(dayStr);
                    }}
                    className="w-full py-2 px-3 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Agendar Evento neste Dia
                  </button>
                )}
                <button
                  onClick={() => setSelectedDayEvent(null)}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors text-center"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>, document.body
        )}

        {/* Modal de Agendar Novo Evento / Reunião */}
        {showAddModal && typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Agendar Evento / Reunião
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calendário da Coordenação
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Evento / Reunião *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reunião Geral de Ministros, Formação Litúrgica, Retiro..."
                    value={newEvent.titulo}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, titulo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={newEvent.data}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, data: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={newEvent.horario}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, horario: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={newEvent.tipo}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, tipo: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="reuniao">👥 Reunião</option>
                    <option value="formacao">📖 Formação</option>
                    <option value="retiro">✝️ Retiro</option>
                    <option value="evento">⭐ Evento Especial</option>
                    <option value="outro">📌 Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Destinatário da Reunião / Evento</span>
                    {newEvent.destinatario !== "todos" && (newEvent.alvoIds || []).length > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {(newEvent.alvoIds || []).length} selecionado(s)
                      </span>
                    )}
                  </label>
                  <select
                    value={newEvent.destinatario || "todos"}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        destinatario: e.target.value,
                        alvoIds: [],
                        alvoNomes: [],
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                  >
                    <option value="todos">👥 Todos os Ministros (Geral)</option>
                    <option value="lideres">🚩 Responsáveis pela Missa (Todos)</option>
                    <option value="casais">❤️ Casais Específicos (Múltiplos)</option>
                    <option value="individuais">👤 Ministros Específicos (Múltiplos Individual)</option>
                    <option value="custom">✨ Seleção Mista (Casais e Individuais)</option>
                  </select>
                </div>

                {(newEvent.destinatario === "lideres") && (
                  <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900">
                        Responsáveis Identificados
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Automático
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Esta reunião será visível apenas para os ministros marcados como <strong>Responsáveis pela Missa</strong> em seus perfis ou que atuam como responsáveis nas escalas.
                    </p>
                  </div>
                )}

                {(newEvent.destinatario === "casais" || newEvent.destinatario === "custom") && (
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Selecione os Casais
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allCasais = (ministersList || []).filter(m => m.tipo === 'casal' || m.nomeConjuge);
                          const allIds = allCasais.map(m => String(m.id));
                          const allNomes = allCasais.map(m => `${m.nome} e ${m.nomeConjuge || m.nomeExibicaoConjuge || 'Cônjuge'}`);
                          setNewEvent({ ...newEvent, alvoIds: allIds, alvoNomes: allNomes });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white">
                      {(ministersList || [])
                        .filter(m => m.tipo === 'casal' || m.nomeConjuge)
                        .map((m) => {
                          const mId = String(m.id);
                          const isSelected = (newEvent.alvoIds || []).includes(mId);
                          const label = `${m.nome} e ${m.nomeConjuge || m.nomeExibicaoConjuge || 'Cônjuge'}`;
                          return (
                            <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-blue-50/50 rounded-lg cursor-pointer text-xs transition-colors">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  let updatedIds = [...(newEvent.alvoIds || [])];
                                  let updatedNomes = [...(newEvent.alvoNomes || [])];
                                  if (e.target.checked) {
                                    if (!updatedIds.includes(mId)) updatedIds.push(mId);
                                    if (!updatedNomes.includes(label)) updatedNomes.push(label);
                                  } else {
                                    updatedIds = updatedIds.filter(id => id !== mId);
                                    updatedNomes = updatedNomes.filter(n => n !== label);
                                  }
                                  setNewEvent({ ...newEvent, alvoIds: updatedIds, alvoNomes: updatedNomes });
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="font-medium text-slate-800">{label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                {(newEvent.destinatario === "individuais" || newEvent.destinatario === "custom") && (
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Selecione os Ministros
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = (ministersList || []).map(m => String(m.id));
                          const allNomes = (ministersList || []).map(m => m.nomeExibicao || m.nome);
                          setNewEvent({ ...newEvent, alvoIds: allIds, alvoNomes: allNomes });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white">
                      {(ministersList || []).map((m) => {
                        const mId = String(m.id);
                        const isSelected = (newEvent.alvoIds || []).includes(mId);
                        const label = m.nomeExibicao || m.nome;
                        return (
                          <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-blue-50/50 rounded-lg cursor-pointer text-xs transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let updatedIds = [...(newEvent.alvoIds || [])];
                                let updatedNomes = [...(newEvent.alvoNomes || [])];
                                if (e.target.checked) {
                                  if (!updatedIds.includes(mId)) updatedIds.push(mId);
                                  if (!updatedNomes.includes(label)) updatedNomes.push(label);
                                } else {
                                  updatedIds = updatedIds.filter(id => id !== mId);
                                  updatedNomes = updatedNomes.filter(n => n !== label);
                                }
                                setNewEvent({ ...newEvent, alvoIds: updatedIds, alvoNomes: updatedNomes });
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-medium text-slate-800">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição / Pauta / Local (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Informações adicionais sobre o encontro..."
                    value={newEvent.descricao}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, descricao: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar e Agendar"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Legenda dos Eventos e Ano Litúrgico */}
      <div className="mt-4 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-wider text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Eventos da Coordenação
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-900">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Reunião
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Formação
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Retiro
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-50 border border-purple-100 text-[11px] font-bold text-purple-900">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Evento / Outro
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider text-slate-500">
            <Info className="w-3.5 h-3.5 text-liturgy-600" />
            Legenda do Ano Litúrgico
          </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <div>
              <p className="text-xs font-bold text-emerald-900 leading-none">
                Verde
              </p>
              <p className="text-[9px] text-emerald-600 mt-1">Tempo Comum</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-50 border border-purple-100">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
            <div>
              <p className="text-xs font-bold text-purple-900 leading-none">
                Roxo
              </p>
              <p className="text-[9px] text-purple-600 mt-1">
                Advento, Quaresma e Finados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-red-50 border border-red-100">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <div>
              <p className="text-xs font-bold text-red-900 leading-none">
                Vermelho
              </p>
              <p className="text-[9px] text-red-600 mt-1">
                Domingo de Ramos, Sexta-feira Santa, Pentecostes e Mártires
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">
                Branco / Dourado
              </p>
              <p className="text-[9px] text-slate-600 mt-1">
                Natal, Páscoa e Solenidades
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>);

  if (isTab) {
    return <div className="w-full">{calendarContent}</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-6 font-sans">
      <div className="max-w-[1000px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Calendário Litúrgico
          </h1>
          <button
            onClick={voltar}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
        {calendarContent}
      </div>
    </div>
  );
}

