import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isToday,
  isPast,
  getDay,
  isSameMonth,
  isSameYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  getMonth,
  getYear,
  setMonth,
  setYear,
  getWeek,
  addMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Calendar,
  User,
  Phone,
  Heart,
  Lock,
  BookOpen,
  Info,
  Users,
  Settings,
  MessageSquare,
  Home,
  LogOut,
  Download,
  X,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit,
  Edit2,
  Save,
  Trash2,
  Upload,
  FileText,
  Printer,
  Bell,
  Database,
  HardDrive,
  Server,
  Cloud,
  RefreshCw,
  AlertTriangle,
  List,
  LayoutDashboard,
  UserCheck,
  UserX,
  UserCog,
  UserMinus,
  UserPlus,
  Activity,
  Sun,
  Moon,
  LogIn,
  Cross,
  CalendarDays,
  Clock,
  AlertCircle,
  Clipboard,
  Loader,
  Unlock,
  Mail,
  BarChart,
  Zap,
  Church,
  MapPin,
  Gift,
  HelpCircle,
  MessageCircle,
  Reply,
  ShieldCheck,
  CheckCircle2,
  Package,
  Presentation,
} from "lucide-react";
import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import WelcomeView from "./components/WelcomeView";
import { AdminParoquiasView } from "./components/AdminParoquiasView";
import { AdminEstoqueView } from "./components/AdminEstoqueView";
import CoordenacaoCadastroView from "./components/CoordenacaoCadastroView";
import CoordenacaoMissasView from "./components/CoordenacaoMissasView";
import { ComunhaoView } from "./components/ComunhaoView";
import type {
  User as UserType,
  Disponibilidade,
  DisponibilidadeSlot,
} from "./types";
import { toTitleCase, formatPhone } from "./utils";
import {
  getCalendarioLiturgico,
  getLiturgicalThemeDynamic,
} from "./utils/calendario";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const formatDateToDDMM = (dateString: string) => {
  if (!dateString) return "";
  // Handles YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}`;
  }
  // Handles DD-MM
  if (/^\d{2}-\d{2}$/.test(dateString)) {
    return dateString.replace("-", "/");
  }
  // Handles DD/MM (returns as is)
  if (/^\d{2}\/\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Otherwise, return the original string (likely user input)
  return dateString;
};

const getEaster = (year: number) => {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

const getHolyWeekDates = (year: number) => {
  const easter = getEaster(year);
  const formatDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  };

  const domingoRamos = new Date(easter);
  domingoRamos.setDate(easter.getDate() - 7);

  const quintaSanta = new Date(easter);
  quintaSanta.setDate(easter.getDate() - 3);

  const sextaSanta = new Date(easter);
  sextaSanta.setDate(easter.getDate() - 2);

  const sabadoSanto = new Date(easter);
  sabadoSanto.setDate(easter.getDate() - 1);

  return {
    domingoRamos: formatDate(domingoRamos),
    quintaSanta: formatDate(quintaSanta),
    sextaSanta: formatDate(sextaSanta),
    sabadoSanto: formatDate(sabadoSanto),
    domingoPascoa: formatDate(easter),
  };
};

const getBirthdayMatch = (
  dateString: string | undefined,
  currentMonth: number,
  currentDay: number,
) => {
  if (!dateString) return false;

  let bMonth: number | null = null;
  let bDay: number | null = null;

  // Try YYYY-MM-DD or YYYY/MM/DD or YYYY-MM-DDTHH:mm:ss.sssZ
  const yyyyMatch = dateString.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (yyyyMatch) {
    bMonth = parseInt(yyyyMatch[2], 10);
    bDay = parseInt(yyyyMatch[3], 10);
  } else {
    // Try DD/MM/YYYY, DD-MM-YYYY, DD/MM, DD-MM
    const ddmmMatch = dateString.match(/^(\d{1,2})[-/](\d{1,2})/);
    if (ddmmMatch) {
      const p1 = parseInt(ddmmMatch[1], 10);
      const p2 = parseInt(ddmmMatch[2], 10);
      if (p2 > 12) {
        // Must be MM/DD
        bMonth = p1;
        bDay = p2;
      } else if (p1 > 12) {
        // Must be DD/MM
        bDay = p1;
        bMonth = p2;
      } else {
        // Ambiguous, assume DD/MM (Brazilian standard)
        bDay = p1;
        bMonth = p2;
      }
    }
  }

  return bMonth === currentMonth && bDay === currentDay;
};

// Calendário dinâmico agora em src/utils/calendario.ts

const getThemeClasses = (theme) => {
  const themes = {
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

function CalendarioCatolicoView({ voltar, slots, user, isTab = false }) {
  const [dataAtual, setDataAtual] = useState(new Date()); // Inicia no mês atual
  const [selectedDayEvent, setSelectedDayEvent] = useState<{
    dia: number;
    eventos: any[];
  } | null>(null);

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

  const getEventosDoDia = (dia) => {
    const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia);
    const dataString = data.toISOString().split("T")[0];
    const diaDaSemana = data.getDay();
    const eventos = [];

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

    // Missa em Oração a Coroa de Santa Rita (Todo dia 22, exceto finais de semana)
    // Regra específica para a Paróquia Santa Rita de Cássia (CNPJ 44.454.312/0024-37)
    const isSantaRita =
      user?.paroquia?.trim() === "Paróquia Santa Rita de Cássia";
    if (dia === 22 && diaDaSemana !== 0 && diaDaSemana !== 6 && isSantaRita) {
      eventos.push({
        tipo: "missa",
        nome: "Missa em Oração a Coroa de Santa Rita",
        cor: "bg-rose-100 text-rose-700 border border-rose-200",
      });
    }

    // Missas dos Slots (Dinâmico) - apenas para pegar missas extras como Penitencial, Sagrado Coração, Santíssimo
    if (slots) {
      const slotsDoDia = slots.filter((s) => {
        if (s.data !== dataString) return false;
        // Usar T12:00:00 para evitar problemas de fuso horário ao pegar o dia da semana
        const d = new Date(s.data + "T12:00:00");
        const dw = d.getDay();
        return dw !== 0 && dw !== 6;
      });
      // Remover duplicatas de nomes de missa para o mesmo dia
      const nomesMissas = [
        ...new Set(
          slotsDoDia.map((s) => {
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

    return eventos;
  };

  const calendarContent = (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header do Calendário */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="text-base font-bold text-slate-800 capitalize">
            {dataAtual.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
          </button>
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
            const dataString = dataObj.toISOString().split("T")[0];
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
                  if (eventos.length > 0) {
                    setSelectedDayEvent({ dia, eventos });
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
        {selectedDayEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => setSelectedDayEvent(null)}
          >
            <div
              className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-bold text-slate-800 mb-2 text-sm">
                Missas do dia {selectedDayEvent.dia}/{dataAtual.getMonth() + 1}
              </h4>
              <ul className="space-y-1">
                {selectedDayEvent.eventos.map((e, i) => (
                  <li key={i} className={`text-xs px-2 py-1 rounded ${e.cor}`}>
                    {e.nome}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedDayEvent(null)}
                className="mt-3 w-full text-xs text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legenda do Calendário Litúrgico */}
      <div className="mt-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-liturgy-600" />
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
    </>
  );

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

function MensagemView({
  voltar,
  onSubmit,
  mensagem,
  setMensagem,
  message,
  error,
  mensagensRecebidas = [],
  onMarcarComoLida,
  onExcluirMensagem,
  fetchMensagens,
  onCustomConfirm,
}) {
  const maxLength = 500;

  useEffect(() => {
    if (fetchMensagens) {
      fetchMensagens();
    }
  }, [fetchMensagens]);

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans pb-24 sm:pb-8">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Mensagens
            </h1>
          </div>
          <button
            onClick={voltar}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        {/* Mensagens Recebidas */}
        {mensagensRecebidas.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Mensagens da Coordenação
              </h2>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {mensagensRecebidas.length}
              </span>
            </div>
            <div className="space-y-4">
              {mensagensRecebidas.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-6 rounded-3xl shadow-sm border transition-all ${
                    msg.lida
                      ? "bg-white border-slate-200 opacity-80"
                      : "bg-white border-blue-200 ring-2 ring-blue-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${msg.lida ? "bg-slate-300" : "bg-blue-500 animate-pulse"}`}
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(msg.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {!msg.lida && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap mb-6 text-sm leading-relaxed">
                    {msg.texto}
                  </p>
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                    {!msg.lida && (
                      <button
                        onClick={async () => {
                          await onMarcarComoLida(msg.id);
                          fetchMensagens();
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Lida
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onCustomConfirm(
                          "Deseja excluir esta mensagem?",
                          async () => {
                            await onExcluirMensagem(msg.id);
                            fetchMensagens();
                          },
                        );
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-500">
              Nenhuma mensagem recebida.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Os recados da coordenação aparecerão aqui.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">
            Enviar nova mensagem
          </h2>
          <form
            onSubmit={onSubmit}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6"
          >
            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Sua Mensagem para a Coordenação
              </label>
              <textarea
                value={mensagem}
                onChange={(e) =>
                  setMensagem(e.target.value.slice(0, maxLength))
                }
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-liturgy-500 focus:ring-4 focus:ring-liturgy-500/10 outline-none transition-all min-h-[160px] text-slate-700 bg-slate-50/50"
                placeholder="Como podemos ajudar você hoje?"
                required
              />
              <div
                className={`text-[10px] font-black uppercase tracking-wider mt-2 flex justify-between ${mensagem.length >= maxLength ? "text-red-500" : "text-slate-400"}`}
              >
                <span>Faltam {maxLength - mensagem.length} caracteres</span>
                <span>
                  {mensagem.length}/{maxLength}
                </span>
              </div>
            </div>

            {message && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!mensagem.trim()}
              className="w-full bg-liturgy-600 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-liturgy-700 transition-all shadow-lg shadow-liturgy-200 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              Enviar Mensagem
              <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const normalizeId = (id: string) => {
  return id
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-]/g, "_");
};

const normalizeMassName = (name: string) => {
  if (!name) return "";
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
};

const normalizeHorario = (h: string) => {
  if (!h) return "00:00";
  const parts = h.trim().split(/[:h]/);
  if (parts.length === 0) return "00:00";
  let HH = parts[0].padStart(2, '0');
  let MM = (parts[1] || '00').padStart(2, '0');
  if (parseInt(HH) > 23) HH = "23";
  if (parseInt(MM) > 59) MM = "59";
  return `${HH}:${MM}`;
};

const getExpectedSlots = async (
  paroquiaNameProp?: string,
  mesParam?: number,
  anoParam?: number,
) => {
  console.log(
    `[DEBUG] getExpectedSlots iniciado para paróquia: "${paroquiaNameProp}", mês: ${mesParam}, ano: ${anoParam}`,
  );
  const slots = [];
  const paroquiaName = (paroquiaNameProp || "").trim();

  // Base default slots (Standard)
  const MISSAS_PADRAO = [
    {
      id: "padrao-sab-17",
      nome: "Missa de Sábado",
      frequencia: "semanal",
      diaSemana: "6",
      horario: "17:00",
      quantidade: 6,
      tipo: "padrao",
    },
    {
      id: "padrao-dom-07",
      nome: "Missa de Domingo",
      frequencia: "semanal",
      diaSemana: "0",
      horario: "07:30",
      quantidade: 5,
      tipo: "padrao",
    },
    {
      id: "padrao-dom-10",
      nome: "Missa de Domingo",
      frequencia: "semanal",
      diaSemana: "0",
      horario: "10:00",
      quantidade: 8,
      tipo: "padrao",
    },
    {
      id: "padrao-dom-19",
      nome: "Missa de Domingo",
      frequencia: "semanal",
      diaSemana: "0",
      horario: "19:00",
      quantidade: 8,
      tipo: "padrao",
    },
  ];

  // Se não passar parâmetros, calcula o próximo mês
  let targetMonth = mesParam;
  let targetYear = anoParam;

  if (!targetMonth || !targetYear) {
    const today = new Date();
    targetMonth = today.getMonth() + 2;
    targetYear = today.getFullYear();

    if (targetMonth > 12) {
      targetMonth -= 12;
      targetYear++;
    }
  }

  const ano = targetYear;
  const mes = targetMonth - 1;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  try {
    const res = await fetch(
      `/api/missas-temporarias?paroquia=${encodeURIComponent(paroquiaName)}`,
    );
    let missasTemporarias = [];
    if (res.ok) {
      missasTemporarias = await res.json();
      console.log(
        `[DEBUG] getExpectedSlots: Recebeu ${missasTemporarias.length} missas temporárias.`,
      );
    } else {
      console.error(
        `[DEBUG] getExpectedSlots: Erro ao buscar missas. Status: ${res.status}`,
      );
      // Não deve cair em MISSAS_PADRAO automaticamente
      missasTemporarias = [];
    }

    // if (missasTemporarias.length === 0) {
    //   missasTemporarias = MISSAS_PADRAO;
    // }

    missasTemporarias.forEach((mt) => {
      const isFixa = mt.frequencia === "semanal";
      const isDiaria = mt.frequencia === "diaria";
      const isQuinzenal = mt.frequencia === "quinzenal";
      const isMensal =
        mt.frequencia === "mensal" ||
        mt.frequencia?.startsWith("mensal-") ||
        mt.frequencia === "mensal-data";
      const isUnica =
        mt.frequencia === "unica" ||
        mt.frequencia === "temporaria" ||
        mt.tipo === "unica" ||
        (mt.data && !isFixa && !isDiaria && !isQuinzenal && !isMensal);

      if (isFixa || isDiaria || isQuinzenal || isMensal || isUnica) {
        const targetDiaSemana = parseInt(mt.diaSemana || "0");
        let occurrenceCount = 0;

        for (let dia = 1; dia <= ultimoDia; dia++) {
          const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const d = new Date(ano, mes, dia);

          let shouldAdd = false;
          if (isDiaria) {
            const diaSemana = d.getDay();
            console.log(
              `[DEBUG] Processando missa diária para data: ${dataStr}, diaSemana: ${diaSemana}`,
            );
            if (diaSemana !== 0 && diaSemana !== 6) {
              shouldAdd = true;
            } else {
              console.log(
                `[DEBUG] Removendo missa diária de fim de semana: ${dataStr}`,
              );
            }
          } else if (
            mt.frequencia === "mensal-data" ||
            mt.frequencia === "mensal-data-fixa"
          ) {
            if (dia === parseInt(mt.diaMes || "1")) {
              shouldAdd = true;
            }
          } else if (d.getDay() === targetDiaSemana) {
            occurrenceCount++;
            if (isFixa) {
              shouldAdd = true;
            } else if (
              isQuinzenal &&
              (occurrenceCount === 1 ||
                occurrenceCount === 3 ||
                occurrenceCount === 5)
            ) {
              shouldAdd = true;
            } else if (
              (mt.frequencia === "mensal" || mt.frequencia === "mensal-1") &&
              occurrenceCount === 1
            ) {
              shouldAdd = true;
            } else if (mt.frequencia === "mensal-2" && occurrenceCount === 2) {
              shouldAdd = true;
            } else if (mt.frequencia === "mensal-3" && occurrenceCount === 3) {
              shouldAdd = true;
            } else if (mt.frequencia === "mensal-4" && occurrenceCount === 4) {
              shouldAdd = true;
            } else if (isUnica) {
              if (dataStr === mt.data) {
                shouldAdd = true;
              }
            }
          } else if (isUnica && dataStr === mt.data) {
            // Caso frequencia seja unica mas diaSemana não bate (e.g. feriado que cai em outro dia)
            shouldAdd = true;
          }

          if (shouldAdd) {
            // Check if the date is inactive
            if (mt.datasInativas && mt.datasInativas.includes(dataStr)) {
              shouldAdd = false;
            }
          }

          if (shouldAdd && mt.quantidade > 0) {
            const diaFmt = d
              .toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })
              .replace(",", "");

            // Remove default slot if it matches
            const existingIndex = slots.findIndex(
              (s) =>
                s.data === dataStr &&
                s.horario === mt.horario &&
                s.nome === mt.nome,
            );
            if (existingIndex !== -1) {
              slots.splice(existingIndex, 1);
            }

            slots.push({
              id: normalizeId(`${dataStr}-${mt.horario}-${mt.nome}`),
              data: dataStr,
              diaFormatado: diaFmt,
              horario: mt.horario,
              nome: mt.nome,
              tipo: `fixa-${mt.id}`,
              limiteManual: mt.quantidade,
              paroquia: mt.paroquia || paroquiaName,
            });
          }
        }
      } else {
        // Single date mass
        if (!mt.data) return;

        const dataObj = new Date(mt.data + "T00:00:00");
        // Check if it's in the target month/year
        if (dataObj.getMonth() !== mes || dataObj.getFullYear() !== ano) return;

        // Check if the date is inactive or mass is inactive
        if (mt.datasInativas && mt.datasInativas.includes(mt.data)) return;
        if (mt.quantidade <= 0) return;

        const diaFormatado = dataObj
          .toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })
          .replace(",", "");

        // Remove default slot if it matches
        const existingIndex = slots.findIndex(
          (s) =>
            s.data === mt.data &&
            s.horario === mt.horario &&
            s.nome === mt.nome,
        );
        if (existingIndex !== -1) {
          slots.splice(existingIndex, 1);
        }

        slots.push({
          id: normalizeId(`${mt.data}-${mt.horario}-${mt.nome}`),
          data: mt.data,
          diaFormatado,
          horario: mt.horario,
          nome: mt.nome,
          tipo: `temp-${mt.id}`,
          limiteManual: mt.quantidade,
          paroquia: mt.paroquia || paroquiaName,
        });
      }
    });
  } catch (e) {
    console.error("Erro ao buscar missas temporárias", e);
  }

  // Sort slots by date and time
  slots.sort((a, b) => {
    const dateA = new Date(`${a.data}T${a.horario}`);
    const dateB = new Date(`${b.data}T${b.horario}`);
    return dateA.getTime() - dateB.getTime();
  });

  return slots;
};

const initialFormData = {
  nome: "",
  nomeExibicao: "",
  nomeExibicaoConjuge: "",
  telefone: "",
  nomeConjuge: "",
  dataNascimento: "",
  dataNascimentoConjuge: "",
  telefoneConjuge: "",
  paroquia: "",
  senha: "",
  senhaConjuge: "",
};

const CadastroView = ({ user, onSave, isTab, voltar, onSetView }: any) => {
  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paroquias, setParoquias] = useState([]);

  useEffect(() => {
    const fetchParoquias = async () => {
      try {
        const res = await fetch("/api/paroquias");
        let data = await res.json();
        if (Array.isArray(data)) {
          if (user && user.role !== "admin" && user.paroquia) {
            data = data.filter((p: any) => p.nome === user.paroquia);
          }
          setParoquias(data);
        } else {
          console.error("Dados de paróquias inválidos:", data);
          setParoquias([]);
        }
      } catch (err) {
        console.error("Erro ao buscar paróquias:", err);
        setParoquias([]);
      }
    };
    fetchParoquias();
  }, [user]);

  useEffect(() => {
    // Se o usuário for fornecido (edição de perfil), preenche o formulário
    if (user && user.telefone) {
      // O objeto user agora sempre vem na ordem correta do banco (titular primeiro)
      setFormData({
        nome: user.nome || "",
        nomeExibicao: user.nomeExibicao || "",
        nomeExibicaoConjuge: user.nomeExibicaoConjuge || "",
        telefone: formatPhone(user.telefone || ""),
        nomeConjuge: user.nomeConjuge || "",
        dataNascimento: formatDateToDDMM(user.dataNascimento) || "",
        dataNascimentoConjuge:
          formatDateToDDMM(user.dataNascimentoConjuge) || "",
        telefoneConjuge: formatPhone(user.telefoneConjuge || ""),
        paroquia: user.paroquia || "",
        senha: user.senha || "",
        senhaConjuge: user.senhaConjuge || "",
      });
    } else {
      // Se não houver usuário (novo cadastro), limpa o formulário
      setFormData(initialFormData);
    }
  }, [user]); // Depende do objeto user

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === "nome" ||
      name === "nomeExibicao" ||
      name === "nomeExibicaoConjuge" ||
      name === "nomeConjuge"
    ) {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    } else if (name === "dataNascimento" || name === "dataNascimentoConjuge") {
      let v = value.replace(/\D/g, "");
      if (v.length > 4) v = v.slice(0, 4);
      if (v.length > 2) {
        v = `${v.slice(0, 2)}/${v.slice(2)}`;
      }
      setFormData((prev) => ({ ...prev, [name]: v }));
    } else if (name === "telefone" || name === "telefoneConjuge") {
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === "senha" || name === "senhaConjuge") {
      const v = value.replace(/\D/g, "").slice(0, 3);
      setFormData((prev) => ({ ...prev, [name]: v }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const ddmmPattern = /^([0-9]{1,2})\/([0-9]{1,2})$/;

    if (formData.dataNascimento) {
      const match = formData.dataNascimento.match(ddmmPattern);
      if (!match) {
        setError("Formato de Data de Nascimento inválido. Use DD/MM.");
        return;
      }
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        setError("Data de Nascimento inválida.");
        return;
      }
    }

    if (
      (user.tipo === "casal" || formData.nomeConjuge) &&
      formData.dataNascimentoConjuge
    ) {
      const match = formData.dataNascimentoConjuge.match(ddmmPattern);
      if (!match) {
        setError(
          "Formato de Data de Nascimento do Cônjuge inválido. Use DD/MM.",
        );
        return;
      }
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        setError("Data de Nascimento do Cônjuge inválida.");
        return;
      }
    }

    const formatToDDMM = (dateStr) => {
      if (!dateStr) return "";
      const match = dateStr.match(ddmmPattern);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        return `${day}/${month}`;
      }
      return dateStr;
    };

    const payload = {
      ...formData,
      dataNascimento: formatToDDMM(formData.dataNascimento),
      dataNascimentoConjuge: formatToDDMM(formData.dataNascimentoConjuge),
    };

    if (!formData.nomeExibicao) {
      setError("Por favor, preencha como você quer ser chamado na escala.");
      return;
    }

    const phoneDigits = formData.telefone.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      setError(
        "O telefone deve conter exatamente 11 números (DDD + 9 dígitos).",
      );
      return;
    }

    if (formData.senha && formData.senha.length !== 3) {
      setError("A nova senha deve conter exatamente 3 números.");
      return;
    }

    if (user?.tipo === "casal") {
      if (
        !formData.nomeConjuge ||
        !formData.telefoneConjuge ||
        !formData.dataNascimentoConjuge
      ) {
        setError("Por favor, preencha todos os dados do cônjuge.");
        return;
      }
      if (!formData.nomeExibicaoConjuge) {
        setError(
          "Por favor, preencha como o cônjuge quer ser chamado na escala.",
        );
        return;
      }
      const conjugePhoneDigits = formData.telefoneConjuge.replace(/\D/g, "");
      if (conjugePhoneDigits.length !== 11) {
        setError(
          "O telefone do cônjuge deve conter exatamente 11 números (DDD + 9 dígitos).",
        );
        return;
      }
      if (formData.senhaConjuge && formData.senhaConjuge.length !== 3) {
        setError("A nova senha do cônjuge deve conter exatamente 3 números.");
        return;
      }
    }

    try {
      await onSave(payload);
      setMessage("Dados atualizados com sucesso!");
      setTimeout(() => {
        setMessage("");
        // Se for um novo cadastro (sem user.telefone), limpa o formulário e volta para o login
        if (!user || !user.telefone) {
          setFormData(initialFormData);
          if (onSetView) onSetView("login");
        } else if (onSetView && !isTab) {
          onSetView("welcome");
        }
      }, 3000);
    } catch (err) {
      setError(err.message || "Erro ao salvar dados.");
    }
  };

  return (
    <div
      className={`${isTab ? "w-full" : "bg-slate-50 min-h-screen p-4 sm:p-8"} flex flex-col font-sans pb-24`}
    >
      <div
        className={`${isTab ? "w-full" : "max-w-4xl mx-auto"} w-full space-y-8`}
      >
        {!isTab && (
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-xl">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Meus Dados
              </h1>
            </div>
            <button
              onClick={voltar}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-0 space-y-6">
          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-bold animate-pulse flex items-center gap-2">
              <Check className="w-4 h-4" />
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Only showing Personal Data as Address was removed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 ${user.tipo !== "casal" ? "lg:col-span-2" : ""}`}
            >
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                <User className="w-4 h-4 text-liturgy-500" />
                Titular
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Como quer ser chamado na escala?
                  </label>
                  <input
                    type="text"
                    name="nomeExibicao"
                    value={formData.nomeExibicao}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-bold text-liturgy-600"
                    required
                  />
                </div>
                <div className="bg-liturgy-50/50 p-6 rounded-2xl border border-liturgy-100 space-y-4">
                  <h3 className="text-[10px] font-black text-liturgy-400 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Dados de Acesso
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Paróquia Vinculada
                      </label>
                      <select
                        name="paroquia"
                        value={formData.paroquia}
                        onChange={handleChange}
                        disabled={!!user?.telefone && user.role !== "admin"}
                        className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all ${!!user?.telefone && user.role !== "admin" ? "opacity-70 cursor-not-allowed" : ""}`}
                        required
                      >
                        <option value="">Selecione sua paróquia</option>
                        {paroquias
                          .filter(
                            (p) =>
                              !user?.telefone ||
                              user.role === "admin" ||
                              p.nome === user.paroquia,
                          )
                          .map((p) => (
                            <option key={p.id} value={p.nome}>
                              {p.nome}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Alterar Senha (3 números)
                      </label>
                      <input
                        type="password"
                        name="senha"
                        value={formData.senha}
                        onChange={handleChange}
                        maxLength={3}
                        placeholder="***"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Telefone (DDD + 9 números)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-liturgy-500 transition-all"
                        placeholder="(14) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Aniv. (DD/MM)
                    </label>
                    <input
                      type="text"
                      name="dataNascimento"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      maxLength={5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                      placeholder="DD/MM"
                    />
                  </div>
                </div>
              </div>
            </div>

            {user.tipo === "casal" && (
              <div
                className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 transition-all ${!formData.nomeConjuge ? "opacity-40" : ""}`}
              >
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Cônjuge
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nome Completo do Cônjuge
                    </label>
                    <input
                      type="text"
                      name="nomeConjuge"
                      value={formData.nomeConjuge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Como o cônjuge quer ser chamado?
                    </label>
                    <input
                      type="text"
                      name="nomeExibicaoConjuge"
                      value={formData.nomeExibicaoConjuge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-bold text-pink-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Telefone Cônjuge (DDD + 9 números)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="telefoneConjuge"
                          value={formData.telefoneConjuge}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-liturgy-500 transition-all"
                          placeholder="(14) 99999-9999"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Aniv. (DD/MM)
                      </label>
                      <input
                        type="text"
                        name="dataNascimentoConjuge"
                        value={formData.dataNascimentoConjuge}
                        onChange={handleChange}
                        maxLength={5}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                        placeholder="DD/MM"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Alterar Senha do Cônjuge (3 números)
                    </label>
                    <input
                      type="password"
                      name="senhaConjuge"
                      value={formData.senhaConjuge}
                      onChange={handleChange}
                      maxLength={3}
                      placeholder="***"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={voltar}
              className="px-6 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-10 py-3 text-sm font-black uppercase tracking-widest text-black bg-liturgy-600 rounded-2xl hover:bg-liturgy-700 transition-all shadow-xl shadow-liturgy-100 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const getLimiteMissa = (
  nomeMissa: string,
  horario: string,
  data: string,
  limiteManual?: number,
) => {
  if (limiteManual) return { ministros: limiteManual, leitores: 0 };
  const lowerName = nomeMissa.toLowerCase();

  // Semana Santa
  if (lowerName.includes("ramos") || lowerName.includes("páscoa")) {
    return { ministros: horario === "07:30" ? 5 : 8, leitores: 0 };
  }
  if (lowerName.includes("ceia do senhor") || lowerName.includes("lava-pés"))
    return { ministros: 8, leitores: 0 };
  if (lowerName.includes("paixão do senhor"))
    return { ministros: 8, leitores: 0 };
  if (lowerName.includes("vigília pascal"))
    return { ministros: 8, leitores: 0 };

  if (lowerName.includes("penitencial")) return { ministros: 2, leitores: 0 };
  if (lowerName.includes("sagrado")) return { ministros: 4, leitores: 0 };
  if (lowerName.includes("cura") || lowerName.includes("santíssimo"))
    return { ministros: 4, leitores: 0 };
  if (lowerName.includes("santa rita") || lowerName.includes("santarita"))
    return { ministros: 4, leitores: 0 };

  try {
    const [year, month, day] = data.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 6) return { ministros: 6, leitores: 0 };
    if (dayOfWeek === 0) {
      if (horario === "07:30") return { ministros: 5, leitores: 0 };
      return { ministros: 8, leitores: 0 };
    }
  } catch (e) {}

  if (lowerName.includes("sábado") || lowerName.includes("sabado"))
    return { ministros: 6, leitores: 0 };
  if (horario === "07:30") return { ministros: 5, leitores: 0 };
  return { ministros: 8, leitores: 0 };
};

const getIncompatibilityDiscount = (
  date: string,
  time: string,
  escala: any,
  allMins: any[],
) => {
  if (!escala || !escala[date] || !escala[date][time]) return 0;
  const names: string[] = escala[date][time].ministros || [];
  if (names.length <= 1 || !allMins || allMins.length === 0) return 0;

  const scaledMinisters: any[] = [];
  names.forEach((name) => {
    if (!name) return;
    const nameLower = name.trim().toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const found = allMins.find((m) => {
      const display1 = (m.nomeExibicao || m.nome || "")
        .trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const display2 = (m.nomeExibicaoConjuge || m.nomeConjuge || "")
        .trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const full = (m.nome || "")
        .trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (m.tipo === "casal") {
        const expectedCoupled = `${display1} e ${display2}`
          .trim().toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (nameLower === expectedCoupled) return true;
        if (nameLower.includes(display1) && nameLower.includes(display2)) return true;
      }

      return nameLower === display1 || nameLower === display2 || nameLower === full;
    });

    if (found) {
      scaledMinisters.push(found);
    }
  });

  let discount = 0;
  const processed: any[] = [];

  for (const m of scaledMinisters) {
    let hasConflict = false;
    for (const p of processed) {
      const incomp1 = m.incompatibilidades || [];
      const incomp2 = p.incompatibilidades || [];
      
      const mIdStr = String(m.id);
      const pIdStr = String(p.id);
      
      const incompById = 
        incomp1.some((id: any) => String(id) === pIdStr) ||
        incomp2.some((id: any) => String(id) === mIdStr);
        
      let incompByName = false;
      if (!incompById) {
        // Fallback for check based on names
        const mIncNames = incomp1.map((incId: any) => {
          const fx = allMins.find((x) => String(x.id) === String(incId));
          return fx ? (fx.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        }).filter(Boolean);
        
        const pIncNames = incomp2.map((incId: any) => {
          const fx = allMins.find((x) => String(x.id) === String(incId));
          return fx ? (fx.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        }).filter(Boolean);
        
        const mNameNorm = (m.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const pNameNorm = (p.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        incompByName = 
          mIncNames.some((name) => pNameNorm.includes(name) || name.includes(pNameNorm)) ||
          pIncNames.some((name) => mNameNorm.includes(name) || name.includes(mNameNorm));
      }

      if (incompById || incompByName) {
        hasConflict = true;
        break;
      }
    }
    if (hasConflict) {
      const isCasal = m.tipo === "casal";
      discount += isCasal ? 2 : 1;
    } else {
      processed.push(m);
    }
  }

  return discount;
};

const getIncompatibilityDiscountForList = (
  ministerList: any[],
  allMins: any[],
) => {
  if (!ministerList || ministerList.length <= 1 || !allMins || allMins.length === 0) return 0;

  const scaledMinisters: any[] = [];
  const itemMap = new Map<string, any>();

  ministerList.forEach((mItem) => {
    if (!mItem) return;
    const mId = mItem.id !== undefined ? String(mItem.id) : String(mItem);
    
    // Find minister in allMinisters by ID first
    let found = allMins.find((m) => String(m.id) === mId);
    
    // Fallback search by name if ID did not match
    if (!found && mItem.nome) {
      const itemNomeNorm = mItem.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      found = allMins.find((m) => {
        const display1 = (m.nomeExibicao || m.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const display2 = (m.nomeExibicaoConjuge || m.nomeConjuge || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const full = (m.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (m.tipo === "casal") {
          const expectedCoupled = `${display1} e ${display2}`.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (itemNomeNorm === expectedCoupled) return true;
          if (itemNomeNorm.includes(display1) && itemNomeNorm.includes(display2)) return true;
        }
        return itemNomeNorm === display1 || itemNomeNorm === display2 || itemNomeNorm === full;
      });
    }

    if (found) {
      scaledMinisters.push(found);
      itemMap.set(String(found.id), mItem);
    }
  });

  let discount = 0;
  const processed: any[] = [];

  for (const m of scaledMinisters) {
    let hasConflict = false;
    for (const p of processed) {
      const incomp1 = m.incompatibilidades || [];
      const incomp2 = p.incompatibilidades || [];
      
      const mIdStr = String(m.id);
      const pIdStr = String(p.id);
      
      const incompById = 
        incomp1.some((id: any) => String(id) === pIdStr) ||
        incomp2.some((id: any) => String(id) === mIdStr);
        
      let incompByName = false;
      if (!incompById) {
        // Fallback name-based check for incompatibilidades
        const mIncNames = incomp1.map((incId: any) => {
          const fx = allMins.find((x) => String(x.id) === String(incId));
          return fx ? (fx.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        }).filter(Boolean);
        
        const pIncNames = incomp2.map((incId: any) => {
          const fx = allMins.find((x) => String(x.id) === String(incId));
          return fx ? (fx.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        }).filter(Boolean);
        
        const mNameNorm = (m.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const pNameNorm = (p.nome || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        incompByName = 
          mIncNames.some((name) => pNameNorm.includes(name) || name.includes(pNameNorm)) ||
          pIncNames.some((name) => mNameNorm.includes(name) || name.includes(mNameNorm));
      }

      if (incompById || incompByName) {
        hasConflict = true;
        break;
      }
    }
    if (hasConflict) {
      const mItem = itemMap.get(String(m.id));
      const isCasalActive = mItem 
        ? (mItem.isCasalActive ?? mItem.tipo === "casal" ?? m.tipo === "casal") 
        : (m.tipo === "casal");
      discount += isCasalActive ? 2 : 1;
    } else {
      processed.push(m);
    }
  }

  return discount;
};

const PanoramaModal = ({
  show,
  onClose,
  escala,
  disponibilidades,
  getLimiteMissa,
  paroquiaName,
  mes,
  ano,
  allMinisters,
}: {
  show: boolean;
  onClose: () => void;
  escala: any;
  disponibilidades: any[];
  getLimiteMissa: any;
  paroquiaName?: string;
  mes?: number;
  ano?: number;
  allMinisters: any[];
}) => {
  const [expectedSlots, setExpectedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      setLoading(true);
      getExpectedSlots(paroquiaName, mes, ano).then((slots) => {
        setExpectedSlots(slots);
        setLoading(false);
      });
    }
  }, [show, mes, ano]);

  if (!show) return null;

  // Agrupar disponibilidades por slot
  const availabilityStats: any = {};
  disponibilidades.forEach((d) => {
    const isCasal = d.tipo === "casal" || (d.nome && d.nomeConjuge);
    const pesoPadrao = isCasal ? 2 : 1;

    d.disponibilidade.forEach((slot: any) => {
      // Filter by month and year if provided
      if (mes && ano) {
        if (!slot.data) return;
        const [y, m, d_day] = slot.data.split("-").map(Number);
        if (m !== mes || y !== ano) {
          return;
        }
      }

      const normHorario = normalizeHorario(slot.horario);
      const normName = normalizeMassName(slot.nomeMissa);
      const chave = `${slot.data}|${normHorario}|${normName}`;
      if (!availabilityStats[chave]) {
        availabilityStats[chave] = { 
          ministros: 0, 
          leitores: 0,
          ministrosList: [],
          leitoresList: []
        };
      }

      let peso = pesoPadrao;
      if (slot.modo === "ele" || slot.modo === "ela") peso = 1;
      else if (slot.modo === "casal") peso = 2;

      const ministerInfo = {
        id: d.ministro_id,
        tipo: d.tipo,
        isCasalActive: slot.modo === "casal" || (!slot.modo && d.tipo === "casal")
      };

      if (slot.nomeMissa.toLowerCase().includes("leitor")) {
        availabilityStats[chave].leitores += peso;
        availabilityStats[chave].leitoresList.push(ministerInfo);
      } else {
        availabilityStats[chave].ministros += peso;
        availabilityStats[chave].ministrosList.push(ministerInfo);
      }
    });
  });

  const slotsToDisplay = expectedSlots.length > 0 ? expectedSlots : [];
  const dates = [...new Set(slotsToDisplay.map((s) => s.data))].sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Panorama das Missas
              </h2>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                Análise de Disponibilidade Pré-Escala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">
                Analisando disponibilidades...
              </p>
            </div>
          ) : slotsToDisplay.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                Nenhum slot de missa encontrado para o período.
              </p>
            </div>
          ) : (
            dates.map((date) => {
              const slotsDoDia = slotsToDisplay.filter((s) => s.data === date);
              return (
                <div key={date} className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(date + "T00:00:00"), "EEEE, d 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slotsDoDia.map((slot) => {
                      const isLeitorSlot = slot.nome
                        .toLowerCase()
                        .includes("leitor");
                      if (isLeitorSlot) return null; // We'll handle readers within the main mass slot if needed

                      const limits = getLimiteMissa(
                        slot.nome,
                        slot.horario,
                        slot.data,
                        slot.limiteManual,
                      );
                      
                      const normHorario = normalizeHorario(slot.horario);
                      const normName = normalizeMassName(slot.nome);
                      const lookupChave = `${slot.data}|${normHorario}|${normName}`;
                      
                      const stats = availabilityStats[lookupChave] || { ministros: 0, leitores: 0, ministrosList: [], leitoresList: [] };

                      const discount = getIncompatibilityDiscountForList(
                        stats.ministrosList || [],
                        allMinisters,
                      );
                      const adjustedMinistros = Math.max(0, stats.ministros - discount);

                      const missingMinisters = Math.max(
                        0,
                        limits.ministros - adjustedMinistros,
                      );
                      const missingReaders = 0; // No readers required anymore

                      const isFull = missingMinisters === 0;

                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-2xl border transition-all ${isFull ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-black text-slate-900">
                              {slot.horario}
                            </span>
                            {isFull ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> COMPLETA
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> INCOMPLETA
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">
                                Ministros:
                              </span>
                              <span
                                className={`font-bold ${missingMinisters > 0 ? "text-red-600" : "text-emerald-600"}`}
                              >
                                Ministros {adjustedMinistros} / {limits.ministros}
                              </span>
                            </div>
                          </div>

                          {!isFull && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                Faltando:{" "}
                                {missingMinisters > 0
                                  ? `${missingMinisters} ministro(s)`
                                  : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-100"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const generateEscalaPDF = (escala, user) => {
  if (
    !escala ||
    Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).length ===
      0
  )
    return;

  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  // Determine current date from the scale content
  const dates = Object.keys(escala)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  const currentDate =
    dates.length > 0 ? new Date(dates[0] + "T00:00:00") : new Date();

  const monthYear = format(currentDate, "MMMM yyyy", {
    locale: ptBR,
  }).toUpperCase();

  // Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`ESCALAS DE MINISTROS PARA AS MISSAS - ${monthYear}`, 148.5, 10, {
    align: "center",
  });

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Group by week, ensuring Sunday start (weekStartsOn: 0)
  const weeks: { [key: string]: Date[] } = {};
  days.forEach((day) => {
    const weekNum = getWeek(day, { locale: ptBR, weekStartsOn: 0 });
    if (!weeks[weekNum]) weeks[weekNum] = [];
    weeks[weekNum].push(day);
  });

  const tableBody: any[] = [];
  const sortedWeekNums = Object.keys(weeks).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  sortedWeekNums.forEach((weekNum) => {
    const weekDays = weeks[weekNum];

    const finalDateRow: any[] = [];
    for (let i = 0; i <= 6; i++) {
      const day = weekDays.find((d) => d.getDay() === i);
      const dateStr = day
        ? `${format(day, "dd/MM")} - ${format(day, "EEEE", { locale: ptBR }).split("-")[0].toUpperCase()}`
        : "";

      if (i === 0) {
        // Sunday
        finalDateRow.push({
          content: dateStr,
          colSpan: 3,
          styles: {
            halign: "center",
            valign: "middle",
            textColor: [220, 38, 38],
            fontStyle: "bold",
            fillColor: [255, 240, 240],
            fontSize: 8,
          },
        });
      } else {
        finalDateRow.push({
          content: dateStr,
          styles: {
            halign: "center",
            valign: "middle",
            fontStyle: "bold",
            fillColor: [245, 245, 245],
            fontSize: 8,
          },
        });
      }
    }
    tableBody.push(finalDateRow);

    // Fill Content Row
    const finalContentRow: any[] = new Array(9).fill("");

    for (let i = 0; i <= 6; i++) {
      const day = weekDays.find((d) => d.getDay() === i);
      if (!day) continue;

      const dateStr = format(day, "yyyy-MM-dd");
      const missas = escala[dateStr] || {};
      const sortedMissas = Object.entries(missas).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      const missasData: any[] = [];
      sortedMissas.forEach(([horario, missa]: [string, any]) => {
        let corpo = "";

        // Show specific mass names, but hide generic "Missa de Sábado/Domingo"
        if (missa.nome) {
          const nomeLower = missa.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const diaSemana = format(day, "EEEE", { locale: ptBR })
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const isGeneric =
            nomeLower === "missa" ||
            nomeLower === `missa de ${diaSemana}` ||
            nomeLower === `missa do ${diaSemana}` ||
            nomeLower === `missa ${diaSemana}`;

          if (!isGeneric) {
            corpo += `${missa.nome.toUpperCase()}\n`;
          }
        }

        if (Array.isArray(missa)) {
          corpo += missa.join("\n");
        } else {
          if (missa.ministros) corpo += missa.ministros.join("\n");
          if (missa.leitores && missa.leitores.length > 0)
            corpo += "\nL: " + missa.leitores.join(", ");
        }
        missasData.push({ horario, corpo });
      });

      if (i === 0) {
        // Sunday - Distribute into 3 columns
        missasData.forEach((m) => {
          const hour = parseInt(m.horario.split(":")[0]);
          let colIndex = 0; // Default to first slot (07:30)
          if (hour >= 9 && hour < 16) colIndex = 1; // 10:00
          if (hour >= 16) colIndex = 2; // 19:00

          const text = `${m.horario}\n${m.corpo}`;
          if (!finalContentRow[colIndex]) {
            finalContentRow[colIndex] = {
              content: text,
              customData: { missas: [m], isSunday: true },
            };
          } else {
            finalContentRow[colIndex].content += `\n\n${text}`;
            finalContentRow[colIndex].customData.missas.push(m);
          }
        });
      } else {
        // Other days - Single column
        const colIndex = i + 2;
        if (missasData.length > 0) {
          const fullContent = missasData
            .map((m) => `${m.horario}\n${m.corpo}`)
            .join("\n\n");
          finalContentRow[colIndex] = {
            content: fullContent,
            customData: { missas: missasData, isSunday: false },
          };
        }
      }
    }
    // Ensure empty strings for null slots to satisfy autotable
    for (let k = 0; k < 9; k++) {
      if (!finalContentRow[k]) finalContentRow[k] = "";
    }
    tableBody.push(finalContentRow);
  });

  autoTable(doc, {
    startY: 14,
    head: [
      [
        {
          content: "DOMINGO",
          colSpan: 3,
          styles: {
            halign: "center",
            textColor: [220, 38, 38],
            fillColor: [255, 240, 240],
            fontStyle: "bold",
          },
        },
        { content: "SEGUNDA", styles: { halign: "center", fontStyle: "bold" } },
        { content: "TERÇA", styles: { halign: "center", fontStyle: "bold" } },
        { content: "QUARTA", styles: { halign: "center", fontStyle: "bold" } },
        { content: "QUINTA", styles: { halign: "center", fontStyle: "bold" } },
        { content: "SEXTA", styles: { halign: "center", fontStyle: "bold" } },
        { content: "SÁBADO", styles: { halign: "center", fontStyle: "bold" } },
      ],
    ],
    body: tableBody,
    theme: "grid",
    margin: { top: 12, right: 10, bottom: 10, left: 10 },
    styles: {
      fontSize: 7,
      cellPadding: 0.8,
      overflow: "linebreak",
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: "top",
      halign: "center",
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 30, textColor: [220, 38, 38] }, // Dom 1
      1: { cellWidth: 30, textColor: [220, 38, 38] }, // Dom 2
      2: { cellWidth: 30, textColor: [220, 38, 38] }, // Dom 3
      3: { cellWidth: 31 }, // Seg
      4: { cellWidth: 31 }, // Ter
      5: { cellWidth: 31 }, // Qua
      6: { cellWidth: 31 }, // Qui
      7: { cellWidth: 31 }, // Sex
      8: { cellWidth: 31 }, // Sab
    },
    didParseCell: function (data) {
      if (data.section === "body") {
        // Content rows (odd index)
        if (data.row.index % 2 !== 0) {
          const cellRaw = data.cell.raw as any;
          if (cellRaw && cellRaw.customData) {
            // Hide default text to draw manually
            data.cell.styles.textColor = data.cell.styles.fillColor;
            (data.cell as any).customData = cellRaw.customData;
          } else if (data.column.index <= 2) {
            // Fallback for sunday cells without customData
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    },
    didDrawCell: function (data) {
      const cell = data.cell as any;
      if (
        data.section === "body" &&
        cell.customData &&
        data.row.index % 2 !== 0
      ) {
        const { missas, isSunday } = cell.customData;
        const doc = data.doc;

        const color = isSunday ? [220, 38, 38] : [0, 0, 0];
        doc.setTextColor(color[0], color[1], color[2]);

        let currentY = cell.y + 3;

        missas.forEach((m, idx) => {
          if (idx > 0) currentY += 1.5;

          // Horário (Bold, Larger)
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(m.horario, cell.x + cell.width / 2, currentY, {
            align: "center",
          });
          currentY += 3;

          // Corpo (Normal, Smaller)
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(m.corpo, cell.width - 3);
          doc.text(lines, cell.x + cell.width / 2, currentY, {
            align: "center",
          });
          currentY += lines.length * 2.8;
        });
      }
    },
  });

  const paroquiaName = user?.paroquia
    ? user.paroquia.toLowerCase().replace(/\s+/g, "-")
    : "paroquia";
  doc.save(`escala-${paroquiaName}-tabela.pdf`);
};

export const generateEscalaListPDF = (escala: any, user: any) => {
  if (
    !escala ||
    Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).length ===
      0
  )
    return;

  const doc = new jsPDF({ orientation: "portrait", format: "a4" });

  // Header Info
  const dates = Object.keys(escala)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  const firstDateStr = dates[0];
  const firstDate = new Date(firstDateStr + "T00:00:00");
  const monthYear = format(firstDate, "MMMM yyyy", {
    locale: ptBR,
  }).toUpperCase();

  const paroquia = user?.paroquia || "Paróquia";

  // Header text similar to screenshot
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(paroquia, 105, 12, { align: "center" });

  doc.setFontSize(10);
  doc.text(`ESCALA MECE - ${monthYear}`, 105, 18, { align: "center" });

  // Prepare table data
  const tableBody: any[] = [];

  const getWeekdayLabel = (date: Date) => {
    const day = date.getDay();
    const days = [
      "domingo",
      "2ª feira",
      "3ª feira",
      "4ª feira",
      "5ª feira",
      "6ª feira",
      "sábado",
    ];
    return days[day];
  };

  dates.forEach((dateStr) => {
    const date = new Date(dateStr + "T00:00:00");

    // Day labeling per screenshot
    const dayLabel = format(date, "d/MMM", { locale: ptBR }).toLowerCase();

    const weekdayLabel = getWeekdayLabel(date);
    const missas = escala[dateStr] || {};
    const sortedMissas = Object.entries(missas).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    sortedMissas.forEach(([horario, missa]: [string, any], index: number) => {
      const ministros = (missa.ministros || []).join(" - ");
      const nomeMissa = missa.nome ? `[${missa.nome}] ` : "";

      tableBody.push([
        index === 0 ? dayLabel : "",
        index === 0 ? weekdayLabel : "",
        horario,
        `${nomeMissa}${ministros}`,
      ]);
    });
  });

  // Generate Table
  autoTable(doc, {
    startY: 22,
    head: [["Dia", "Semana", "Horário", "Ministros"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      fontSize: 7.5,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 0.6,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      font: "helvetica",
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 }, // Dia
      1: { halign: "center", cellWidth: 18 }, // Semana
      2: { halign: "center", cellWidth: 15 }, // Horário
      3: { cellWidth: "auto" }, // Ministros
    },
    margin: { top: 20, left: 12, right: 12, bottom: 10 },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        (data.column.index === 0 || data.column.index === 1)
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const paroquiaNameSave = paroquia.toLowerCase().replace(/\s+/g, "-");
  doc.save(`escala-${paroquiaNameSave}-lista.pdf`);
};

const checkPeriodoAgendado = (config: any, userParoquia?: string) => {
  if (!config) return false;

  // Buscar agendamento específico da paróquia se houver
  const agendamento =
    userParoquia && config.agendamentoPorParoquia
      ? config.agendamentoPorParoquia[userParoquia]
      : {};

  const diaAbertura =
    agendamento?.diaAbertura !== undefined && agendamento?.diaAbertura !== ""
      ? agendamento.diaAbertura
      : config.diaAbertura;
  const horaAbertura = agendamento?.horaAbertura || config.horaAbertura;
  const diaFechamento =
    agendamento?.diaFechamento !== undefined &&
    agendamento?.diaFechamento !== ""
      ? agendamento.diaFechamento
      : config.diaFechamento;
  const horaFechamento = agendamento?.horaFechamento || config.horaFechamento;

  if (!diaAbertura || !horaAbertura || !diaFechamento || !horaFechamento)
    return false;

  const agora = new Date();
  const [hA, mA] = horaAbertura.split(":").map(Number);
  const [hF, mF] = horaFechamento.split(":").map(Number);

  // Período no mês atual
  const dataAbertura = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    diaAbertura,
    hA,
    mA,
    0,
    0,
  );
  let dataFechamento = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    diaFechamento,
    hF,
    mF,
    59,
    999,
  );

  if (dataFechamento < dataAbertura) {
    dataFechamento.setMonth(dataFechamento.getMonth() + 1);
  }

  // Verificação rigorosa do período atual
  if (agora >= dataAbertura && agora <= dataFechamento) return true;

  // Verificação do período que começou no mês anterior (ex: abrindo dia 20 do mês passado)
  const dataAberturaMesAnterior = new Date(dataAbertura);
  dataAberturaMesAnterior.setMonth(dataAberturaMesAnterior.getMonth() - 1);
  const dataFechamentoMesAnterior = new Date(dataFechamento);
  dataFechamentoMesAnterior.setMonth(dataFechamentoMesAnterior.getMonth() - 1);

  if (agora >= dataAberturaMesAnterior && agora <= dataFechamentoMesAnterior)
    return true;

  return false;
};

function CoordenacaoView({
  user,
  setUser,
  onLogout,
  onBackToHome,
  onSetView,
  needsPasswordReset,
  slotsDisponiveisApp,
  escalaApp,
  birthdayMessage,
  disponibilidadeAberta,
  setDisponibilidadeAberta,
  manualOverride,
  setManualOverride,
  setEscalaApp,
  mesSelecionado,
  anoSelecionado,
  setMesSelecionado,
  setAnoSelecionado,
  onExcluirMensagem,
  onMarcarComoLida,
  slotsSelecionados,
  setSlotsSelecionados,
  initialSlotsSelecionados,
  setInitialSlotsSelecionados,
  handleSlotChange,
  handleModeChange,
  handleSubmit,
  validarSelecao,
  ocupacao,
  setOcupacao,
  getChaveOcupacao,
  getLimiteVagas,
  showPreAberturaMessage,
  setViewAsMinister,
  viewAsMinister,
  mensagemDisponibilidade,
  onImpersonate,
  originalUser,
  onCustomConfirm,
  onClearImpersonation,
  onAlert,
  isCoordenador,
  error: parentError,
  message: parentMessage,
  setDownloadOptionMode,
}) {
  const [dailyGospel, setDailyGospel] = useState({
    text: "Carregando...",
    ref: "",
  });
  const [showGospelModal, setShowGospelModal] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const [showGerarEscalaModal, setShowGerarEscalaModal] = useState(false);
  const [showConferenciaModal, setShowConferenciaModal] = useState(false);
  const [conferenciaMes, setConferenciaMes] = useState<number>(0);
  const [conferenciaAno, setConferenciaAno] = useState<number>(0);
  const [escalaConferencia, setEscalaConferencia] = useState<any>(null);
  const [loadingConferencia, setLoadingConferencia] = useState<boolean>(false);
  const [mesGerar, setMesGerar] = useState(Number(mesSelecionado));
  const [anoGerar, setAnoGerar] = useState(Number(anoSelecionado));

  // Sync with global selections
  useEffect(() => {
    setMesGerar(Number(mesSelecionado));
    setAnoGerar(Number(anoSelecionado));
  }, [mesSelecionado, anoSelecionado]);

  const isCoordenadorInitial =
    user.role === "coordenacao" ||
    user.role === "admin" ||
    user.role === "coordenador";
  const [activeTab, setActiveTab] = useState(
    needsPasswordReset ? "editar" : "home",
  );
  const [selectedEscalaMonth, setSelectedEscalaMonth] = useState<string>("");

  const [vigilGospel, setVigilGospel] = useState<any | null>(null);

  // Ao entrar em modo de impersonação (Espelho), força voltar para a aba Dashboard (home)
  useEffect(() => {
    if (originalUser) {
      setActiveTab("home");
    }
  }, [originalUser, user?.id]);
  const hasSubmittedGlobal = (initialSlotsSelecionados || []).length > 0;

  useEffect(() => {
    const today = new Date();
    const isSaturday = today.getDay() === 6;

    // Fetch today's liturgy
    fetch("/api/liturgia")
      .then((res) => {
        if (!res.ok)
          return {
            evangelho: {
              texto: "Liturgia indisponível",
              referencia: "",
              papasText: "",
            },
          };
        return res.json();
      })
      .then((data) => {
        if (data && data.evangelho) {
          setDailyGospel({
            text: data.evangelho.texto || "",
            ref: data.evangelho.referencia || "",
            vaticanUrl: data.evangelho.vaticanUrl || "",
            papasText: data.evangelho.papasText || "",
          });
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar liturgia diária:", err);
        setDailyGospel({
          text: "Não foi possível carregar a liturgia.",
          ref: "",
          papasText: "",
          vaticanUrl: "",
        });
      });

    // If Saturday, fetch tomorrow's liturgy (Vigil)
    if (isSaturday) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayStr = tomorrow.getDate().toString().padStart(2, "0");
      const monthStr = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
      const dateParam = `${dayStr}-${monthStr}`;

      fetch(`/api/liturgia?date=${dateParam}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch vigil liturgy");
          return res.json();
        })
        .then((data) => {
          if (data && data.evangelho) {
            setVigilGospel({
              text: data.evangelho.texto || "",
              ref: data.evangelho.referencia || "",
              vaticanUrl: data.evangelho.vaticanUrl || "",
              papasText: data.evangelho.papasText || "",
            });
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar liturgia da vigília:", err);
        });
    } else {
      setVigilGospel(null);
    }
  }, []);
  const [subTab, setSubTab] = useState("registradas");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const normalize = useCallback((s: any) => {
    if (typeof s !== "string") return "";
    return s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " e ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const allUserNames = useMemo(() => {
    const normalizedUserNames = [
      user.nome,
      user.nomeExibicao,
      user.nomeConjuge,
      user.nomeExibicaoConjuge,
    ]
      .filter(Boolean)
      .map(normalize);

    return [...new Set(normalizedUserNames)];
  }, [user, normalize]);

  // States for tabs
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [escala, setEscala] = useState(escalaApp || {});
  const [escalaPublicada, setEscalaPublicada] = useState(false);
  const [escalaPublicadaPorMes, setEscalaPublicadaPorMes] = useState<
    Record<string, boolean>
  >({});
  const [showPanoramaModal, setShowPanoramaModal] = useState(false);

  // Sync escala with escalaApp prop when it changes (e.g. after fetchData in parent)
  useEffect(() => {
    if (escalaApp) {
      setEscala(escalaApp);
    }
  }, [escalaApp]);

  const escalaMonths = useMemo(() => {
    if (
      !escala ||
      Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
        .length === 0
    )
      return [];

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    return Object.keys(escala)
      .reduce((acc, date) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return acc; // Ignora chaves inválidas

        const dateObj = new Date(date + "T00:00:00");
        // Apenas meses recentes ou futuros (a partir do mês atual)
        if (dateObj < firstDayOfCurrentMonth) {
            console.log(`[DEBUG] Filtering date ${date} (Obj: ${dateObj}) < ${firstDayOfCurrentMonth}`);
            return acc;
        }

        const month = date.substring(0, 7);
        // Coordenadores devem ver todos os meses para gestão.
        // Já para a visualização pública (EscalaView), filtramos meses publicados.
        const isCoord = user.role === "coordenacao" || user.paroquia?.toLowerCase().includes("coord") || user.role === "admin";
        
        const currentMonthStr = format(today, "yyyy-MM");
        const explicitMonthPublic = escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined ? escalaPublicadaPorMes[month] : null;
        const isMonthPublic = explicitMonthPublic === true || (explicitMonthPublic === null && escalaPublicada === true) || month === currentMonthStr;

        if (!isCoord && !isMonthPublic) return acc;

        if (!acc.includes(month)) acc.push(month);
        return acc;
      }, [] as string[])
      .sort();
  }, [escala, escalaPublicadaPorMes]);

  const filteredDisponibilidades = useMemo(() => {
    return disponibilidades.filter((d: any) => {
      return d.disponibilidade.some((slot: any) => {
        if (!slot.data) return false;
        const [y, m, d_day] = slot.data.split("-").map(Number);
        return m === Number(mesSelecionado) && y === Number(anoSelecionado);
      });
    });
  }, [disponibilidades, mesSelecionado, anoSelecionado]);

  useEffect(() => {
    if (escalaMonths.length > 0) {
      if (!selectedEscalaMonth || !escalaMonths.includes(selectedEscalaMonth)) {
        setSelectedEscalaMonth(escalaMonths[0]);
      }
    } else {
      setSelectedEscalaMonth("");
    }
  }, [escalaMonths, selectedEscalaMonth]);

  const [diaAbertura, setDiaAbertura] = useState<number | "">("");
  const [horaAbertura, setHoraAbertura] = useState("");
  const [diaFechamento, setDiaFechamento] = useState<number | "">("");
  const [horaFechamento, setHoraFechamento] = useState("");
  const [maxEscalacoes, setMaxEscalacoes] = useState<number | "libre">(3);
  const [stats, setStats] = useState({
    totalMinistros: 0,
    totalDisponibilidades: 0,
    totalAniversariantes: 0,
    pendingApprovals: 0,
    lowStockCount: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [vagas, setVagas] = useState({});
  const [showResponderModal, setShowResponderModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [respostaTexto, setRespostaTexto] = useState("");

  const handleResponder = (msg: any) => {
    setSelectedMessage(msg);
    setShowResponderModal(true);
  };

  const handleEnviarResposta = async () => {
    if (!respostaTexto.trim() || !selectedMessage) return;

    try {
      const res = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: user.nome,
          telefone: user.telefone,
          destinatario_telefone: selectedMessage.telefone,
          mensagem: respostaTexto,
          paroquia: user.paroquia,
          type: "private",
        }),
      });

      if (res.ok) {
        if (!selectedMessage.lida) {
          await onMarcarComoLida(selectedMessage.id);
        }
        setRespostaTexto("");
        setShowResponderModal(false);
        setSelectedMessage(null);
        setMessage("Resposta enviada com sucesso!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
    }
  };
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [mensagemError, setMensagemError] = useState("");
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [allMinisters, setAllMinisters] = useState<any[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [weekendAssignments, setWeekendAssignments] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [showWeekendReminder, setShowWeekendReminder] = useState(false);
  const [trocas, setTrocas] = useState<any[]>([]);

  const fetchTrocas = useCallback(async () => {
    try {
      const response = await fetch(`/api/trocas?paroquia=${encodeURIComponent(user?.paroquia || "")}`);
      if (response.ok) {
        const data = await response.json();
        setTrocas(data);
      }
    } catch (e) {
      console.error("Erro ao buscar trocas:", e);
    }
  }, [user?.paroquia]);

  useEffect(() => {
    fetchTrocas();
    const interval = setInterval(fetchTrocas, 20000);
    return () => clearInterval(interval);
  }, [fetchTrocas]);

  // Swap request modal states
  const [showSolicitarTrocaModal, setShowSolicitarTrocaModal] = useState(false);
  const [trocaMissaOrigem, setTrocaMissaOrigem] = useState<any | null>(null);
  const [trocaTipo, setTrocaTipo] = useState<'direta' | 'substituto'>('direta');
  const [trocaMissaDestino, setTrocaMissaDestino] = useState<any | null>(null);
  const [trocaDestinatario, setTrocaDestinatario] = useState<any | null>(null);
  const [isSubmittingTroca, setIsSubmittingTroca] = useState(false);
  const [trocaBuscaTerm, setTrocaBuscaTerm] = useState("");
  const [trocaTabFiltro, setTrocaTabFiltro] = useState<'pendentes' | 'historico'>('pendentes');
  
  // Custom couple swap states
  const [solicitanteSubMembro, setSolicitanteSubMembro] = useState<'ambos' | 'marido' | 'esposa'>('ambos');
  const [destinatarioSubMembro, setDestinatarioSubMembro] = useState<'ambos' | 'marido' | 'esposa'>('ambos');
  const [segundoDestinatario, setSegundoDestinatario] = useState<any | null>(null);
  const [substituirPorDoisIndividuais, setSubstituirPorDoisIndividuais] = useState<boolean>(false);
  const [escolhendoSegundoIndiv, setEscolhendoSegundoIndiv] = useState<boolean>(false);

  const getSwapSolicitanteDisplay = useCallback((t: any) => {
    if (!t) return "";
    const min = allMinisters.find((m: any) => m.id === t.solicitanteId);
    if (min && min.tipo === 'casal') {
      if (t.solicitanteSubMembro === 'marido') {
        return min.nomeExibicao || min.nome;
      }
      if (t.solicitanteSubMembro === 'esposa') {
        return min.nomeExibicaoConjuge || min.nomeConjuge || min.nome;
      }
    }
    return t.solicitanteNome;
  }, [allMinisters]);

  const getSwapDestinatarioDisplay = useCallback((t: any) => {
    if (!t) return "";
    const min = allMinisters.find((m: any) => m.id === t.destinatarioId);
    if (min && min.tipo === 'casal') {
      if (t.destinatarioSubMembro === 'marido') {
        return min.nomeExibicao || min.nome;
      }
      if (t.destinatarioSubMembro === 'esposa') {
        return min.nomeExibicaoConjuge || min.nomeConjuge || min.nome;
      }
    }
    return t.destinatarioNome;
  }, [allMinisters]);

  const isMinisterScheduledOnDayOrWeek = useCallback((candidateMin: any, targetDateStr: string) => {
    if (!escala || !candidateMin) return false;
    
    // Get candidate's possible names
    const names = [
      candidateMin.nome,
      candidateMin.nomeExibicao,
      candidateMin.nomeConjuge,
      candidateMin.nomeExibicaoConjuge
    ].filter(Boolean).map(n => n.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    
    const targetDate = parseISO(targetDateStr);
    const targetWeek = getWeek(targetDate);
    const targetYear = getYear(targetDate);

    // Scan all slots in escala
    for (const [dateKey, hours] of Object.entries(escala)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      const slotDate = parseISO(dateKey);
      
      const isSameD = isSameDay(slotDate, targetDate);
      const isSameW = getWeek(slotDate) === targetWeek && getYear(slotDate) === targetYear;
      
      if (isSameD || isSameW) {
        // If scheduled anywhere on this day or week
        const missas = hours as any;
        for (const missa of Object.values(missas)) {
          const ministros = (missa as any).ministros || [];
          for (const mName of ministros) {
            const normalizedMName = mName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (names.some(name => normalizedMName === name || normalizedMName.includes(name))) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, [escala]);

  const futurePublishedSlots = useMemo(() => {
    const slots: any[] = [];
    if (!escala) return slots;
    
    // Scan all slots in escala
    const todayStr = new Date().toISOString().split('T')[0];
    
    Object.entries(escala).forEach(([dateStr, hours]: [string, any]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (dateStr < todayStr) return;
      
      Object.entries(hours).forEach(([timeStr, missa]: [string, any]) => {
        const ministros = missa.ministros || [];
        
        // We only care about other ministers' assignments
        ministros.forEach((mName: string) => {
          // Normalize and check against current logged in user to avoid listing self
          const normMName = mName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const isLUser = allUserNames.some(uName => normMName === uName || normMName.includes(uName));
          if (isLUser) return;
          
          // Find matching minister record from allMinisters to get their ID and telephone if possible
          const matchedMin = allMinisters.find((am: any) => {
            const amName = am.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const amExib = (am.nomeExibicao || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normMName === amName || normMName.includes(amName) || (amExib && (normMName === amExib || normMName.includes(amExib)));
          });
          
          slots.push({
            date: dateStr,
            time: timeStr,
            missaNome: missa.descricao || missa.nome || 'Missa',
            ministerName: mName,
            ministerId: matchedMin ? matchedMin.id : null,
            ministerTelefone: matchedMin ? matchedMin.telefone : null,
            originalSlot: missa
          });
        });
      });
    });
    
    // Sort chronologically
    slots.sort((a, b) => {
      const dbA = new Date(`${a.date}T${a.time}`);
      const dbB = new Date(`${b.date}T${b.time}`);
      return dbA.getTime() - dbB.getTime();
    });
    
    return slots;
  }, [escala, allUserNames, allMinisters]);

  const handleResponderMinistro = async (trocaId: string, resposta: 'aceitar' | 'rejeitar') => {
    try {
      const response = await fetch(`/api/trocas/${trocaId}/responder-ministro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta }),
      });
      if (response.ok) {
        onAlert({ type: "success", text: resposta === 'aceitar' ? "Você aceitou a solicitação. Pendente de aprovação da coordenação!" : "Você rejeitou o pedido de troca." });
        fetchTrocas();
        setActiveTab("trocas");
      } else {
        const err = await response.json();
        onAlert({ type: "error", text: err.error || "Erro ao responder solicitação." });
      }
    } catch (e) {
      console.error(e);
      onAlert({ type: "error", text: "Erro de conexão." });
    }
  };

  const handleResponderCoordenador = async (trocaId: string, resposta: 'aprovar' | 'rejeitar') => {
    try {
      const response = await fetch(`/api/trocas/${trocaId}/responder-coordenador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta }),
      });
      if (response.ok) {
        onAlert({ type: "success", text: resposta === 'aprovar' ? "Troca aprovada com sucesso! A escala foi atualizada." : "Troca recusada pela coordenação." });
        fetchTrocas();
        setActiveTab("trocas");
        // Refresh scale view too
        if (typeof fetchData === "function") {
          fetchData();
        }
      } else {
        const err = await response.json();
        onAlert({ type: "error", text: err.error || "Erro ao responder solicitação." });
      }
    } catch (e) {
      console.error(e);
      onAlert({ type: "error", text: "Erro de conexão." });
    }
  };

  const handleConfirmarLeitura = async (trocaId: string) => {
    try {
      const response = await fetch(`/api/trocas/${trocaId}/confirmar-leitura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministroId: user.id }),
      });
      if (response.ok) {
        fetchTrocas();
        setActiveTab("trocas");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnviarSolicitacaoTroca = async () => {
    if (!trocaMissaOrigem || !trocaDestinatario) {
      onAlert({ type: "error", text: "Por favor, selecione sua celebração e o ministro substituto/destino." });
      return;
    }
    
    if (trocaTipo === 'direta' && !trocaMissaDestino) {
      onAlert({ type: "error", text: "Por favor, selecione a missa do destinatário para a troca." });
      return;
    }

    if (substituirPorDoisIndividuais && !segundoDestinatario) {
      onAlert({ type: "error", text: "Por favor, selecione o segundo ministro substituto." });
      return;
    }

    try {
      setIsSubmittingTroca(true);
      const payload = {
        solicitanteId: user.id,
        solicitanteNome: user.nomeExibicao || user.nome,
        solicitanteTelefone: user.telefone,
        paroquia: user.paroquia,
        missaOrigemData: trocaMissaOrigem.date,
        missaOrigemHorario: trocaMissaOrigem.time,
        missaOrigemMissa: trocaMissaOrigem.descricao || trocaMissaOrigem.nome || 'Missa',
        tipo: trocaTipo,
        destinatarioId: trocaDestinatario.id,
        destinatarioNome: trocaDestinatario.nomeExibicao || trocaDestinatario.nome,
        destinatarioTelefone: trocaDestinatario.telefone,
        missaDestinoData: trocaTipo === 'direta' ? trocaMissaDestino?.date : undefined,
        missaDestinoHorario: trocaTipo === 'direta' ? trocaMissaDestino?.time : undefined,
        missaDestinoMissa: trocaTipo === 'direta' ? (trocaMissaDestino?.descricao || trocaMissaDestino?.nome) : undefined,
        
        // Couple parameters
        solicitanteSubMembro: user.tipo === 'casal' ? solicitanteSubMembro : 'ambos',
        destinatarioSubMembro: trocaDestinatario.tipo === 'casal' ? destinatarioSubMembro : 'ambos',
        segundoDestinatarioId: substituirPorDoisIndividuais && segundoDestinatario ? segundoDestinatario.id : undefined,
        segundoDestinatarioNome: substituirPorDoisIndividuais && segundoDestinatario ? (segundoDestinatario.nomeExibicao || segundoDestinatario.nome) : undefined,
        segundoDestinatarioTelefone: substituirPorDoisIndividuais && segundoDestinatario ? segundoDestinatario.telefone : undefined
      };

      const response = await fetch("/api/trocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onAlert({ type: "success", text: "Solicitação de troca enviada com sucesso! O outro ministro receberá um aviso." });
        setShowSolicitarTrocaModal(false);
        setTrocaMissaOrigem(null);
        setTrocaMissaDestino(null);
        setTrocaDestinatario(null);
        setSolicitanteSubMembro('ambos');
        setDestinatarioSubMembro('ambos');
        setSegundoDestinatario(null);
        setSubstituirPorDoisIndividuais(false);
        setEscolhendoSegundoIndiv(false);
        fetchTrocas();
      } else {
        const err = await response.json();
        onAlert({ type: "error", text: err.error || "Erro ao solicitar troca." });
      }
    } catch (e) {
      console.error(e);
      onAlert({ type: "error", text: "Erro ao enviar solicitação." });
    } finally {
      setIsSubmittingTroca(false);
    }
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    if (allMinisters.length > 0) {
      const normalize = (s: any) => {
        if (typeof s !== "string") return "";
        let n = s
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/&/g, " e ")
          .replace(/\s+/g, " ")
          .trim();
        // Remove 'paroquia' prefix if present to standardize parish names
        if (n.startsWith("paroquia ")) {
          n = n.substring(9).trim();
        }
        if (n.includes(" e ")) {
          n = n
            .split(" e ")
            .map((x) => x.trim())
            .sort()
            .join(" e ");
        }
        return n;
      };
      const userParoquia = normalize(user.paroquia || "");
      const parishMinisters = allMinisters.filter(
        (m) =>
          normalize(m.paroquia) === userParoquia &&
          Number.isInteger(Number(m.id)),
      );

      // Use selected month and year
      let targetMonth = Number(mesSelecionado);
      let targetYear = Number(anoSelecionado);

      let isGapPeriod = false;

      const submittedIds = new Set();
      const submittedNames = new Set();

      if (!isGapPeriod) {
        disponibilidades.forEach((d: any) => {
          const hasTargetMonth = d.disponibilidade.some((slot: any) => {
            const slotDate = new Date(slot.data + "T00:00:00");
            return (
              slotDate.getMonth() + 1 === targetMonth &&
              slotDate.getFullYear() === targetYear
            );
          });

          if (hasTargetMonth) {
            if (d.ministro_id) submittedIds.add(String(d.ministro_id));

            const n1 = normalize(d.nome);
            const n2 = normalize(d.nomeConjuge);

            if (n1 && !n2) {
              submittedNames.add(n1);
            } else if (n1 && n2) {
              submittedNames.add(normalize(`${n1} e ${n2}`));
              submittedNames.add(n1);
              submittedNames.add(n2);
            }
          }
        });
      }

      // Check scheduling
      const isScheduled = (normalizedUserName: string) => {
        if (
          !escala ||
          Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
            .length === 0
        )
          return false;

        const targetMonthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

        for (const [dateStr, missas] of Object.entries(escala)) {
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ||
            !dateStr.startsWith(targetMonthPrefix)
          )
            continue;

          for (const [time, missa] of Object.entries(missas as any)) {
            const ministros = (missa as any).ministros || [];
            for (const m of ministros) {
              const normalizedScheduleName = normalize(m);
              if (normalizedScheduleName === normalizedUserName) return true;

              // Handle "Name1 e Name2" in schedule line
              const partsOfScheduleName = normalizedScheduleName
                .split(" e ")
                .map((p) => p.trim())
                .filter(Boolean);
              for (const part of partsOfScheduleName) {
                if (
                  part === normalizedUserName ||
                  normalizedUserName.startsWith(part + " ") ||
                  part.startsWith(normalizedUserName + " ")
                )
                  return true;
              }

              if (normalizedUserName.startsWith(normalizedScheduleName + " "))
                return true;
              if (normalizedScheduleName.startsWith(normalizedUserName + " "))
                return true;

              const userFirst = normalizedUserName.split(" ")[0];
              const schedFirst = normalizedScheduleName.split(" ")[0];
              if (userFirst.length >= 4 && schedFirst.length >= 4) {
                if (
                  userFirst.startsWith(schedFirst) ||
                  schedFirst.startsWith(userFirst)
                ) {
                  const userRest = normalizedUserName
                    .substring(userFirst.length)
                    .trim();
                  const schedRest = normalizedScheduleName
                    .substring(schedFirst.length)
                    .trim();
                  if (!userRest || !schedRest || userRest === schedRest) {
                    return true;
                  }
                }
              }
            }
          }
        }
        return false;
      };

      const missingIndividuals = isGapPeriod
        ? 0
        : parishMinisters.reduce((acc, m) => {
            const id = String(m.id);
            const n1 = normalize(m.nome);
            const n1Display = m.nomeExibicao ? normalize(m.nomeExibicao) : null;

            const n1Done =
              submittedIds.has(id) ||
              (n1 && submittedNames.has(n1)) ||
              (n1Display && submittedNames.has(n1Display)) ||
              (n1 && isScheduled(n1)) ||
              (n1Display && isScheduled(n1Display)) ||
              m.afastado;

            if (m.tipo === "casal" && m.nomeConjuge) {
              const n2 = normalize(m.nomeConjuge);
              const n2Display = m.nomeExibicaoConjuge
                ? normalize(m.nomeExibicaoConjuge)
                : null;
              const n2Done =
                submittedIds.has(id) ||
                (n2 && submittedNames.has(n2)) ||
                (n2Display && submittedNames.has(n2Display)) ||
                (n2 && isScheduled(n2)) ||
                (n2Display && isScheduled(n2Display)) ||
                (n1 && n2 && submittedNames.has(normalize(`${n1} e ${n2}`))) ||
                m.afastadoConjuge;

              let count = 0;
              if (!n1Done) count++;
              if (!n2Done) count++;
              return acc + count;
            } else {
              return acc + (n1Done ? 0 : 1);
            }
          }, 0);

      setMissingCount(missingIndividuals);
    }
  }, [allMinisters, disponibilidades, user.paroquia, escala]);

  useEffect(() => {
    if (
      escala &&
      Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).length >
        0
    ) {
      const today = new Date();
      const day = today.getDay();
      const hour = today.getHours();

      // 1. Encontrar TODAS as próximas escalações do usuário
      const allFoundAssignments: any[] = [];

      Object.entries(escala).forEach(([dateStr, missas]: [string, any]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
        const assignmentDate = new Date(dateStr + "T00:00:00");
        // Apenas datas futuras ou hoje
        const todayReset = new Date(today);
        todayReset.setHours(0, 0, 0, 0);

        if (assignmentDate >= todayReset) {
          Object.entries(missas).forEach(([time, missa]: [string, any]) => {
            const ministros = missa.ministros || [];
            const matchedName = ministros.find((m: string) => {
              const normalizedM = normalize(m);
              const partsOfM = normalizedM
                .split(" e ")
                .map((p) => p.trim())
                .filter(Boolean);

              return allUserNames.some((userName) => {
                // 1. Exact match
                if (normalizedM === userName) return true;

                // 2. User is part of a couple in schedule (with prefix support)
                if (
                  partsOfM.some(
                    (part) =>
                      part === userName ||
                      userName.startsWith(part + " ") ||
                      part.startsWith(userName + " "),
                  )
                )
                  return true;

                // 3. Schedule uses a short name (prefix) of the user (e.g. Schedule "Ana", User "Ana Paula")
                if (userName.startsWith(normalizedM + " ")) return true;

                // 4. Schedule uses a full name, but user has a short name (e.g. Schedule "Ana Paula", User "Ana")
                if (normalizedM.startsWith(userName + " ")) return true;

                // 5. Very permissive match for first names if they are unique enough (e.g. Mavi vs Mavii)
                // We only do this if the names are very similar to avoid false positives
                const userFirst = userName.split(" ")[0];
                const schedFirst = normalizedM.split(" ")[0];
                if (userFirst.length >= 4 && schedFirst.length >= 4) {
                  if (
                    userFirst.startsWith(schedFirst) ||
                    schedFirst.startsWith(userFirst)
                  ) {
                    // Check if the rest of the name matches or is empty
                    const userRest = userName
                      .substring(userFirst.length)
                      .trim();
                    const schedRest = normalizedM
                      .substring(schedFirst.length)
                      .trim();
                    if (!userRest || !schedRest || userRest === schedRest) {
                      return true;
                    }
                  }
                }

                return false;
              });
            });

            if (matchedName) {
              allFoundAssignments.push({
                date: dateStr,
                time: time,
                matchedName: matchedName,
                ...missa,
              });
            }
          });
        }
      });

      // Ordenar todas as escalações
      allFoundAssignments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setMyAssignments(allFoundAssignments);

      // 2. Lógica do Lembrete (Semana e Final de Semana)
      const formatDateLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = formatDateLocal(tomorrow);

      let reminderAssignments = [];
      let shouldShow = false;

      // Mostrar lembrete do final de semana a partir de QUINTA-FEIRA (day === 4)
      if (day === 4 || day === 5 || day === 6 || day === 0) {
        // Quinta, Sexta, Sábado ou Domingo: Mostrar todo o final de semana
        const currentFriday = new Date(today);
        let diffToFriday = 5 - day;
        if (day === 0) diffToFriday = -2; // Domingo volta para Sexta
        if (day === 4) diffToFriday = 1; // Quinta avança para Sexta

        currentFriday.setDate(today.getDate() + diffToFriday);
        currentFriday.setHours(0, 0, 0, 0);

        const currentSaturday = new Date(currentFriday);
        currentSaturday.setDate(currentFriday.getDate() + 1);

        const currentSunday = new Date(currentFriday);
        currentSunday.setDate(currentFriday.getDate() + 2);

        const weekendDates = [
          formatDateLocal(currentFriday),
          formatDateLocal(currentSaturday),
          formatDateLocal(currentSunday),
        ];

        reminderAssignments = allFoundAssignments.filter((assign) =>
          weekendDates.includes(assign.date),
        );
        if (reminderAssignments.length > 0) shouldShow = true;
      } else {
        // Segunda a Quarta: Mostrar se tem escala amanhã
        reminderAssignments = allFoundAssignments.filter(
          (assign) => assign.date === tomorrowStr,
        );
        if (reminderAssignments.length > 0) shouldShow = true;
      }

      if (shouldShow) {
        setWeekendAssignments(reminderAssignments);
        setShowWeekendReminder(true);
      } else {
        setShowWeekendReminder(false);
      }
    }
  }, [escala, user, normalize, allUserNames]);

  const handleSaveUser = async (formData) => {
    try {
      // Since CadastroView now always shows Titular first and Spouse second,
      // formData is already in the primary user's perspective.
      const payload = { ...formData };

      const response = await fetch(`/api/ministros/${user.telefone}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setUser((currentUser) => {
          if (!currentUser) return null;
          const finalUser = {
            ...currentUser,
            ...data.ministro,
            isCoordenador: currentUser.isCoordenador,
          };
          localStorage.setItem("user", JSON.stringify(finalUser));
          return finalUser;
        });
        setMessage("Perfil atualizado com sucesso!");
        setTimeout(() => {
          setMessage("");
        }, 1500);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar os dados.");
      }
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      throw err;
    }
  };

  const lastFetchDataRef = useRef<number>(0);
  const fetchData = useCallback(async () => {
    if (!user?.paroquia) return;
    // Throttling: don't fetch data more than once every 3 seconds
    const now = Date.now();
    if (now - lastFetchDataRef.current < 3000) return;
    lastFetchDataRef.current = now;

    setLoading(true);
    console.log("[CoordenacaoView] Fetching data for paroquia:", user.paroquia);
    try {
      // Fetch config, escala, and stats in parallel but handle them individually
      const [configRes, escalaRes, statsRes] = await Promise.allSettled([
        fetch(
          `/api/config?paroquia=${encodeURIComponent(user.paroquia)}&t=${now}`,
        ),
        fetch(
          `/api/escala?paroquia=${encodeURIComponent(user.paroquia)}${isCoordenador ? "&preview=true" : ""}&t=${now}`,
        ),
        fetch(
          `/api/stats?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}&t=${now}`,
        ),
      ]);

      if (configRes.status === "fulfilled" && configRes.value.ok) {
        const config = await configRes.value.json();
        setEscalaPublicada(config.escalaPublicada);
        setEscalaPublicadaPorMes(config.escalaPublicadaPorMes || {});
        const isNoPeriodo = checkPeriodoAgendado(config, user.paroquia);
        const manualOverride =
          config.disponibilidadeAbertaPorParoquia?.[user.paroquia];
        setManualOverride(manualOverride);
        const isAberta =
          manualOverride !== undefined
            ? manualOverride
            : config.disponibilidadeAberta || isNoPeriodo;
        setDisponibilidadeAberta(isAberta);
        setDiaAbertura(config.diaAbertura || "");
        setHoraAbertura(config.horaAbertura || "");
        setDiaFechamento(config.diaFechamento || "");
        setHoraFechamento(config.horaFechamento || "");
        const loadedMax = config.maxEscalacoes !== undefined ? (config.maxEscalacoes === 99 || config.maxEscalacoes === "99" ? "libre" : Number(config.maxEscalacoes)) : 3;
        setMaxEscalacoes(loadedMax);
      }

      if (escalaRes.status === "fulfilled" && escalaRes.value.ok) {
        const data = await escalaRes.value.json();
        setEscala(data);
        if (setEscalaApp) setEscalaApp(data);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setStats(statsData);
        if (statsData.aniversariantesList) {
          setAniversariantes(statsData.aniversariantesList);
        }
      }

      const res = await fetch(
        `/api/admin/ministros?paroquia=${encodeURIComponent(user.paroquia)}`,
      );
      if (res.ok) setAllMinisters(await res.json());

      // Single fetch for messages as multiple tabs might need it but they are all in this component
      const msgRes = await fetch(
        `/api/mensagens?paroquia=${encodeURIComponent(user.paroquia)}&type=direct`,
      );
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setDirectMessages(msgs);
      }

      const dispRes = await fetch(
        `/api/disponibilidade?paroquia=${encodeURIComponent(user.paroquia)}`,
      );
      if (dispRes.ok) setDisponibilidades(await dispRes.json());

      const vagasRes = await fetch(
        `/api/vagas?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}`,
      );
      if (vagasRes.ok) {
        const vagasData = await vagasRes.json();
        setVagas(vagasData);
        setOcupacao(vagasData);
      }


      if (activeTab === "cadastro") {
        const res = await fetch(
          `/api/admin/pending?paroquia=${encodeURIComponent(user.paroquia)}`,
        );
        if (res.ok) setPendingUsers(await res.json());
      } else if (activeTab === "escalaOnline") {
        const vagasRes = await fetch(
          `/api/vagas?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}`,
        );
        if (vagasRes.ok) {
          const vagasData = await vagasRes.json();
          setVagas(vagasData);
          setOcupacao(vagasData);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [
    user?.paroquia,
    user?.role,
    isCoordenador,
    activeTab,
    mesSelecionado,
    anoSelecionado,
  ]);

  useEffect(() => {
    fetchData();
  }, [activeTab, mesSelecionado, anoSelecionado, fetchData]);

  const handleToggleDisponibilidade = async () => {
    const newState = !disponibilidadeAberta;
    const oldState = disponibilidadeAberta;
    console.log(`Toggling availability for ${user.paroquia} to ${newState}`);

    // Optimistic update
    setDisponibilidadeAberta(newState);

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disponibilidadeAberta: newState,
          paroquia: user.paroquia,
          resetConfirmations: newState === true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      setMessage(
        `Período de disponibilidade ${newState ? "aberto" : "encerrado"} com sucesso para a paróquia ${user.paroquia}.`,
      );
      setTimeout(() => setMessage(""), 3000);

      // Re-fetch to ensure consistency with backend
      const res = await fetch("/api/config");
      if (res.ok) {
        const config = await res.json();
        const isNoPeriodo = checkPeriodoAgendado(config);
        const manualOverride =
          config.disponibilidadeAbertaPorParoquia?.[user.paroquia];
        const isAberta =
          manualOverride !== undefined
            ? manualOverride
            : config.disponibilidadeAberta || isNoPeriodo;
        setDisponibilidadeAberta(isAberta);
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      // Revert state on error
      setDisponibilidadeAberta(oldState);
      setMessage("Erro ao atualizar disponibilidade. Tente novamente.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleGerarEscala = async () => {
    setMesGerar(Number(mesSelecionado));
    setAnoGerar(Number(anoSelecionado));
    setShowGerarEscalaModal(true);
  };

  const confirmGerarEscala = async (keepExisting: boolean = false) => {
    setShowGerarEscalaModal(false);
    setLoading(true); // Show loading state
    try {
      const response = await fetch(
        `/api/escala/gerar?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesGerar}&ano=${anoGerar}&keep=${keepExisting ? 'true' : 'false'}`,
        { method: "POST" },
      );

      let novaEscala: any;
      let warningMsg: string | null = null;
      let warningDet: string | null = null;

      if (response.status === 206) {
        const warningData = await response.json();
        novaEscala = warningData.escala;
        if (warningData.warning === "INCOMPLETE_SCHEDULE") {
          warningMsg = "Vagas em Aberto";
          warningDet = warningData.details.join("\n");
        }
      } else if (response.ok) {
        novaEscala = await response.json();
      }

      if (novaEscala) {
        setEscala(novaEscala);
        if (setEscalaApp) setEscalaApp(novaEscala);

        // Filtrar escala do mês correspondente para a conferência
        const mesStr = `${anoGerar}-${mesGerar.toString().padStart(2, "0")}`;
        const filtered = Object.keys(novaEscala).reduce((acc: any, k: string) => {
          if (k.startsWith(mesStr)) {
            acc[k] = novaEscala[k];
          }
          return acc;
        }, {});

        setEscalaConferencia(filtered);
        setConferenciaMes(mesGerar);
        setConferenciaAno(anoGerar);
        setShowConferenciaModal(true);

        if (warningMsg) {
          onAlert(
            `Aviso: ${warningMsg}`,
            `A escala foi gerada, mas algumas missas não possuem ministros suficientes para preencher todas as vagas:\n\n${warningDet}`,
          );
          setMessage("Escala gerada com avisos: Faltam ministros para algumas missas.");
        } else {
          setMessage(`Escala de ${monthNames[mesGerar - 1]} / ${anoGerar} gerada com sucesso! Prossiga com a conferência.`);
        }
        setTimeout(() => setMessage(""), 5000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Erro ao gerar escala.");
      }
    } catch (err) {
      console.error("Erro ao gerar escala:", err);
      setMessage("Erro ao gerar escala.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEscalaConferencia = async (mes: number, ano: number) => {
    setLoadingConferencia(true);
    try {
      const response = await fetch(`/api/escala?preview=true&paroquia=${encodeURIComponent(user.paroquia)}&t=${Date.now()}`);
      if (response.ok) {
        const fullEscala = await response.json();
        const mesStr = `${ano}-${mes.toString().padStart(2, "0")}`;
        const filtered = Object.keys(fullEscala).reduce((acc: any, k: string) => {
          if (k.startsWith(mesStr)) {
            acc[k] = fullEscala[k];
          }
          return acc;
        }, {});
        setEscalaConferencia(filtered);
      }
    } catch (err) {
      console.error("Erro ao carregar escala de conferência:", err);
    } finally {
      setLoadingConferencia(false);
    }
  };

  const handleAbrirConferencia = () => {
    const mes = Number(mesSelecionado);
    const ano = Number(anoSelecionado);
    setConferenciaMes(mes);
    setConferenciaAno(ano);
    setShowConferenciaModal(true);
    fetchEscalaConferencia(mes, ano);
  };

  const gerarNovamenteEscala = async (mes: number, ano: number, keepExisting: boolean = false) => {
    setLoadingConferencia(true);
    try {
      const response = await fetch(
        `/api/escala/gerar?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mes}&ano=${ano}&keep=${keepExisting ? "true" : "false"}`,
        { method: "POST" },
      );

      if (response.status === 206 || response.ok) {
        const data = await response.json();
        const novaEscala = response.status === 206 ? data.escala : data;
        setEscala(novaEscala);
        if (setEscalaApp) setEscalaApp(novaEscala);

        const mesStr = `${ano}-${mes.toString().padStart(2, "0")}`;
        const filtered = Object.keys(novaEscala).reduce((acc: any, k: string) => {
          if (k.startsWith(mesStr)) {
            acc[k] = novaEscala[k];
          }
          return acc;
        }, {});
        setEscalaConferencia(filtered);

        if (response.status === 206 && data.warning === "INCOMPLETE_SCHEDULE") {
          const detalhes = data.details.join("\n");
          onAlert(
            "Aviso: Vagas em Aberto na Nova Geração",
            `A escala foi recalculada, mas algumas missas não possuem ministros suficientes:\n\n${detalhes}`,
          );
        }
        setMessage("Nova combinação de escala recalculada com sucesso!");
        setTimeout(() => setMessage(""), 4000);
      } else {
        const errorData = await response.json();
        onAlert("Erro", errorData.error || "Erro ao recalcular escala.");
      }
    } catch (err) {
      console.error("Erro ao recalcular escala na conferência:", err);
      onAlert("Erro", "Falha crítica de comunicação para recalcular escala.");
    } finally {
      setLoadingConferencia(false);
    }
  };

  const publicarEscalaDefinitiva = async (mes: number, ano: number) => {
    const mesStr = `${ano}-${mes.toString().padStart(2, "0")}`;
    try {
      setLoading(true);
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalaPublicada: true,
          paroquia: user.paroquia,
          mesPublicado: mesStr,
        }),
      });
      if (response.ok) {
        setEscalaPublicadaPorMes((prev) => ({ ...prev, [mesStr]: true }));
        // Removido para não esconder meses antigos publicados com flag global
        // setEscalaPublicada(false);
        if (typeof fetchData === "function") {
          await fetchData();
        }
        setShowConferenciaModal(false);
        onAlert("Sucesso", `Escala de ${monthNames[mes - 1]} de ${ano} foi APROVADA e PUBLICADA com sucesso para todos os usuários!`);
        setMessage(`Escala do mês ${mes}/${ano} aprovada e publicada com sucesso.`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        onAlert("Erro", "Ocorreu um problema ao publicar a escala.");
      }
    } catch (err) {
      console.error("Erro ao aprovar e publicar escala:", err);
      onAlert("Erro", "Erro ao aprovar e publicar escala.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEscala = async (
    monthOrEvent?: string | React.MouseEvent,
  ) => {
    const month =
      monthOrEvent && typeof monthOrEvent === "string"
        ? monthOrEvent
        : undefined;
    const currentStatus = month
      ? escalaPublicadaPorMes[month] || false
      : escalaPublicada;
    const newState = !currentStatus;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalaPublicada: newState,
          paroquia: user.paroquia,
          mesPublicado: month,
        }),
      });
      if (response.ok) {
        if (month) {
          setEscalaPublicadaPorMes((prev) => ({ ...prev, [month]: newState }));
          // Removido para não esconder meses antigos publicados com flag global
          // setEscalaPublicada(false);
        } else {
          setEscalaPublicada(newState);
          // Se recolheu a escala geral, recolhe todos os meses também
          if (!newState) {
            setEscalaPublicadaPorMes({});
          }
        }

        const label = month
          ? format(new Date(month + "-01T00:00:00"), "MMMM yyyy", {
              locale: ptBR,
            })
          : "Escala";
        setMessage(
          `${label} ${newState ? "publicada" : "recolhida"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 3000);

        // Atualizar a escala localmente após publicar/recolher
        const escalaRes = await fetch(
          `/api/escala?preview=true&paroquia=${encodeURIComponent(user.paroquia)}`,
        );
        if (escalaRes.ok) {
          setEscala(await escalaRes.json());
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar configuração:", err);
    }
  };

  const handleSaveAgendamento = async () => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaAbertura,
          horaAbertura,
          diaFechamento,
          horaFechamento,
          maxEscalacoes: maxEscalacoes === "libre" ? 99 : Number(maxEscalacoes),
          paroquia: user.paroquia,
          disponibilidadeAberta: null, // Clear manual override to use automatic schedule
          resetConfirmations: true,
        }),
      });
      if (response.ok) {
        setMessage(
          "Agendamento mensal salvo com sucesso! O sistema agora seguirá o cronograma automático.",
        );
        setTimeout(() => setMessage(""), 3000);
        // Force a re-fetch of config after a short delay to ensure consistency
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      setMessage("Erro ao salvar agendamento.");
    }
  };

  const handleResetAgendamento = async () => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paroquia: user.paroquia,
          disponibilidadeAberta: null,
          resetConfirmations: true,
        }),
      });
      if (response.ok) {
        setMessage(
          "Controle manual removido. O sistema agora seguirá o cronograma automático.",
        );
        setTimeout(() => setMessage(""), 3000);
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao resetar agendamento:", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ministro" }),
      });
      if (response.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        setMessage("Cadastro aprovado com sucesso!");
        fetchData();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao aprovar:", err);
    }
  };

  const handleReject = async (id) => {
    onCustomConfirm(
      "Tem certeza que deseja recusar este cadastro?",
      async () => {
        try {
          const response = await fetch(`/api/admin/reject/${id}`, {
            method: "POST",
          });
          if (response.ok) {
            setPendingUsers((prev) => prev.filter((u) => u.id !== id));
            setMessage("Cadastro recusado.");
            setStats((prev) => ({
              ...prev,
              pendingApprovals: prev.pendingApprovals - 1,
            }));
            setTimeout(() => setMessage(""), 3000);
          }
        } catch (err) {
          console.error("Erro ao recusar:", err);
        }
      },
    );
  };

  const handleEnviarRecado = async (e) => {
    e.preventDefault();
    if (!mensagemTexto.trim()) return;
    setMensagemError("");

    try {
      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: user.nome,
          telefone: user.telefone,
          mensagem: mensagemTexto,
          paroquia: user.paroquia,
          type: "broadcast",
        }),
      });

      if (response.ok) {
        setMessage(
          "Recado enviado com sucesso para todos os ministros da paróquia!",
        );
        setMensagemTexto("");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMensagemError(data.error || "Erro ao enviar recado.");
      }
    } catch (err) {
      setMensagemError("Erro ao enviar recado.");
    }
  };

  const handleDownloadPDF = () => {
    const currentMonthStr = format(new Date(), "yyyy-MM");
    const monthsInEscala = Object.keys(escala)
      .reduce((acc, date) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return acc;
        const month = date.substring(0, 7);
        if (month < currentMonthStr) return acc;
        if (!acc.includes(month)) acc.push(month);
        return acc;
      }, [] as string[])
      .sort();

    if (monthsInEscala.length > 1) {
      const m1 = monthsInEscala[0];
      const m2 = monthsInEscala[1];
      const m1Label = format(new Date(m1 + "-01T00:00:00"), "MMMM", {
        locale: ptBR,
      });
      const m2Label = format(new Date(m2 + "-01T00:00:00"), "MMMM", {
        locale: ptBR,
      });

      onCustomConfirm(
        `Qual escala deseja baixar?`,
        () => {
          const filtered = Object.keys(escala).reduce((acc, k) => {
            if (k.startsWith(m2) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
              acc[k] = escala[k];
            return acc;
          }, {});
          setDownloadOptionMode({ aberta: true, escala: filtered });
        },
        m2Label.charAt(0).toUpperCase() + m2Label.slice(1),
        undefined,
        m1Label.charAt(0).toUpperCase() + m1Label.slice(1),
        () => {
          const filtered = Object.keys(escala).reduce((acc, k) => {
            if (k.startsWith(m1) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
              acc[k] = escala[k];
            return acc;
          }, {});
          setDownloadOptionMode({ aberta: true, escala: filtered });
        },
      );
    } else if (monthsInEscala.length === 1) {
      const m = monthsInEscala[0];
      const filtered = Object.keys(escala).reduce((acc, k) => {
        if (k.startsWith(m) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
          acc[k] = escala[k];
        return acc;
      }, {});
      setDownloadOptionMode({ aberta: true, escala: filtered });
    } else {
      setDownloadOptionMode({ aberta: true, escala: escala });
    }
  };

  const unreadCount = directMessages.filter((m) => !m.lida).length;

  const liturgyTheme = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const color = getLiturgicalThemeDynamic(today);

    // Mapeia as cores do calendário litúrgico para cores do Tailwind
    switch (color) {
      case "purple":
        return "purple";
      case "red":
        return "rose";
      case "white":
        return "white";
      case "green":
        return "emerald";
      default:
        return "indigo";
    }
  }, []);

  const themeClasses = useMemo(() => {
    // Se não for 'home' (dashboard), usa azul
    if (activeTab !== "home") {
      return {
        bg: "bg-blue-600",
        text: "text-blue-600",
        border: "border-blue-200",
        light: "bg-blue-50",
      };
    }

    switch (liturgyTheme) {
      case "purple":
        return {
          bg: "bg-purple-600",
          text: "text-purple-600",
          border: "border-purple-200",
          light: "bg-purple-50",
        };
      case "rose":
        return {
          bg: "bg-rose-600",
          text: "text-rose-600",
          border: "border-rose-200",
          light: "bg-rose-50",
        };
      case "white":
        return {
          bg: "bg-slate-600",
          text: "text-slate-600",
          border: "border-slate-200",
          light: "bg-slate-50",
        };
      case "emerald":
        return {
          bg: "bg-emerald-600",
          text: "text-emerald-600",
          border: "border-emerald-200",
          light: "bg-emerald-50",
        };
      default:
        return {
          bg: "bg-indigo-600",
          text: "text-indigo-600",
          border: "border-indigo-200",
          light: "bg-indigo-50",
        };
    }
  }, [liturgyTheme, activeTab]);

  const trocasBadgeCount = useMemo(() => {
    const isCoord =
      user.role === "coordenacao" ||
      user.role === "admin" ||
      user.role === "coordenador" ||
      user.role?.toLowerCase().includes("coordena");

    if (isCoord) {
      return trocas.filter((t: any) => t.status === 'pendente_coordenacao').length;
    } else {
      return trocas.filter((t: any) => {
        // Needs action as target
        const needsAction = t.destinatarioId === user.id && t.status === 'pendente_destinatario';
        
        // Needs acknowledgement from solicitor
        const solUnread = t.solicitanteId === user.id && t.confirmadoSolicitante !== true && 
          (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao' || t.status === 'rejeitado_destinatario');
        
        // Needs acknowledgement from target
        const destUnread = t.destinatarioId === user.id && t.confirmadoDestinatario !== true && 
          (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao');

        return needsAction || solUnread || destUnread;
      }).length;
    }
  }, [trocas, user.id, user.role]);

  const allTabs = [
    {
      id: "home",
      label: "Dashboard",
      icon: Activity,
      type: "ambos",
      scope: "dashboard",
    },
    {
      id: "disponibilidade",
      label: "Disponibilidade",
      icon: LayoutDashboard,
      type: "ambos",
      scope: "disponibilidade",
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: BarChart,
      type: "coordenacao",
      scope: "relatorios",
    },
    {
      id: "escala",
      label: "Escala",
      icon: Calendar,
      type: "ambos",
      scope: "escala",
    },
    {
      id: "ministros",
      label: "Ministros",
      icon: Users,
      type: "coordenacao",
      scope: "ministros",
    },
    {
      id: "missas",
      label: "Missas",
      icon: Church,
      type: "coordenacao",
      scope: "missas",
    },
    {
      id: "estoque",
      label: "Estoque",
      icon: Package,
      type: "coordenacao",
      scope: "estoque",
    },
    {
      id: "trocas",
      label: "Trocas",
      icon: RefreshCw,
      badge: trocasBadgeCount,
      type: "ambos",
      scope: "trocas",
    },
    {
      id: "comunhao",
      label: "Comunhão",
      icon: Heart,
      type: "ambos",
      scope: "comunhao",
    },
    {
      id: "testes",
      label: "Testes",
      icon: Database,
      type: "admin",
      scope: "admin",
    },
    {
      id: "mensagem",
      label: "Mensagem",
      icon: MessageSquare,
      badge: unreadCount,
      type: "ambos",
      scope: "mensagem",
    },
    {
      id: "calendario",
      label: "Calendário Litúrgico",
      icon: CalendarDays,
      type: "ambos",
      scope: "calendario",
    },
    {
      id: "editar",
      label: "Meu Perfil",
      icon: Settings,
      type: "ambos",
      scope: "editar",
    },
  ];

  // Mostra as abas específicas do ministro ou do coordenador, garantindo a ordem pedida
  const tabs = allTabs.filter((tab) => {
    console.log(
      "Filtering tab:",
      tab.id,
      "user.role:",
      user.role,
      "isCoordenador:",
      isCoordenador,
    );
    if (tab.id === "testes") return user.role === "admin";
    if (isCoordenador) {
      return tab.id !== "testes";
    }
    // Ministro vê apenas as abas de ministro ou ambos, ignorando restritas de coordenador
    return tab.type === "ministro" || tab.type === "ambos";
  });

  return (
    <div
      className={`theme-${activeTab === "home" ? liturgyTheme : "blue"} bg-liturgy-50/50 min-h-screen w-full flex flex-col font-sans`}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${user.paroquiaBloqueada ? "bg-red-600" : themeClasses.bg}`}
              >
                <Church className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-slate-900 text-[10px] tracking-widest uppercase">
                  {isCoordenador ? "Painel de Gestão" : "Portal do Ministro"}
                </h1>
                <div className="flex items-center gap-1">
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest leading-none ${user.paroquiaBloqueada ? "text-red-500" : "text-slate-400"}`}
                  >
                    {user.paroquia}
                  </p>
                  {user.paroquiaBloqueada && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-full border border-red-200">
                      Bloqueada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      const hasException =
                        user.excecaoAcessoAte &&
                        new Date(user.excecaoAcessoAte) > new Date();
                      if (
                        tab.id === "disponibilidade" &&
                        !disponibilidadeAberta &&
                        !isCoordenador &&
                        !hasException
                      ) {
                        setActiveTab("disponibilidade");
                        return;
                      }
                      setActiveTab(tab.id as any);
                      setViewAsMinister(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all relative ${
                      isActive
                        ? `${themeClasses.light} ${themeClasses.text}`
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <button
                  onClick={() => onSetView("admin")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Scrollable */}
        {tabs.length > 0 && (
          <div className="md:hidden border-t border-slate-100 bg-white overflow-x-auto no-scrollbar">
            <div className="flex p-2 space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      const hasException =
                        user.excecaoAcessoAte &&
                        new Date(user.excecaoAcessoAte) > new Date();
                      if (
                        tab.id === "disponibilidade" &&
                        !disponibilidadeAberta &&
                        !isCoordenador &&
                        !hasException
                      ) {
                        setActiveTab("disponibilidade");
                        return;
                      }
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all relative ${
                      isActive
                        ? `${themeClasses.bg} text-white`
                        : "text-slate-500 bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all text-red-600 bg-red-50 hover:bg-red-100"
              >
                <LogOut className="w-3 h-3" />
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Impersonation Banner in Main Layout */}
      {originalUser && originalUser.id !== user.id && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-amber-900 leading-tight">
              VOCÊ ESTÁ VENDO O SISTEMA COMO:{" "}
              <span className="font-black uppercase tracking-tight">
                {user.nome}
              </span>
            </p>
          </div>
          <button
            onClick={onClearImpersonation}
            className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-white px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2"
          >
            <X className="w-3 h-3" />
            Sair da Simulação
          </button>
        </div>
      )}

      {originalUser && originalUser.id === user.id && !isCoordenador && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-widest leading-tight">
              Visão do Ministro{" "}
              <span className="text-blue-500 ml-1 font-normal">
                (Modo Visualização)
              </span>
            </p>
          </div>
          <button
            onClick={onClearImpersonation}
            className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all shadow-sm flex items-center gap-2"
          >
            <ChevronLeft className="w-3 h-3" />
            Voltar ao Admin
          </button>
        </div>
      )}

      {/* Gospel Modal - Compact Sacred Style */}
      {showGospelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
          >
            {/* Editorial Header Compact */}
            <div className="relative h-40 bg-slate-900 overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-800 to-slate-950" />
              </div>

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-5 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-3 border border-white/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-2xl text-white mb-1 tracking-tight">
                  Santo Evangelho
                </h3>
                <div className="h-0.5 w-10 bg-liturgy-400 mb-1" />
                <p className="font-serif italic text-slate-300 text-base">
                  {(() => {
                    const now = new Date();
                    const isSaturdayAfternoon =
                      now.getDay() === 6 && now.getHours() >= 17;
                    return isSaturdayAfternoon && vigilGospel
                      ? vigilGospel.ref
                      : dailyGospel.ref;
                  })()}
                </p>
              </div>

              <button
                onClick={() => setShowGospelModal(false)}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-20"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="absolute top-5 right-16 flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20 z-20">
                <button 
                  onClick={() => setFontScale(prev => Math.max(0.7, prev - 0.15))}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
                  title="Diminuir texto"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-white/20" />
                <button 
                  onClick={() => setFontScale(prev => Math.min(2.5, prev + 0.15))}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
                  title="Aumentar texto"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto bg-[#fdfcf9] flex-1 custom-scrollbar">
              <div 
                className="max-w-prose mx-auto"
                style={{ fontSize: `${fontScale}rem`, lineHeight: 1.6 }}
              >
                <div className="space-y-6">
                  {(() => {
                    const now = new Date();
                    const isSaturdayAfternoon =
                      now.getDay() === 6 && now.getHours() >= 17;
                    const text =
                      isSaturdayAfternoon && vigilGospel
                        ? vigilGospel.text
                        : dailyGospel.text;

                    if (!text || text.includes("Carregando")) {
                      return (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                          Aguarde...
                        </div>
                      );
                    }

                    return text.split("\n\n").map((paragraph, i) => {
                      const cleanParagraph = paragraph.trim();
                      if (!cleanParagraph) return null;
                      if (i === 0) {
                        return (
                          <p
                            key={i}
                            className="font-serif text-slate-800 leading-[1.8] first-letter:text-5xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-slate-600 first-letter:leading-none mb-6"
                          >
                            {cleanParagraph}
                          </p>
                        );
                      }
                      return (
                        <p
                          key={i}
                          className="font-serif text-slate-800 leading-[1.8] mb-6"
                        >
                          {cleanParagraph}
                        </p>
                      );
                    });
                  })()}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 text-center">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Palavra da Salvação
                  </span>
                  <h4 className="font-display text-xl text-slate-900 italic">
                    Glória a vós, Senhor
                  </h4>
                </div>

                {(() => {
                  const now = new Date();
                  const isSaturdayAfternoon =
                    now.getDay() === 6 && now.getHours() >= 17;
                  const papasText =
                    isSaturdayAfternoon && vigilGospel
                      ? vigilGospel.papasText
                      : dailyGospel.papasText;

                  if (papasText) {
                    return (
                      <div className="mt-12 pt-10 border-t-2 border-double border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-full bg-liturgy-50">
                              <Church className="w-5 h-5 text-liturgy-500" />
                            </div>
                            <h3 className="font-display text-xl text-slate-800 tracking-tight">
                              O Pensamento do Papa
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <button 
                              onClick={() => setFontScale(prev => Math.max(0.7, prev - 0.15))}
                              className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700"
                              title="Diminuir texto"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => setFontScale(prev => Math.min(2.5, prev + 0.15))}
                              className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700"
                              title="Aumentar texto"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div 
                          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                          style={{ fontSize: `${fontScale}rem` }}
                        >
                          {papasText.split("\n\n").map((paragraph, i) => (
                            <p
                              key={i}
                              className="mb-4 last:mb-0 text-slate-600 italic font-serif leading-relaxed text-center"
                            >
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Modal Footer - Actions Compact */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-5">
              {(() => {
                const now = new Date();
                const isSaturdayAfternoon =
                  now.getDay() === 6 && now.getHours() >= 17;
                const vaticanUrl =
                  isSaturdayAfternoon && vigilGospel
                    ? vigilGospel.vaticanUrl
                    : dailyGospel.vaticanUrl;
                if (vaticanUrl)
                  return (
                    <a
                      href={vaticanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2.5"
                    >
                      <div
                        className={`w-6 h-6 flex items-center justify-center transition-transform group-hover:scale-110 rounded-md bg-${liturgyTheme === "white" ? "slate" : liturgyTheme === "emerald" ? "emerald" : liturgyTheme}-100 text-${liturgyTheme === "white" ? "slate" : liturgyTheme === "emerald" ? "emerald" : liturgyTheme}-700`}
                      >
                        <Church className="w-3.5 h-3.5" />
                      </div>
                      Vatican News
                    </a>
                  );
                return null;
              })()}
              <button
                onClick={() => setShowGospelModal(false)}
                className={`w-full sm:w-auto px-12 py-3.5 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 group relative flex items-center justify-center gap-2 overflow-hidden`}
                style={{
                  backgroundColor: `var(--color-${liturgyTheme === "rose" ? "rose" : liturgyTheme === "emerald" ? "emerald" : liturgyTheme === "purple" ? "purple" : "slate"}-600)`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                  Amém
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showGerarEscalaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowGerarEscalaModal(false)}
        >
          <div
            className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-slate-900">
              Gerar Nova Escala
            </h2>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">
                  Isso irá <strong>substituir permanentemente</strong> a escala
                  do mês selecionado. Tenha certeza de que as disponibilidades
                  estão corretas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Mês
                </label>
                <select
                  value={mesGerar}
                  onChange={(e) => setMesGerar(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-liturgy-500 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Ano
                </label>
                <select
                  value={anoGerar}
                  onChange={(e) => setAnoGerar(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-liturgy-500 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <strong>Atenção:</strong> Certifique-se de que os ministros já
                  preencheram a disponibilidade para o período selecionado.
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmGerarEscala(true)}
                className="w-full bg-liturgy-600 text-black py-3 rounded-xl font-bold hover:bg-liturgy-700 transition-colors flex flex-col items-center justify-center leading-tight shadow-sm"
              >
                <span>Preencher Vagas (Manter Atual)</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">Incluirá apenas os ministros necessários nas missas novas ou vazias</span>
              </button>
              <button
                onClick={() => confirmGerarEscala(false)}
                className="w-full bg-red-50 text-red-700 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex flex-col items-center justify-center leading-tight"
              >
                <span>Zerar e Gerar Novamente</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">Apagará todas as missas do mês e gerará tudo do zero</span>
              </button>
              <button
                onClick={() => setShowGerarEscalaModal(false)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors mt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConferenciaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowConferenciaModal(false)}
        >
          <div
            className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com os botões de ação proeminentes */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  Painel de Controle
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  Conferência de Escala: {monthNames[conferenciaMes - 1]} de {conferenciaAno}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConferenciaModal(false)}
                  className="px-4 py-3 bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loadingConferencia}
                  onClick={() => gerarNovamenteEscala(conferenciaMes, conferenciaAno, true)}
                  className="px-4 py-3 bg-liturgy-600 hover:bg-liturgy-700 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingConferencia ? "animate-spin" : ""}`} />
                  Preencher Vagas
                </button>
                <button
                  type="button"
                  disabled={loadingConferencia}
                  onClick={() => gerarNovamenteEscala(conferenciaMes, conferenciaAno, false)}
                  className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingConferencia ? "animate-spin" : ""}`} />
                  Zerar Mês
                </button>
                <button
                  type="button"
                  disabled={loadingConferencia}
                  onClick={() => publicarEscalaDefinitiva(conferenciaMes, conferenciaAno)}
                  className={`px-6 py-3 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    escalaPublicadaPorMes?.[`${conferenciaAno}-${conferenciaMes.toString().padStart(2, "0")}`]
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {escalaPublicadaPorMes?.[`${conferenciaAno}-${conferenciaMes.toString().padStart(2, "0")}`]
                    ? "Atualizar Escala Publicada"
                    : "Aprovar e Publicar"}
                </button>
              </div>
            </div>

            {/* Conteúdo da Escala */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/20">
              {loadingConferencia ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-500 animate-pulse">
                    Recalculando combinações e atualizando...
                  </p>
                </div>
              ) : !escalaConferencia || Object.keys(escalaConferencia).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-bold mb-1">
                    Nenhuma escala gerada para este período
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Clique em "Gerar Novamente" para criar uma nova combinação com base nas disponibilidades dos ministros.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 pr-2 custom-scrollbar">
                  {Object.keys(escalaConferencia)
                    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date.substring(0, 7) >= currentMonthStr)
                    .sort()
                    .map((data) => (
                      <div key={data} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {format(
                              new Date(data + "T00:00:00"),
                              "EEEE, d 'de' MMMM",
                              { locale: ptBR }
                            )}
                          </h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                            {data}
                          </span>
                          <div className="h-px bg-slate-100 w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(escalaConferencia[data] || {})
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([horario, missa]: [string, any]) => {
                              const isDomingo =
                                format(
                                  new Date(data + "T00:00:00"),
                                  "EEEE",
                                  { locale: ptBR }
                                ).toLowerCase() === "domingo";
                              return (
                                <div
                                  key={horario}
                                  className={`p-5 rounded-2xl border transition-all hover:border-slate-300 bg-white ${
                                    isDomingo ? "border-red-100 shadow-sm shadow-red-50" : "border-slate-200"
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <span
                                        className={`text-base font-black leading-none block ${
                                          isDomingo ? "text-red-600" : "text-slate-900"
                                        }`}
                                      >
                                        {horario}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                        isDomingo ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {missa.nome || "Missa"}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {(Array.isArray(missa)
                                      ? missa
                                      : missa?.ministros || []
                                    ).map((m: string, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100/80"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <span className="text-xs font-medium text-slate-700">
                                          {m}
                                        </span>
                                      </div>
                                    ))}
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
          </div>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {user.role === "admin" && (
            <div className="mb-4">
              <button
                onClick={() => onSetView("admin")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar ao Painel de Administração
              </button>
            </div>
          )}
          {!user.paroquia && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-800">Cadastro Incompleto</h3>
                <p className="text-sm text-red-700 mt-1">
                  Seu perfil não possui uma paróquia definida. Isso impede que
                  você veja os dados corretamente e apareça nas listas.
                  <br />
                  Por favor, vá até a aba <strong>Meu Perfil</strong> e atualize
                  seus dados.
                </p>
                <button
                  onClick={() => setActiveTab("editar")}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Atualizar Agora
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-liturgy-600 border-t-transparent rounded-full"></div>
              <p className="text-slate-400 font-medium">
                Sincronizando dados...
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "welcome" && (
                <WelcomeView
                  user={user}
                  birthdayMessage={birthdayMessage}
                  aniversariantes={aniversariantes}
                  onLogout={onLogout}
                  onVerEscala={() => setActiveTab("escala")}
                  onSetView={onSetView}
                  onUpdateUser={setUser}
                  slotsDisponiveis={slotsDisponiveisApp}
                  escala={escalaApp}
                  needsPasswordReset={needsPasswordReset}
                  disponibilidadeAberta={disponibilidadeAberta}
                  escalaPublicada={
                    isCoordenador
                      ? true
                      : escalaApp && Object.keys(escalaApp).length > 0
                  }
                  hasSubmitted={hasSubmittedGlobal}
                  mesSelecionado={mesSelecionado}
                  anoSelecionado={anoSelecionado}
                  unreadCount={unreadCount}
                  isTab={true}
                  onSetTab={setActiveTab}
                  liturgyColor={liturgyTheme}
                  showPreAberturaMessage={showPreAberturaMessage}
                  mensagemDisponibilidade={mensagemDisponibilidade}
                  onAlert={onAlert}
                />
              )}

              {activeTab === "home" &&
                (!isCoordenador ? (
                  <WelcomeView
                    user={user}
                    birthdayMessage={birthdayMessage}
                    aniversariantes={aniversariantes}
                    onLogout={onLogout}
                    onVerEscala={() => setActiveTab("escala")}
                    onSetView={onSetView}
                    onUpdateUser={setUser}
                    slotsDisponiveis={slotsDisponiveisApp}
                    escala={escalaApp}
                    needsPasswordReset={needsPasswordReset}
                    disponibilidadeAberta={disponibilidadeAberta}
                    escalaPublicada={
                      isCoordenador
                        ? true
                        : escalaApp && Object.keys(escalaApp).length > 0
                    }
                    hasSubmitted={hasSubmittedGlobal}
                    mesSelecionado={mesSelecionado}
                    anoSelecionado={anoSelecionado}
                    unreadCount={unreadCount}
                    isTab={true}
                    onSetTab={setActiveTab}
                    liturgyColor={liturgyTheme}
                    showPreAberturaMessage={showPreAberturaMessage}
                    mensagemDisponibilidade={mensagemDisponibilidade}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Pre Abertura Alert for Coordinators */}
                    {showPreAberturaMessage && !disponibilidadeAberta && (
                      <div className="p-4 bg-liturgy-50 border border-liturgy-200 rounded-2xl flex items-center gap-3 text-liturgy-800 shadow-sm animate-in fade-in">
                        <Info className="w-5 h-5 text-liturgy-600 flex-shrink-0" />
                        <p className="font-bold text-sm leading-tight">
                          A disponibilidade será aberta em breve.
                        </p>
                      </div>
                    )}

                    {mensagemDisponibilidade && (
                      <div
                        className={`p-4 border rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in ${
                          mensagemDisponibilidade.tipo === "warning"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : mensagemDisponibilidade.tipo === "error"
                              ? "bg-red-50 border-red-200 text-red-800"
                              : mensagemDisponibilidade.tipo === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-blue-50 border-blue-200 text-blue-800"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {mensagemDisponibilidade.tipo === "success" ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : mensagemDisponibilidade.tipo === "warning" ||
                            mensagemDisponibilidade.tipo === "error" ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <p className="font-bold text-sm leading-tight">
                          {mensagemDisponibilidade.texto}
                        </p>
                      </div>
                    )}

                    {/* Welcome Screen - Softened and Delicate (Light Green) */}
                    <div
                      className={`p-4 md:p-5 rounded-2xl shadow-sm border ${themeClasses.light} border-liturgy-100/80 text-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden group`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Church className={`w-32 h-32 ${themeClasses.text}`} />
                      </div>
                      <div className="relative z-10 space-y-1 sm:mb-0 mb-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 ${themeClasses.light} rounded-full border border-liturgy-200/50 text-[9px] font-black uppercase tracking-widest ${themeClasses.text}`}
                        >
                          <Activity className="w-3 h-3" />
                          Portal da Coordenação
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                          Bem-vindo(a), Coordenador(a){" "}
                          {(user.nomeExibicao || user.nome || "").split(" ")[0]}
                          !
                        </h2>
                        <p
                          className={`${themeClasses.text}/80 text-xs font-medium`}
                        >
                          Liderando com amor na paróquia {user.paroquia}.
                        </p>
                      </div>
                      <div
                        className={`relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border border-liturgy-100/50 px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[120px]`}
                      >
                        <p
                          className={`text-[9px] font-black uppercase tracking-widest ${themeClasses.text} mb-0.5`}
                        >
                          Competência
                        </p>
                        <p
                          className={`text-sm font-black ${themeClasses.text}`}
                        >
                          {monthNames[mesSelecionado - 1]} / {anoSelecionado}
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Gospel Card - Very Slim for Coordinator */}
                      <div
                        onClick={() => setShowGospelModal(true)}
                        className="relative overflow-hidden group cursor-pointer"
                      >
                        <div
                          className={`p-3.5 rounded-2xl shadow-sm border border-slate-200 bg-white hover:shadow-md transition-all h-full flex items-center justify-between gap-4`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 ${themeClasses.light} ${themeClasses.text} rounded-lg flex items-center justify-center`}
                            >
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                Evangelho
                              </p>
                              <h3 className="font-display font-bold text-sm text-slate-900 leading-none">
                                {(() => {
                                  const now = new Date();
                                  const isSaturdayAfternoon =
                                    now.getDay() === 6 && now.getHours() >= 17;
                                  return isSaturdayAfternoon && vigilGospel
                                    ? vigilGospel.ref
                                    : dailyGospel.ref;
                                })()}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center">
                              <ChevronLeft className="w-3 h-3 rotate-180 text-liturgy-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => setActiveTab("disponibilidade")}
                        className={`${themeClasses.light} p-4 rounded-2xl shadow-sm border border-liturgy-300 cursor-pointer hover:shadow-md transition-all`}
                      >
                        <div
                          className={`w-8 h-8 ${themeClasses.light} ${themeClasses.text} rounded-lg flex items-center justify-center mb-3`}
                        >
                          <LayoutDashboard className="w-4.5 h-4.5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Disponibilidade
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p
                            className={`text-2xl font-black ${hasSubmittedGlobal ? "text-emerald-600" : disponibilidadeAberta ? "text-black" : escalaPublicadaPorMes?.[`${anoSelecionado}-${mesSelecionado.toString().padStart(2, "0")}`] ? "text-black" : "text-blue-500"}`}
                          >
                            {hasSubmittedGlobal
                              ? "Enviada"
                              : disponibilidadeAberta
                                ? "Aberta"
                                : escalaPublicadaPorMes?.[
                                      `${anoSelecionado}-${mesSelecionado.toString().padStart(2, "0")}`
                                    ]
                                  ? "Fechada"
                                  : "Aguardando"}
                          </p>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter truncate">
                          {hasSubmittedGlobal
                            ? `${monthNames[mesSelecionado - 1]} registrada`
                            : disponibilidadeAberta
                              ? `${monthNames[mesSelecionado - 1]} recebendo`
                              : escalaPublicadaPorMes?.[
                                    `${anoSelecionado}-${mesSelecionado.toString().padStart(2, "0")}`
                                  ]
                                ? `${monthNames[mesSelecionado - 1]} fechada`
                                : `${monthNames[mesSelecionado - 1]} aguardando`}
                        </p>
                      </div>
                      <div
                        onClick={() => setActiveTab("mensagem")}
                        className={`${themeClasses.light} p-4 rounded-2xl shadow-sm border border-liturgy-300 cursor-pointer hover:shadow-md transition-all relative`}
                      >
                        {unreadCount > 0 && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                            {unreadCount}
                          </div>
                        )}
                        <div
                          className={`w-8 h-8 ${themeClasses.light} ${themeClasses.text} rounded-lg flex items-center justify-center mb-3`}
                        >
                          <MessageSquare className="w-4.5 h-4.5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Mensagens
                        </p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {directMessages.length}
                        </p>
                      </div>
                      <div
                        onClick={() => {
                          setActiveTab("relatorios");
                          setSubTab("registradas");
                        }}
                        className={`${themeClasses.light} p-4 rounded-2xl shadow-sm border border-liturgy-300 cursor-pointer hover:shadow-md transition-all`}
                      >
                        <div
                          className={`w-8 h-8 ${themeClasses.light} ${themeClasses.text} rounded-lg flex items-center justify-center mb-3`}
                        >
                          <Clipboard className="w-4.5 h-4.5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Registros
                        </p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {stats.totalDisponibilidades || 0}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {/* Section for Upcoming Weekend/Future Schedules for Coordinators */}
                      {showWeekendReminder && weekendAssignments.length > 0 ? (
                        <div
                          className={`p-4 md:p-5 ${themeClasses.light} border ${themeClasses.border} rounded-2xl shadow-sm relative overflow-hidden group`}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Calendar className={`w-32 h-32 ${themeClasses.text}`} />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2.5 mb-3">
                              <div
                                className={`w-8 h-8 ${themeClasses.light} ${themeClasses.text} rounded-lg flex items-center justify-center border border-slate-200/50`}
                              >
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                                  Seus Próximos Agendamentos (Você está escalado!)
                                </h3>
                                <p className={`text-[10px] ${themeClasses.text}/85 font-bold uppercase mt-1`}>
                                  Fique atento à sua atuação na escala
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2.5 mt-4">
                              {weekendAssignments.map((assign, idx) => {
                                const dateObj = new Date(assign.date + "T00:00:00");
                                const dayNum = dateObj.getDate();
                                const weekdays = [
                                  "Domingo",
                                  "Segunda-feira",
                                  "Terça-feira",
                                  "Quarta-feira",
                                  "Quinta-feira",
                                  "Sexta-feira",
                                  "Sábado",
                                ];
                                const fullWeekday = weekdays[dateObj.getDay()];

                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/80 shadow-sm transition-all hover:bg-white"
                                  >
                                    <div
                                      className={`${themeClasses.light} ${themeClasses.text} w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm px-2`}
                                    >
                                      <span className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 opacity-70">
                                        Dia
                                      </span>
                                      <span className="text-xl font-black leading-none">
                                        {dayNum}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-black text-slate-900 leading-tight truncate">
                                        {fullWeekday}
                                      </h4>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                                        <span
                                          className={`font-black ${themeClasses.text} bg-stone-100 flex items-center gap-1 px-2 py-0.5 rounded-lg border border-stone-200/30`}
                                        >
                                          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                          Horário: {assign.time || assign.horario}
                                        </span>
                                        <span className="text-slate-500 font-medium truncate max-w-[150px] sm:max-w-none">
                                          {assign.nome || "Missa"}
                                        </span>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {user.paroquia}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`${themeClasses.light}/40 rounded-2xl border border-dashed ${themeClasses.border}/60 p-6 flex flex-col items-center justify-center text-center`}
                        >
                          <Calendar className={`w-8 h-8 ${themeClasses.text} opacity-20 mb-2`} />
                          <p className={`font-bold text-xs ${themeClasses.text}/70 uppercase tracking-widest`}>
                            Nenhum agendamento pessoal na escala para os próximos dias.
                          </p>
                        </div>
                      )}

                      {/* Pending Approvals Alert */}
                      {stats.pendingApprovals > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                              <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-blue-900 text-sm">
                                Novas Solicitações de Ministros
                              </h3>
                              <p className="text-xs text-blue-700">
                                Existem {stats.pendingApprovals} novos ministros
                                aguardando sua aprovação.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("ministros")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                          >
                            Analisar Agora
                          </button>
                        </div>
                      )}

                      {/* Low Stock Alert */}
                      {stats.lowStockCount > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-red-900 text-sm">
                                Alerta de Estoque Baixo
                              </h3>
                              <p className="text-xs text-red-700">
                                Existem {stats.lowStockCount} itens com estoque
                                abaixo do limite de segurança.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("estoque")}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200"
                          >
                            Ver Estoque
                          </button>
                        </div>
                      )}

                      {/* Birthdays Preview */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-bold text-lg text-slate-900">
                            Aniversariantes do Mês
                          </h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {aniversariantes.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 italic text-sm col-span-full">
                              Nenhum aniversariante este mês.
                            </p>
                          ) : (
                            aniversariantes.map((niver, i) => {
                              const isToday =
                                niver.dia === new Date().getDate();
                              return (
                                <div
                                  key={i}
                                  className={`p-4 rounded-2xl border flex items-center gap-4 ${isToday ? "bg-blue-50 border-blue-300" : "bg-white border-liturgy-200"}`}
                                >
                                  <div className="w-10 h-10 bg-liturgy-100 text-black rounded-xl flex items-center justify-center font-black text-base">
                                    {niver.dia}
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-slate-800">
                                      {niver.nome}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                      {niver.tipo}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Removed 'pendentes' tab */}

              {activeTab === "ministros" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">
                      Gestão de Ministros
                    </h3>
                  </div>
                  <div className="p-6">
                    <CoordenacaoCadastroView
                      user={user}
                      onUpdateUser={setUser}
                      onNewUserRegistered={() => {
                        fetchData();
                      }}
                      onSetView={onSetView}
                      onCustomConfirm={onCustomConfirm}
                      onImpersonate={onImpersonate}
                    />
                  </div>
                </div>
              )}

              {activeTab === "comunhao" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Comunhão</h3>
                  </div>
                  <div className="p-6">
                    <ComunhaoView
                      user={user}
                      isTab={true}
                      onCustomConfirm={onCustomConfirm}
                      onAlert={onAlert}
                    />
                  </div>
                </div>
              )}

              {activeTab === "testes" && user.role === "admin" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">
                      Configurações de Teste
                    </h3>
                  </div>
                  <div className="p-6">
                    <AdminParoquiasView
                      user={user}
                      onCustomConfirm={onCustomConfirm}
                    />
                  </div>
                </div>
              )}

              {activeTab === "missas" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">
                      Gestão de Missas
                    </h3>
                  </div>
                  <div className="p-6">
                    <CoordenacaoMissasView
                      user={user}
                      mesSelecionado={mesSelecionado}
                      anoSelecionado={anoSelecionado}
                    />
                  </div>
                </div>
              )}

              {activeTab === "estoque" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">
                      Estoque de Materiais
                    </h3>
                  </div>
                  <div className="p-6">
                    <AdminEstoqueView
                      user={user}
                      onCustomConfirm={onCustomConfirm}
                    />
                  </div>
                </div>
              )}

              {activeTab === "editar" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Perfil</h3>
                  </div>
                  <div className="p-6">
                    <CadastroView
                      user={user}
                      onSave={handleSaveUser}
                      isTab={true}
                      onBack={() => setActiveTab("home")}
                      voltar={() => setActiveTab("home")}
                      onSetView={onSetView}
                    />
                  </div>
                </div>
              )}

              {activeTab === "calendario" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Calendário Litúrgico
                    </h3>
                    <button
                      onClick={() => setActiveTab("home")}
                      className="text-xs font-bold text-liturgy-600 hover:text-liturgy-700 transition-colors"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                  <div className="p-4">
                    <CalendarioCatolicoView
                      isTab={true}
                      slots={slotsDisponiveisApp}
                      user={user}
                      voltar={() => setActiveTab("home")}
                    />
                  </div>
                </div>
              )}

              {activeTab === "disponibilidade" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-liturgy-50/30">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-liturgy-500" />
                      Minha Disponibilidade
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        {hasSubmittedGlobal && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                            Já Enviado
                          </span>
                        )}
                        {isCoordenador ? (
                          <>
                            <select
                              value={mesSelecionado}
                              onChange={(e) =>
                                setMesSelecionado(Number(e.target.value))
                              }
                              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-liturgy-500"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (m) => (
                                  <option key={m} value={m}>
                                    {new Date(2000, m - 1)
                                      .toLocaleDateString("pt-BR", {
                                        month: "short",
                                      })
                                      .toUpperCase()}
                                  </option>
                                ),
                              )}
                            </select>
                            <select
                              value={anoSelecionado}
                              onChange={(e) =>
                                setAnoSelecionado(Number(e.target.value))
                              }
                              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-liturgy-500"
                            >
                              {[
                                new Date().getFullYear(),
                                new Date().getFullYear() + 1,
                              ].map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                              {monthNames[mesSelecionado - 1]} /{" "}
                              {anoSelecionado}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-liturgy-600/70 uppercase tracking-tighter">
                        {viewAsMinister ? "Visão Simulada" : "Acesso Pessoal"}
                      </p>
                    </div>
                  </div>
                  <div className="p-0">
                    {(() => {
                      const slotsPorDiaMap = (slotsDisponiveisApp || []).reduce(
                        (acc: any, slot: any) => {
                          if (!slot || !slot.data) return acc;
                          if (!acc[slot.data]) {
                            acc[slot.data] = {
                              diaFormatado:
                                slot.diaFormatado ||
                                (slot.data
                                  ? format(
                                      new Date(slot.data + "T00:00:00"),
                                      "EEEE, dd 'de' MMMM",
                                      { locale: ptBR },
                                    )
                                  : ""),
                              slots: [],
                            };
                          }
                          acc[slot.data].slots.push(slot);
                          return acc;
                        },
                        {},
                      );

                      const hasException = !!(
                        user?.excecaoAcessoAte &&
                        new Date(user.excecaoAcessoAte) > new Date()
                      );
                      const hasSubmitted =
                        (initialSlotsSelecionados || []).length > 0;
                      const isLocked =
                        (hasSubmitted && !hasException) ||
                        (!disponibilidadeAberta && !hasException);
                      const hideForm = isLocked;

                      return (
                        <div className="bg-slate-50 min-h-[600px] w-full flex flex-col p-4 sm:p-6 font-sans">
                          {hideForm ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                              {hasSubmitted ? (
                                <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-lg shadow-sm">
                                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-4 mx-auto" />
                                  <p className="font-bold text-xl text-emerald-800">
                                    Agendamento Recebido
                                  </p>
                                  <p className="text-sm text-emerald-600 mt-2">
                                    Sua disponibilidade já foi enviada com
                                    sucesso! Caso precise de alguma alteração,
                                    contate a coordenação para desbloquear seu
                                    acesso.
                                  </p>
                                </div>
                              ) : showPreAberturaMessage ? (
                                <div className="mb-6 p-6 bg-liturgy-50 border border-liturgy-200 rounded-2xl max-w-lg shadow-sm animate-bounce">
                                  <Info className="w-10 h-10 text-liturgy-600 mb-4 mx-auto" />
                                  <p className="font-bold text-xl text-liturgy-800">
                                    Em breve a disponibilidade será aberta!
                                  </p>
                                  <p className="text-sm text-liturgy-600 mt-2">
                                    Fique atento(a), o período para enviar sua
                                    disponibilidade iniciará em breve. Obrigado!
                                  </p>
                                </div>
                              ) : (
                                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl max-w-lg shadow-sm">
                                  <Lock className="w-10 h-10 text-blue-600 mb-4 mx-auto" />
                                  <p className="font-bold text-xl text-blue-800">
                                    Agendamento de Disponibilidade Encerrado
                                  </p>
                                  <p className="text-sm text-blue-600 mt-2">
                                    O período para envio do Agendamento Mensal
                                    de Disponibilidade foi concluído. Caso
                                    precise de suporte, contate a coordenação.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <form
                                onSubmit={(e) =>
                                  handleSubmit(e, () => setActiveTab("home"))
                                }
                                className={`space-y-8 ${isLocked ? "pointer-events-none opacity-50 grayscale" : ""}`}
                              >
                                  {parentError && (
                                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2 mb-4">
                                      <AlertCircle className="w-4 h-4" />
                                      {parentError}
                                    </div>
                                  )}
                                  {parentMessage && (
                                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-bold animate-pulse flex items-center gap-2 mb-4">
                                      <Check className="w-4 h-4" />
                                      {parentMessage}
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 gap-8">
                                    {/* Diárias */}
                                    {(() => {
                                      const diasSemana = Object.keys(
                                        slotsPorDiaMap,
                                      )
                                        .filter((data) => {
                                          const dateObj = new Date(
                                            data + "T00:00:00",
                                          );
                                          const dayOfWeek = dateObj.getDay();
                                          return dayOfWeek > 0 && dayOfWeek < 6;
                                        })
                                        .sort();
                                      if (diasSemana.length === 0) return null;

                                      const dayOfWeekMap: Record<
                                        number,
                                        string[]
                                      > = [1, 2, 3, 4, 5].reduce(
                                        (acc: any, dow) => {
                                          acc[dow] = diasSemana
                                            .filter((data) => {
                                              return (
                                                new Date(
                                                  data + "T00:00:00",
                                                ).getDay() === dow
                                              );
                                            })
                                            .sort();
                                          return acc;
                                        },
                                        {},
                                      );

                                      const activeDays = [1, 2, 3, 4, 5].filter(
                                        (dow) => dayOfWeekMap[dow].length > 0,
                                      );
                                      const dayNames: Record<number, string> = {
                                        1: "Segunda-feira",
                                        2: "Terça-feira",
                                        3: "Quarta-feira",
                                        4: "Quinta-feira",
                                        5: "Sexta-feira",
                                      };

                                      return (
                                        <div className="overflow-hidden">
                                          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                                              <CalendarDays className="w-6 h-6 text-white" />
                                            </div>
                                            Missas Diárias
                                          </h2>
                                          <div className={`grid ${activeDays.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : activeDays.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 sm:gap-8" : activeDays.length === 3 ? "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6 sm:gap-8" : activeDays.length === 4 ? "grid-cols-1 md:grid-cols-4 max-w-6xl mx-auto gap-6 sm:gap-8" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8"}`}>
                                            {activeDays.map((dow) => {
                                              const days = dayOfWeekMap[dow];
                                              return (
                                                <div
                                                  key={dow}
                                                  className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-md flex flex-col h-full ring-1 ring-slate-100/50"
                                                >
                                                  <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md px-5 py-5 border-b border-slate-200/60 text-center">
                                                    <span className="text-base font-extrabold text-slate-800 tracking-wide">
                                                      {dayNames[dow]}
                                                    </span>
                                                  </div>

                                                  <div className="p-5 flex-1 overflow-y-auto thin-scrollbar">
                                                    <div className="space-y-6">
                                                      {days.map((data, idx) => (
                                                        <div
                                                          key={data}
                                                          className={
                                                            idx > 0
                                                              ? "pt-6 border-t border-slate-100"
                                                              : ""
                                                          }
                                                        >
                                                          <div className="flex items-center gap-2 mb-4 px-1">
                                                            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                            <h3 className="font-extrabold text-slate-700 capitalize text-sm tracking-tight">
                                                              {
                                                                slotsPorDiaMap[
                                                                  data
                                                                ].diaFormatado
                                                              }
                                                            </h3>
                                                          </div>
                                                          <div className="space-y-3">
                                                            {slotsPorDiaMap[
                                                              data
                                                            ].slots.map(
                                                              (slot) => {
                                                                const selection =
                                                                  slotsSelecionados.find(
                                                                    (s) =>
                                                                      s.id ===
                                                                      slot.id,
                                                                  );
                                                                const isSelected =
                                                                  !!selection;
                                                                const initialSelection =
                                                                  initialSlotsSelecionados.find(
                                                                    (s) =>
                                                                      s.id ===
                                                                      slot.id,
                                                                  );
                                                                const wasInitiallySelected =
                                                                  !!initialSelection;
                                                                const occupancyKey =
                                                                  getChaveOcupacao(
                                                                    slot,
                                                                  );
                                                                const servCountData =
                                                                  ocupacao[
                                                                    occupancyKey
                                                                  ] || 0;
                                                                const servCount =
                                                                  typeof servCountData ===
                                                                  "object"
                                                                    ? servCountData.total ||
                                                                      0
                                                                    : servCountData;
                                                                const lim =
                                                                  getLimiteVagas(
                                                                    slot,
                                                                  );

                                                                const getPeso =
                                                                  (
                                                                    modo:
                                                                      | "ele"
                                                                      | "ela"
                                                                      | "casal",
                                                                  ) => {
                                                                    if (
                                                                      modo ===
                                                                      "casal"
                                                                    )
                                                                      return 2;
                                                                    if (
                                                                      modo ===
                                                                        "ele" ||
                                                                      modo ===
                                                                        "ela"
                                                                    )
                                                                      return 1;
                                                                    return 1;
                                                                  };

                                                                const pesoInicial =
                                                                  wasInitiallySelected
                                                                    ? getPeso(
                                                                        initialSelection.modo as any,
                                                                      )
                                                                    : 0;
                                                                const pesoAtual =
                                                                  isSelected
                                                                    ? getPeso(
                                                                        selection.modo as any,
                                                                      )
                                                                    : 0;
                                                                const ocupadosProjetados =
                                                                  servCount -
                                                                  pesoInicial +
                                                                  pesoAtual;

                                                                const pesoParaCheck =
                                                                  user.tipo === "casal"
                                                                    ? isSelected
                                                                      ? getPeso(
                                                                          selection.modo as any,
                                                                        )
                                                                      : 2
                                                                    : 1;
                                                                const disponivel =
                                                                  servCount - pesoInicial + pesoParaCheck <= lim;
                                                                const isFull = false;
                                                                const nomeMinistro =
                                                                  user?.nomeExibicao ||
                                                                  user?.nome ||
                                                                  "";
                                                                const isUserScheduled =
                                                                  escalaApp &&
                                                                  slot?.data &&
                                                                  slot?.horario &&
                                                                  escalaApp[slot.data] &&
                                                                  escalaApp[slot.data][
                                                                    slot.horario
                                                                  ] &&
                                                                  (
                                                                    (
                                                                      escalaApp[slot.data][
                                                                        slot.horario
                                                                      ] as any
                                                                    ).ministros || []
                                                                  ).includes(nomeMinistro);
                                                                const isDisabled =
                                                                  isFull || isUserScheduled;

                                                                return (
                                                                  <div
                                                                    key={
                                                                      slot.id
                                                                    }
                                                                    className="flex flex-col gap-2"
                                                                  >
                                                                    <label
                                                                      className={`
                                                                  relative flex flex-col p-4 rounded-2xl transition-all duration-200 border w-full
                                                                  ${isDisabled ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : "cursor-pointer"}
                                                                  ${isSelected ? "bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-100" : !isDisabled && "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"}
                                                                `}
                                                                    >
                                                                      <input
                                                                        type="checkbox"
                                                                        className="hidden"
                                                                        checked={
                                                                          isSelected
                                                                        }
                                                                        onChange={() =>
                                                                          !isDisabled &&
                                                                          handleSlotChange(
                                                                            slot.id,
                                                                          )
                                                                        }
                                                                        disabled={isDisabled}
                                                                      />
                                                                      <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-xl font-extrabold leading-none tracking-tight">
                                                                          {
                                                                            slot.horario
                                                                          }
                                                                        </span>
                                                                        <div
                                                                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isDisabled ? "bg-blue-100 text-blue-600" : isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                                                                        >
                                                                          {
                                                                            ocupadosProjetados
                                                                          }
                                                                          /
                                                                          {
                                                                            lim
                                                                          } VAGAS
                                                                        </div>
                                                                      </div>
                                                                      <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <div
                                                                          className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-white" : isDisabled ? "bg-slate-300" : "bg-blue-500"}`}
                                                                        ></div>
                                                                        <span
                                                                          className={`text-xs font-semibold truncate ${isSelected ? "text-white/90" : "text-slate-600"}`}
                                                                        >
                                                                          {slot.nome}
                                                                        </span>
                                                                      </div>
                                                                      {isSelected && (
                                                                        <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-white text-blue-600 rounded-full border-2 border-white shadow-md z-10" />
                                                                      )}
                                                                    </label>
                                                                    {isSelected &&
                                                                      user.tipo ===
                                                                        "casal" && (
                                                                        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                                                                          <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                              handleModeChange(
                                                                                slot.id,
                                                                                "casal",
                                                                              )
                                                                            }
                                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${selection.modo === "casal" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-blue-600"}`}
                                                                          >
                                                                            Casal
                                                                          </button>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                              handleModeChange(
                                                                                slot.id,
                                                                                "ele",
                                                                              )
                                                                            }
                                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${selection.modo === "ele" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-blue-600"}`}
                                                                          >
                                                                            {
                                                                              (
                                                                                user.nomeExibicao ||
                                                                                user.nome ||
                                                                                ""
                                                                              ).split(
                                                                                " ",
                                                                              )[0]
                                                                            }
                                                                          </button>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                              handleModeChange(
                                                                                slot.id,
                                                                                "ela",
                                                                              )
                                                                            }
                                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${selection.modo === "ela" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-blue-600"}`}
                                                                          >
                                                                            {
                                                                              (
                                                                                user.nomeExibicaoConjuge ||
                                                                                user.nomeConjuge ||
                                                                                ""
                                                                              ).split(
                                                                                " ",
                                                                              )[0]
                                                                            }
                                                                          </button>
                                                                        </div>
                                                                      )}
                                                                  </div>
                                                                );
                                                              },
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    {/* Finais de semana */}
                                    {(() => {
                                      const diasFimDeSemana = Object.keys(
                                        slotsPorDiaMap,
                                      )
                                        .filter((data) => {
                                          const dateObj = new Date(
                                            data + "T00:00:00",
                                          );
                                          const dayOfWeek = dateObj.getDay();
                                          return (
                                            dayOfWeek === 0 || dayOfWeek === 6
                                          ); // Sunday or Saturday
                                        })
                                        .sort();

                                      if (diasFimDeSemana.length === 0)
                                        return null;

                                      const weekends = [];
                                      let currentWeekend: {
                                        sabado: string | null;
                                        domingo: string | null;
                                      } = { sabado: null, domingo: null };

                                      diasFimDeSemana.forEach((data) => {
                                        const dateObj = new Date(
                                          data + "T00:00:00",
                                        );
                                        const day = dateObj.getDay();

                                        if (day === 6) {
                                          // Saturday
                                          if (currentWeekend.sabado) {
                                            weekends.push(currentWeekend);
                                            currentWeekend = {
                                              sabado: data,
                                              domingo: null,
                                            };
                                          } else {
                                            currentWeekend.sabado = data;
                                          }
                                        } else if (day === 0) {
                                          // Sunday
                                          currentWeekend.domingo = data;
                                          weekends.push(currentWeekend);
                                          currentWeekend = {
                                            sabado: null,
                                            domingo: null,
                                          };
                                        }
                                      });
                                      if (
                                        currentWeekend.sabado ||
                                        currentWeekend.domingo
                                      ) {
                                        weekends.push(currentWeekend);
                                      }

                                      const renderDayCard = (data: string) => {
                                        const slotsDoDia =
                                          slotsPorDiaMap[data].slots;
                                        if (slotsDoDia.length === 0)
                                          return null;

                                        return (
                                          <div
                                            key={data}
                                            className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm"
                                          >
                                            <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100 font-bold text-emerald-900 capitalize text-xs">
                                              {
                                                slotsPorDiaMap[data]
                                                  .diaFormatado
                                              }
                                            </div>
                                            <div className="p-3 space-y-2">
                                              {slotsDoDia.map((slot: any) => {
                                                const selection =
                                                  slotsSelecionados.find(
                                                    (s: any) =>
                                                      s.id === slot.id,
                                                  );
                                                const isSelected = !!selection;
                                                const initialSelection =
                                                  initialSlotsSelecionados.find(
                                                    (s: any) =>
                                                      s.id === slot.id,
                                                  );
                                                const wasInitiallySelected =
                                                  !!initialSelection;
                                                const occupancyKey =
                                                  getChaveOcupacao(slot);
                                                const servCountData =
                                                  ocupacao[occupancyKey] || 0;
                                                const servCount =
                                                  typeof servCountData ===
                                                  "object"
                                                    ? servCountData.total || 0
                                                    : servCountData;
                                                const lim =
                                                  getLimiteVagas(slot);

                                                const getPeso = (modo) => {
                                                  if (modo === "casal")
                                                    return 2;
                                                  if (
                                                    modo === "ele" ||
                                                    modo === "ela"
                                                  )
                                                    return 1;
                                                  return 1;
                                                };

                                                const pesoInicial =
                                                  wasInitiallySelected
                                                    ? getPeso(
                                                        initialSelection.modo,
                                                      )
                                                    : 0;
                                                const pesoAtual = isSelected
                                                  ? getPeso(selection.modo)
                                                  : 0;
                                                const ocupadosProjetados =
                                                  servCount -
                                                  pesoInicial +
                                                  pesoAtual;

                                                return (
                                                  <div
                                                    key={slot.id}
                                                    className="flex flex-col gap-2"
                                                  >
                                                    <label
                                                      className={`relative flex items-center p-3 rounded-xl transition-all duration-200 border w-full cursor-pointer ${isSelected ? "bg-emerald-600 border-emerald-700 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"}`}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                          handleSlotChange(
                                                            slot.id,
                                                          )
                                                        }
                                                      />
                                                      <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                          <span className="block text-sm font-bold leading-none">
                                                            {slot.horario} -{" "}
                                                            {slot.nome}
                                                          </span>
                                                          <span
                                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                                                          >
                                                            {ocupadosProjetados}
                                                            /{lim}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      {isSelected && (
                                                        <Check className="absolute top-2.5 right-2.5 w-3 h-3" />
                                                      )}
                                                    </label>
                                                    {isSelected &&
                                                      user.tipo === "casal" && (
                                                        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                                                          {[
                                                            "casal",
                                                            "ele",
                                                            "ela",
                                                          ].map((m) => (
                                                            <button
                                                              key={m}
                                                              type="button"
                                                              onClick={() =>
                                                                handleModeChange(
                                                                  slot.id,
                                                                  m as any,
                                                                )
                                                              }
                                                              className={`flex-1 py-1 text-[8px] font-bold rounded uppercase tracking-tighter ${selection.modo === m ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
                                                            >
                                                              {m === "ele"
                                                                ? (
                                                                    user.nomeExibicao ||
                                                                    user.nome ||
                                                                    ""
                                                                  ).split(
                                                                    " ",
                                                                  )[0]
                                                                : m === "ela"
                                                                  ? (
                                                                      user.nomeExibicaoConjuge ||
                                                                      user.nomeConjuge ||
                                                                      ""
                                                                    ).split(
                                                                      " ",
                                                                    )[0]
                                                                  : "Casal"}
                                                            </button>
                                                          ))}
                                                        </div>
                                                      )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      };

                                      return (
                                        <div className="space-y-4">
                                          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                            Missas de Fim de Semana
                                          </h2>
                                          <div className="space-y-6">
                                            {weekends.map((weekend, idx) => (
                                              <div
                                                key={idx}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                              >
                                                {weekend.sabado ? (
                                                  renderDayCard(weekend.sabado)
                                                ) : (
                                                  <div className="hidden md:block"></div>
                                                )}
                                                {weekend.domingo ? (
                                                  renderDayCard(weekend.domingo)
                                                ) : (
                                                  <div className="hidden md:block"></div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="pt-4 pb-12">
                                    <button
                                      type="submit"
                                      disabled={
                                        !validarSelecao().valid || isLocked
                                      }
                                      className={`w-full py-4 px-6 rounded-2xl transition duration-300 font-bold text-md shadow-lg ${!validarSelecao().valid || isLocked ? "bg-slate-200 text-slate-400 cursor-not-allowed grayscale" : "bg-red-600 text-white hover:bg-red-700 shadow-red-200"}`}
                                    >
                                      {isLocked
                                        ? "Disponibilidade Confirmada"
                                        : isCoordenador
                                          ? "Enviar Disponibilidade"
                                          : hasSubmitted
                                            ? "Atualizar Disponibilidade"
                                            : "Confirmar Disponibilidade"}
                                    </button>
                                    <p
                                      className={`text-center text-sm mt-3 font-medium ${!validarSelecao().valid ? "text-red-500" : "text-emerald-600"}`}
                                    >
                                      {validarSelecao().message}
                                    </p>
                                  </div>
                                </form>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === "relatorios" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">
                          Relatórios e Gestão:
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mesSelecionado}
                          onChange={(e) =>
                            setMesSelecionado(Number(e.target.value))
                          }
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (m) => (
                              <option key={m} value={m}>
                                {new Date(2000, m - 1)
                                  .toLocaleDateString("pt-BR", {
                                    month: "long",
                                  })
                                  .toUpperCase()}
                              </option>
                            ),
                          )}
                        </select>
                        <select
                          value={anoSelecionado}
                          onChange={(e) =>
                            setAnoSelecionado(Number(e.target.value))
                          }
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[
                            new Date().getFullYear(),
                            new Date().getFullYear() + 1,
                          ].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSubTab("registradas")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === "registradas" ? "bg-blue-100 text-black shadow-md border border-blue-200" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                          Disponibilidades Registradas
                        </button>
                        <button
                          onClick={() => setSubTab("faltantes")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === "faltantes" ? "bg-blue-100 text-blue-900 shadow-md border border-blue-200" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                          Ministros Pendentes de Envio
                        </button>
                        <button
                          onClick={() => setSubTab("monitoramento")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === "monitoramento" ? "bg-blue-100 text-black shadow-md border border-blue-200" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                          Monitoramento (Ao Vivo)
                        </button>
                        <button
                          onClick={() => setSubTab("gestao")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === "gestao" ? "bg-blue-600 text-white shadow-md border border-blue-200" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                          Gestão de Escala
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          {subTab === "registradas"
                            ? `${filteredDisponibilidades.length} registros`
                            : subTab === "monitoramento"
                              ? "Visão em tempo real"
                              : "Pendentes de envio"}
                        </span>
                        {(subTab === "registradas" ||
                          subTab === "monitoramento") && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-300"></div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                Casal
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-sky-300"></div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                Individual
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {subTab === "monitoramento" && (
                    <div className="p-6">
                      {(!slotsDisponiveisApp ||
                        slotsDisponiveisApp.length === 0) &&
                      Object.keys(vagas).length === 0 ? (
                        <p className="text-center py-12 text-slate-400 italic">
                          Nenhuma missa configurada ou com registros de
                          disponibilidade.
                        </p>
                      ) : (
                        (() => {
                          const slotsByWeek: any = {};

                          const normalizeString = (s: string) =>
                            s
                              .trim()
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/&/g, " e ")
                              .replace(/\s+/g, " ")
                              .trim();

                          (slotsDisponiveisApp || []).forEach((slot) => {
                            const dateStr = slot.data;
                            if (!dateStr) return;
                            const dateObj = new Date(dateStr + "T00:00:00");
                            const weekStart = startOfWeek(dateObj, {
                              weekStartsOn: 0,
                              locale: ptBR,
                            });
                            const weekKey = format(weekStart, "yyyy-MM-dd");

                            const vKey = `${slot.data}-${slot.horario}-${normalizeString(slot.nome)}`;
                            let data = vagas[vKey];

                            if (!data) {
                              const prefix = `${slot.data}-${slot.horario}-`;
                              const matchingKey = Object.keys(vagas).find((k) =>
                                k.startsWith(prefix),
                              );
                              if (matchingKey) data = vagas[matchingKey];
                            }

                            if (!data)
                              data = {
                                total: 0,
                                casal: 0,
                                individual: 0,
                                ministros: [],
                              };

                            if (!slotsByWeek[weekKey])
                              slotsByWeek[weekKey] = {};
                            if (!slotsByWeek[weekKey][dateStr])
                              slotsByWeek[weekKey][dateStr] = [];
                            slotsByWeek[weekKey][dateStr].push({
                              key: vKey,
                              slot,
                              data,
                            });
                          });

                          Object.entries(vagas)
                            .filter(([key]) => {
                              const dateStr = key
                                .split("-")
                                .slice(0, 3)
                                .join("-");
                              return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
                            })
                            .forEach(([key, data]) => {
                              const dateStr = key
                                .split("-")
                                .slice(0, 3)
                                .join("-");
                              const dateObj = new Date(dateStr + "T00:00:00");
                              const weekStart = startOfWeek(dateObj, {
                                weekStartsOn: 0,
                                locale: ptBR,
                              });
                              const weekKey = format(weekStart, "yyyy-MM-dd");

                              let found = false;
                              if (
                                slotsByWeek[weekKey] &&
                                slotsByWeek[weekKey][dateStr]
                              ) {
                                found = slotsByWeek[weekKey][dateStr].some(
                                  (s: any) => s.key === key,
                                );
                              }
                              if (!found) {
                                if (!slotsByWeek[weekKey])
                                  slotsByWeek[weekKey] = {};
                                if (!slotsByWeek[weekKey][dateStr])
                                  slotsByWeek[weekKey][dateStr] = [];
                                slotsByWeek[weekKey][dateStr].push({
                                  key,
                                  slot: null,
                                  data,
                                });
                              }
                            });

                          return (
                            <div className="space-y-12">
                              {Object.keys(slotsByWeek)
                                .sort()
                                .map((weekKey, weekIdx) => (
                                  <div key={weekKey} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                      <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                                          Semana {weekIdx + 1} •{" "}
                                          {format(
                                            new Date(weekKey + "T00:00:00"),
                                            "d 'de' MMM",
                                            { locale: ptBR },
                                          )}
                                        </span>
                                      </div>
                                      <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>

                                    <div className="space-y-8">
                                      {Object.keys(slotsByWeek[weekKey])
                                        .sort()
                                        .map((dateStr) => (
                                          <div
                                            key={dateStr}
                                            className="space-y-4"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Calendar className="w-4 h-4 text-slate-400" />
                                              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                {format(
                                                  new Date(
                                                    dateStr + "T00:00:00",
                                                  ),
                                                  "EEEE, d 'de' MMMM",
                                                  { locale: ptBR },
                                                )}
                                              </h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                              {slotsByWeek[weekKey][dateStr]
                                                .sort((a: any, b: any) =>
                                                  a.key.localeCompare(b.key),
                                                )
                                                .map(
                                                  ({
                                                    key,
                                                    slot,
                                                    data,
                                                  }: any) => {

                                                    const parts = key.split("-");
                                                    const date = parts.slice(0, 3).join("-");
                                                    const time = parts[3];
                                                    const countVal =
                                                      typeof data === "object"
                                                        ? data.total || 0
                                                        : data;
                                                    const discount = getIncompatibilityDiscountForList(
                                                      data.ministros || [],
                                                      allMinisters,
                                                    );
                                                    const adjustedCountVal = Math.max(0, countVal - discount);
                                                    const numCasais =
                                                      typeof data === "object"
                                                        ? data.casal || 0
                                                        : 0;
                                                    const numIndiv =
                                                      typeof data === "object"
                                                        ? data.individual || 0
                                                        : typeof data ===
                                                            "number"
                                                          ? data
                                                          : 0;
                                                    const customLimit =
                                                      slot && slot.limiteManual
                                                        ? slot.limiteManual
                                                        : 8;
                                                    const isLeitor =
                                                      key.includes("leitor");
                                                    return (
                                                      <div
                                                        key={key}
                                                        className="p-6 bg-white rounded-[2rem] border-4 border-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300"
                                                      >
                                                        <div className="flex justify-between items-start mb-4">
                                                          <div className="text-sm font-black text-slate-800">
                                                            {time}
                                                          </div>
                                                          {isLeitor && (
                                                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                              Leitor
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-end justify-between gap-2 overflow-hidden">
                                                          {(() => {
                                                            const avatarItems = [
                                                              ...Array(numCasais).fill({ type: 'casal' }),
                                                              ...Array(numIndiv).fill({ type: 'individual' }),
                                                            ];
                                                            const maxVisibleAvatars = 5;
                                                            const visibleAvatars = avatarItems.slice(0, maxVisibleAvatars);
                                                            const remainingCount = avatarItems.length - maxVisibleAvatars;

                                                            return (
                                                              <div className="flex -space-x-1.5 items-center flex-wrap max-w-[70%] mr-2">
                                                                {visibleAvatars.map((item, idx) => (
                                                                  item.type === 'casal' ? (
                                                                    <div
                                                                      key={`c-${idx}`}
                                                                      className="w-7 h-7 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-inner shrink-0"
                                                                      title="Casal"
                                                                    >
                                                                      <Users className="w-3.5 h-3.5 text-white" />
                                                                    </div>
                                                                  ) : (
                                                                    <div
                                                                      key={`i-${idx}`}
                                                                      className="w-7 h-7 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-inner shrink-0"
                                                                      title="Individual"
                                                                    >
                                                                      <User className="w-3.5 h-3.5 text-white" />
                                                                    </div>
                                                                  )
                                                                ))}
                                                                {remainingCount > 0 && (
                                                                  <div 
                                                                    className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-inner shrink-0 z-10 text-[10px] font-black text-slate-500"
                                                                    title={`${remainingCount} mais`}
                                                                  >
                                                                    +{remainingCount}
                                                                  </div>
                                                                )}
                                                                {adjustedCountVal === 0 && (
                                                                  <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-slate-200 border-dashed flex items-center justify-center shrink-0">
                                                                    <span className="text-[10px] font-bold text-slate-300">0</span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                          })()}
                                                          <span className="text-2xl font-black text-slate-900 leading-none flex items-baseline shrink-0 whitespace-nowrap">
                                                            {adjustedCountVal}
                                                            <span className="text-[10px] text-slate-400 font-bold ml-0.5 uppercase tracking-widest whitespace-nowrap">
                                                              /{customLimit}
                                                            </span>
                                                          </span>
                                                        </div>

                                                        {data.ministros &&
                                                          data.ministros
                                                            .length > 0 && (
                                                            <div className="mt-3 py-2 border-t border-slate-100 space-y-1.5 max-h-24 overflow-y-auto pr-1 thin-scrollbar">
                                                              {data.ministros.map(
                                                                (
                                                                  m: any,
                                                                  idx: number,
                                                                ) => (
                                                                  <div
                                                                    key={idx}
                                                                    className="flex items-center gap-2"
                                                                  >
                                                                    <div
                                                                      className={`w-1.5 h-1.5 rounded-full ${m.tipo === "casal" ? "bg-rose-400" : "bg-sky-400"}`}
                                                                    ></div>
                                                                    <span className="text-[10px] font-bold text-slate-700 truncate capitalize">
                                                                      {m.nome.toLowerCase()}
                                                                    </span>
                                                                  </div>
                                                                ),
                                                              )}
                                                            </div>
                                                          )}

                                                        <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                          <div
                                                            className={`h-full transition-all duration-1000 ${adjustedCountVal >= customLimit ? "bg-emerald-500" : "bg-blue-500"}`}
                                                            style={{
                                                              width: `${Math.min((adjustedCountVal / customLimit) * 100, 100)}%`,
                                                            }}
                                                          ></div>
                                                        </div>
                                                      </div>
                                                    );
                                                  },
                                                )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {subTab === "registradas" && (
                    <>
                      {/* Alphabet Filter Bar */}
                      <div className="bg-slate-50/50 border-b border-slate-100 p-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1 min-w-max px-2">
                          <button
                            onClick={() => setSelectedLetter(null)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                              selectedLetter === null
                                ? "bg-blue-100 text-black shadow-md border border-blue-200"
                                : "text-slate-400 hover:bg-white hover:text-slate-600"
                            }`}
                          >
                            TODOS
                          </button>
                          <div className="w-px h-4 bg-slate-200 mx-1" />
                          {alphabet.map((letter) => {
                            const hasItems = filteredDisponibilidades.some(
                              (d) => {
                                const n1 = d.nomeExibicao || d.nome;
                                const n2 =
                                  d.nomeExibicaoConjuge || d.nomeConjuge;
                                return (
                                  n1.toUpperCase().startsWith(letter) ||
                                  (n2 && n2.toUpperCase().startsWith(letter))
                                );
                              },
                            );
                            return (
                              <button
                                key={letter}
                                onClick={() => setSelectedLetter(letter)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${
                                  selectedLetter === letter
                                    ? "bg-blue-100 text-black shadow-md border border-blue-200"
                                    : hasItems
                                      ? "text-slate-600 hover:bg-white hover:text-blue-600"
                                      : "text-slate-300 cursor-not-allowed"
                                }`}
                                disabled={
                                  !hasItems && selectedLetter !== letter
                                }
                              >
                                {letter}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-6">
                        {filteredDisponibilidades.length === 0 ? (
                          <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400">
                              Nenhuma disponibilidade registrada ainda para o
                              período selecionado.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDisponibilidades
                              .filter((d) => {
                                if (!selectedLetter) return true;
                                const n1 = d?.nomeExibicao || d?.nome || "";
                                const n2 =
                                  d?.nomeExibicaoConjuge ||
                                  d?.nomeConjuge ||
                                  "";
                                return (
                                  n1.toUpperCase().startsWith(selectedLetter) ||
                                  (n2 &&
                                    n2.toUpperCase().startsWith(selectedLetter))
                                );
                              })
                              .sort((a, b) => {
                                const n1a = a?.nomeExibicao || a?.nome || "";
                                const n1b = b?.nomeExibicao || b?.nome || "";
                                return n1a.localeCompare(n1b);
                              })
                              .map((d, i) => {
                                const n1 =
                                  d?.nomeExibicao || d?.nome || "Sem nome";
                                const n2 =
                                  d?.nomeExibicaoConjuge ||
                                  d?.nomeConjuge ||
                                  "";

                                // Filter slots for the selected month
                                const slotsInMonth = (d?.disponibilidade || [])
                                  .filter((slot: any) => {
                                    if (!slot?.data) return false;
                                    const parts = slot.data.split("-");
                                    if (parts.length < 3) return false;
                                    const [y, m, d_day] = parts.map(Number);
                                    return (
                                      m === Number(mesSelecionado) &&
                                      y === Number(anoSelecionado)
                                    );
                                  })
                                  .sort((a: any, b: any) => {
                                    if (!a?.data || !b?.data) return 0;
                                    return (
                                      new Date(a.data + "T00:00:00").getTime() -
                                      new Date(b.data + "T00:00:00").getTime()
                                    );
                                  });

                                return (
                                  <div
                                    key={i}
                                    className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-white hover:shadow-md transition-all group"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-blue-200 flex items-center justify-center text-blue-600 font-black text-sm shadow-sm transition-all">
                                          {(n1.charAt(0) || "?").toUpperCase()}
                                        </div>
                                        <div>
                                          <h3 className="font-bold text-slate-900 leading-tight">
                                            {n1} {n2 ? `e ${n2}` : ""}
                                          </h3>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {d?.telefone || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                                        {slotsInMonth.length} Missas
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 items-end justify-between">
                                      <div className="flex flex-wrap gap-1.5">
                                        {slotsInMonth.map((slot, idx) => {
                                          const isCasal =
                                            slot.modo === "casal" ||
                                            (!slot.modo && d?.tipo === "casal");
                                          return (
                                            <span
                                              key={idx}
                                              className={`text-[10px] font-bold border px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm ${
                                                isCasal
                                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                                  : "bg-sky-50 text-sky-700 border-sky-200"
                                              }`}
                                              title={
                                                isCasal
                                                  ? "Disponibilidade como Casal"
                                                  : "Disponibilidade Individual"
                                              }
                                            >
                                              {isCasal ? (
                                                <Users className="w-2.5 h-2.5 opacity-70" />
                                              ) : (
                                                <User className="w-2.5 h-2.5 opacity-70" />
                                              )}
                                              {slot.data
                                                ? new Date(
                                                    slot.data + "T00:00:00",
                                                  ).toLocaleDateString(
                                                    "pt-BR",
                                                    {
                                                      day: "2-digit",
                                                      month: "2-digit",
                                                    },
                                                  )
                                                : "??/??"}{" "}
                                              • {slot.horario}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {subTab === "faltantes" && (
                    <div className="p-6">
                      {(() => {
                        const normalize = (s: any) => {
                          if (typeof s !== "string") return "";
                          let n = s
                            .trim()
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/&/g, " e ")
                            .replace(/\s+/g, " ")
                            .trim();
                          // Remove 'paroquia' prefix if present to standardize parish names
                          if (n.startsWith("paroquia ")) {
                            n = n.substring(9).trim();
                          }
                          if (n.includes(" e ")) {
                            n = n
                              .split(" e ")
                              .map((x) => x.trim())
                              .sort()
                              .join(" e ");
                          }
                          return n;
                        };
                        const userParoquia = normalize(user?.paroquia || "");
                        const parishMinisters = allMinisters.filter((m) => {
                          const mParoquia = normalize(m?.paroquia || "");
                          return (
                            mParoquia === userParoquia &&
                            Number.isInteger(Number(m?.id))
                          );
                        });

                        // Use the selected month/year from the coordinator's view
                        let targetMonth = Number(mesSelecionado);
                        let targetYear = Number(anoSelecionado);

                        // If no month is selected yet, default to next month
                        if (!targetMonth) {
                          const nextMonthDate = new Date();
                          nextMonthDate.setDate(1); // Evita bug de final de mês
                          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                          targetMonth = nextMonthDate.getMonth() + 1;
                          targetYear = nextMonthDate.getFullYear();
                        }

                        let isGapPeriod = false;

                        if (targetMonth > 12) {
                          targetMonth -= 12;
                          targetYear++;
                        }

                        const targetMonthName = monthNames[targetMonth - 1];

                        if (isGapPeriod) {
                          return (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8" />
                              </div>
                              <h4 className="font-bold text-slate-900">
                                Período de Transição
                              </h4>
                              <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                                O período de envio para {targetMonthName}/
                                {targetYear} foi encerrado no dia 15.
                                <br />A partir do dia 20, iniciaremos o
                                recebimento das disponibilidades para o próximo
                                mês.
                              </p>
                            </div>
                          );
                        }

                        const submittedStatus = new Map<
                          string,
                          { him: boolean; her: boolean }
                        >();
                        const submittedNames = new Set<string>();

                        disponibilidades.forEach((d: any) => {
                          const targetSlots = d.disponibilidade.filter(
                            (slot: any) => {
                              if (!slot.data) return false;
                              const [y, m, d_day] = slot.data
                                .split("-")
                                .map(Number);
                              return m === targetMonth && y === targetYear;
                            },
                          );

                          if (targetSlots.length > 0) {
                            let him = false;
                            let her = false;

                            targetSlots.forEach((slot: any) => {
                              if (slot.modo === "ele") him = true;
                              else if (slot.modo === "ela") her = true;
                              else {
                                // 'casal' or undefined (legacy)
                                him = true;
                                her = true;
                              }
                            });

                            if (
                              d.ministro_id !== undefined &&
                              d.ministro_id !== null
                            ) {
                              const id = String(d.ministro_id);
                              const current = submittedStatus.get(id) || {
                                him: false,
                                her: false,
                              };
                              submittedStatus.set(id, {
                                him: current.him || him,
                                her: current.her || her,
                              });
                            }

                            const n1 = normalize(d.nome);
                            const n2 = normalize(d.nomeConjuge);
                            const n1Display = d.nomeExibicao
                              ? normalize(d.nomeExibicao)
                              : null;
                            const n2Display = d.nomeExibicaoConjuge
                              ? normalize(d.nomeExibicaoConjuge)
                              : null;

                            // Add names to the set of submitted names
                            if (him) {
                              if (n1) submittedNames.add(n1);
                              if (n1Display) submittedNames.add(n1Display);
                            }
                            if (her) {
                              if (n2) submittedNames.add(n2);
                              if (n2Display) submittedNames.add(n2Display);
                            }
                          }
                        });

                        // Helper to check if a specific name is scheduled in the target month
                        const isScheduled = (normalizedUserName: string) => {
                          if (!escala || !normalizedUserName) return false;
                          // Iterate over dates in target month
                          for (const [dateStr, missas] of Object.entries(
                            escala,
                          )) {
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
                            const date = new Date(dateStr + "T00:00:00");
                            // Check if date is in target month/year
                            if (
                              date.getMonth() + 1 === targetMonth &&
                              date.getFullYear() === targetYear
                            ) {
                              for (const [time, missa] of Object.entries(
                                missas as any,
                              )) {
                                const ministros =
                                  (missa as any).ministros || [];
                                for (const m of ministros) {
                                  const normalizedScheduleName = normalize(m);

                                  // 1. Exact match
                                  if (
                                    normalizedScheduleName ===
                                    normalizedUserName
                                  )
                                    return true;

                                  // 2. Schedule uses a short name (prefix) of the user (e.g. Schedule "Alan", User "Alan Ciocca")
                                  if (
                                    normalizedUserName.startsWith(
                                      normalizedScheduleName + " ",
                                    )
                                  )
                                    return true;
                                  if (
                                    normalizedScheduleName.startsWith(
                                      normalizedUserName + " ",
                                    )
                                  )
                                    return true;

                                  // 3. Handle "Name1 e Name2" in schedule line
                                  const partsOfScheduleName =
                                    normalizedScheduleName
                                      .split(" e ")
                                      .map((p) => p.trim())
                                      .filter(Boolean);

                                  for (const part of partsOfScheduleName) {
                                    if (part === normalizedUserName)
                                      return true;
                                    if (
                                      normalizedUserName.startsWith(part + " ")
                                    )
                                      return true;
                                    if (
                                      part.startsWith(normalizedUserName + " ")
                                    )
                                      return true;
                                  }

                                  const userFirst =
                                    normalizedUserName.split(" ")[0];
                                  const schedFirst =
                                    normalizedScheduleName.split(" ")[0];
                                  if (
                                    userFirst.length >= 4 &&
                                    schedFirst.length >= 4
                                  ) {
                                    if (
                                      userFirst.startsWith(schedFirst) ||
                                      schedFirst.startsWith(userFirst)
                                    ) {
                                      const userRest = normalizedUserName
                                        .substring(userFirst.length)
                                        .trim();
                                      const schedRest = normalizedScheduleName
                                        .substring(schedFirst.length)
                                        .trim();
                                      if (
                                        !userRest ||
                                        !schedRest ||
                                        userRest === schedRest
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                          return false;
                        };

                        const missingMinisters = parishMinisters.filter((m) => {
                          const id = String(m.id);
                          const n1 = normalize(m.nome);
                          const n1Display = m.nomeExibicao
                            ? normalize(m.nomeExibicao)
                            : null;

                          let status = submittedStatus.get(id);

                          // Check scheduling status
                          const n1Scheduled =
                            (n1 && isScheduled(n1)) ||
                            (n1Display && isScheduled(n1Display));
                          const n1Submitted =
                            status?.him ||
                            (n1 && submittedNames.has(n1)) ||
                            (n1Display && submittedNames.has(n1Display));
                          const himDone =
                            n1Submitted || n1Scheduled || m.afastado;

                          let herDone = false;
                          if (m.tipo === "casal" && m.nomeConjuge) {
                            const n2 = normalize(m.nomeConjuge);
                            const n2Display = m.nomeExibicaoConjuge
                              ? normalize(m.nomeExibicaoConjuge)
                              : null;
                            const n2Scheduled =
                              (n2 && isScheduled(n2)) ||
                              (n2Display && isScheduled(n2Display));
                            const n2Submitted =
                              status?.her ||
                              (n2 && submittedNames.has(n2)) ||
                              (n2Display && submittedNames.has(n2Display));
                            herDone =
                              n2Submitted || n2Scheduled || m.afastadoConjuge;
                          }

                          // If it's a couple
                          if (m.tipo === "casal" && m.nomeConjuge) {
                            // If BOTH are done (submitted or scheduled), remove from list
                            if (himDone && herDone) return false;
                            // If one is away but the other is missing, keep in list
                            // If both are away, we want to show them too
                            return true;
                          }

                          // Single
                          if (himDone) return false;
                          return true;
                        });

                        const awayMinistersCount = parishMinisters.reduce(
                          (acc, m) => {
                            let count = 0;
                            if (m.afastado) count++;
                            if (
                              m.tipo === "casal" &&
                              m.nomeConjuge &&
                              m.afastadoConjuge
                            )
                              count++;
                            return acc + count;
                          },
                          0,
                        );

                        // Helper to format missing names
                        const formatMissingName = (m: any) => {
                          const id = String(m.id);
                          const n1 = normalize(m.nome);
                          const n1Display = m.nomeExibicao
                            ? normalize(m.nomeExibicao)
                            : null;

                          let status = submittedStatus.get(id);
                          const dispNome = m.nomeExibicao || m.nome;
                          const dispNomeConjuge =
                            m.nomeExibicaoConjuge || m.nomeConjuge;

                          // Check scheduling and submission
                          const n1Scheduled =
                            (n1 && isScheduled(n1)) ||
                            (n1Display && isScheduled(n1Display));
                          const n1Submitted =
                            status?.him ||
                            (n1 && submittedNames.has(n1)) ||
                            (n1Display && submittedNames.has(n1Display));
                          const himDone =
                            n1Submitted || n1Scheduled || m.afastado;

                          let herDone = false;
                          if (m.tipo === "casal" && m.nomeConjuge) {
                            const n2 = normalize(m.nomeConjuge);
                            const n2Display = m.nomeExibicaoConjuge
                              ? normalize(m.nomeExibicaoConjuge)
                              : null;
                            const n2Scheduled =
                              (n2 && isScheduled(n2)) ||
                              (n2Display && isScheduled(n2Display));
                            const n2Submitted =
                              status?.her ||
                              (n2 && submittedNames.has(n2)) ||
                              (n2Display && submittedNames.has(n2Display));
                            herDone =
                              n2Submitted || n2Scheduled || m.afastadoConjuge;
                          }

                          if (m.tipo === "casal" && m.nomeConjuge) {
                            if (!himDone && !herDone)
                              return `${dispNome} e ${dispNomeConjuge}`;
                            if (!himDone) return dispNome;
                            if (!herDone) return dispNomeConjuge;
                          }
                          return dispNome;
                        };

                        const displayList = missingMinisters
                          .map((m) => {
                            const name = formatMissingName(m);
                            // Determine if this entry is fully "Afastado"
                            const isAfastado =
                              m.tipo === "casal"
                                ? m.afastado && m.afastadoConjuge
                                : m.afastado;

                            // For couples, it might be partially away
                            const partialAway =
                              m.tipo === "casal" &&
                              (m.afastado || m.afastadoConjuge) &&
                              !(m.afastado && m.afastadoConjuge);

                            return {
                              id: m.id,
                              name,
                              phone: m.telefone,
                              isAfastado,
                              partialAway,
                            };
                          })
                          .filter(
                            (item) => !item.isAfastado && !item.partialAway,
                          );

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Pending Card */}
                              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                  <AlertTriangle className="w-7 h-7" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-blue-900 text-lg">
                                    Ministros Pendentes ({displayList.length})
                                  </h3>
                                  <p className="text-sm text-blue-700 leading-relaxed">
                                    Estes ministros ainda não enviaram a
                                    disponibilidade para{" "}
                                    <strong>
                                      {targetMonthName}/{targetYear}
                                    </strong>
                                    .
                                  </p>
                                </div>
                              </div>

                              {/* Away Card */}
                              {awayMinistersCount > 0 && (
                                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 flex items-center gap-4 shadow-sm">
                                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <UserMinus className="w-7 h-7" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-bold text-amber-900 text-lg">
                                      Ministros Afastados ({awayMinistersCount})
                                    </h3>
                                    <p className="text-sm text-amber-700 leading-relaxed mb-2">
                                      Ministros que estão temporariamente
                                      afastados das escalas.
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {parishMinisters
                                        .filter(
                                          (m) =>
                                            m.afastado || m.afastadoConjuge,
                                        )
                                        .flatMap((m) => {
                                          const names = [];
                                          if (m.afastado)
                                            names.push(
                                              m.nomeExibicao || m.nome,
                                            );
                                          if (
                                            m.tipo === "casal" &&
                                            m.nomeConjuge &&
                                            m.afastadoConjuge
                                          )
                                            names.push(
                                              m.nomeExibicaoConjuge ||
                                                m.nomeConjuge,
                                            );
                                          return names;
                                        })
                                        .map((name, idx) => (
                                          <span
                                            key={idx}
                                            className="bg-amber-200/50 text-amber-800 text-[10px] px-2.5 py-1 rounded-full border border-amber-300 font-bold flex items-center gap-1.5"
                                          >
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                            {name}
                                          </span>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {displayList.length === 0 ? (
                              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Check className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-900">
                                  Tudo em dia!
                                </h4>
                                <p className="text-slate-500 text-sm">
                                  Todos os ministros da paróquia enviaram suas
                                  disponibilidades para {targetMonthName}/
                                  {targetYear}.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayList
                                  .sort((a, b) => {
                                    // Sort by status (Pending first, then Away) then by name
                                    if (a.isAfastado !== b.isAfastado)
                                      return a.isAfastado ? 1 : -1;
                                    if (a.partialAway !== b.partialAway)
                                      return a.partialAway ? 1 : -1;
                                    return a.name.localeCompare(b.name);
                                  })
                                  .map((item) => (
                                    <div
                                      key={item.id}
                                      className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm hover:shadow-md transition-all ${item.isAfastado || item.partialAway ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-slate-200"}`}
                                    >
                                      <div>
                                        <p
                                          className={`font-bold text-sm ${item.isAfastado || item.partialAway ? "text-slate-500" : "text-slate-800"}`}
                                        >
                                          {item.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                          {item.phone}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <span
                                          className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${
                                            item.isAfastado || item.partialAway
                                              ? "text-blue-600 bg-blue-50 border-blue-100"
                                              : "text-blue-600 bg-blue-50 border-blue-100"
                                          }`}
                                        >
                                          {!item.isAfastado &&
                                            !item.partialAway &&
                                            "Não Enviou"}
                                        </span>
                                        {!item.isAfastado &&
                                          !item.partialAway && (
                                            <a
                                              href={`https://wa.me/55${item.phone?.replace(/\D/g, "")}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[9px] font-bold text-blue-600 hover:underline"
                                            >
                                              Cobrar via WhatsApp
                                            </a>
                                          )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {subTab === "gestao" && (
                    <>
                      <div className="p-6 space-y-8">
                        {/* Agendamento Mensal de Disponibilidade */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900">
                              Agendamento Mensal de Disponibilidade
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  Abertura Automática
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                      Dia do Mês
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="31"
                                      value={diaAbertura}
                                      onChange={(e) =>
                                        setDiaAbertura(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                        )
                                      }
                                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                      placeholder="Ex: 20"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                      Horário
                                    </label>
                                    <input
                                      type="time"
                                      value={horaAbertura}
                                      onChange={(e) =>
                                        setHoraAbertura(e.target.value)
                                      }
                                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                  Fechamento Automático
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                      Dia do Mês
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="31"
                                      value={diaFechamento}
                                      onChange={(e) =>
                                        setDiaFechamento(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                        )
                                      }
                                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                      placeholder="Ex: 5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                      Horário
                                    </label>
                                    <input
                                      type="time"
                                      value={horaFechamento}
                                      onChange={(e) =>
                                        setHoraFechamento(e.target.value)
                                      }
                                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 mt-8 pt-6">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Limite de Escalação Mensal por Ministro
                              </h4>
                              <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                                Escolha quantas vezes cada ministro ou casal de ministros pode ser escalado no mês durante a geração automática da escala.
                              </p>
                              <div className="flex flex-wrap gap-2 animate-fade-in">
                                {["libre", 1, 2, 3, 4, 5, 6].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setMaxEscalacoes(opt as any)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                                      maxEscalacoes === opt
                                        ? "bg-slate-900 text-white border-transparent shadow-sm scale-[1.02]"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {opt === "libre" ? "Liberado (Livre)" : `${opt} ${opt === 1 ? "vez" : "vezes"}`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={handleResetAgendamento}
                                className="px-6 py-2.5 text-slate-500 hover:bg-slate-50 font-bold text-sm rounded-xl transition-colors border border-transparent hover:border-slate-200"
                              >
                                Restaurar Padrão
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveAgendamento}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Salvar Agendamento
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Gestão Rapida Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button
                            onClick={handleToggleDisponibilidade}
                            className={`${disponibilidadeAberta ? "bg-blue-100 hover:bg-blue-200 text-blue-700" : "bg-blue-50 hover:bg-blue-100 text-slate-900 shadow-sm border border-blue-200"} p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all group`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${disponibilidadeAberta ? "bg-blue-200/50" : "bg-blue-100 text-blue-600"}`}
                            >
                              <Unlock className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-bold text-sm tracking-tight">
                                {disponibilidadeAberta
                                  ? "Fechar Disponibilidade"
                                  : "Abrir Disponibilidade"}
                              </h4>
                              <p
                                className={`text-[9px] font-bold uppercase ${disponibilidadeAberta ? "text-blue-600/70" : "text-slate-400"}`}
                              >
                                {manualOverride !== undefined
                                  ? "Modo Manual"
                                  : "Automático"}
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={handleGerarEscala}
                            className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-3xl shadow-lg shadow-slate-100 flex flex-col items-center justify-center gap-3 transition-all group"
                          >
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Zap className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-bold text-sm tracking-tight">
                                Gerar Escala
                              </h4>
                              <p className="text-[9px] text-white/50 font-bold uppercase">
                                Cálculo Inteligente
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={handleAbrirConferencia}
                            className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group"
                          >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-bold text-sm tracking-tight text-blue-700">
                                Visualizar Escala (conferência)
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                Painel de Conferência
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={handleDownloadPDF}
                            className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group"
                          >
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Download className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-bold text-sm tracking-tight">
                                Baixar PDF
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                Exportar
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => setShowPanoramaModal(true)}
                            className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group"
                          >
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Eye className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-bold text-sm tracking-tight">
                                Panorama
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                Visão Geral
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {activeTab === "escala" && (
                <>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab("relatorios")}
                          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                          title="Voltar para Relatórios"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-slate-900">
                          Gerenciamento de Escala
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const filtered = selectedEscalaMonth
                              ? Object.keys(escala || {}).reduce(
                                  (acc: any, k: string) => {
                                    if (
                                      k.startsWith(selectedEscalaMonth) ||
                                      !/^\d{4}-\d{2}-\d{2}$/.test(k)
                                    )
                                      acc[k] = (escala || {})[k];
                                    return acc;
                                  },
                                  {},
                                )
                              : escala;
                            generateEscalaListPDF(filtered, user);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black shadow-lg shadow-red-100 flex items-center gap-2 hover:bg-red-700 transition-all font-mono"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>LISTA</span>
                        </button>
                        <button
                          onClick={() => {
                            const filtered = selectedEscalaMonth
                              ? Object.keys(escala || {}).reduce(
                                  (acc: any, k: string) => {
                                    if (
                                      k.startsWith(selectedEscalaMonth) ||
                                      !/^\d{4}-\d{2}-\d{2}$/.test(k)
                                    )
                                      acc[k] = (escala || {})[k];
                                    return acc;
                                  },
                                  {},
                                )
                              : escala;
                            generateEscalaPDF(filtered, user);
                          }}
                          className="px-3 py-2 bg-slate-800 text-white rounded-xl text-[9px] font-black shadow-lg shadow-slate-100 flex items-center gap-2 hover:bg-slate-900 transition-all font-mono"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>TABELA</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {Object.keys(escala || {}).filter((k) =>
                        /^\d{4}-\d{2}-\d{2}$/.test(k),
                      ).length === 0 ? (
                        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-medium">
                            Nenhuma escala gerada para este período.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {escalaMonths.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                              {escalaMonths.map((month) => (
                                <button
                                  key={month}
                                  onClick={() => setSelectedEscalaMonth(month)}
                                  className={`px-6 py-3 rounded-xl font-bold text-sm capitalize whitespace-nowrap transition-all ${
                                    selectedEscalaMonth === month
                                      ? "bg-liturgy-600 text-black shadow-md"
                                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {format(
                                    new Date(month + "-01T00:00:00"),
                                    "MMMM yyyy",
                                    { locale: ptBR },
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedEscalaMonth && (
                            <div className="space-y-8">
                              {Object.entries(escala)
                                .filter(
                                  ([date]) =>
                                    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                                    date.startsWith(selectedEscalaMonth),
                                )
                                .sort()
                                .map(([date, missas]: [string, any]) => (
                                  <div key={date} className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        {format(
                                          new Date(date + "T00:00:00"),
                                          "EEEE, d 'de' MMMM",
                                          { locale: ptBR },
                                        )}
                                      </h4>
                                      <div className="h-px bg-slate-100 w-full" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {Object.entries(missas || {})
                                        .sort((a, b) =>
                                          a[0].localeCompare(b[0]),
                                        )
                                        .map(
                                          ([horario, missa]: [string, any]) => {
                                            const isDomingo =
                                              format(
                                                new Date(date + "T00:00:00"),
                                                "EEEE",
                                                { locale: ptBR },
                                              ).toLowerCase() === "domingo";
                                            return (
                                              <div
                                                key={horario}
                                                className={`p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all ${isDomingo ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}
                                              >
                                                <div className="flex justify-between items-center mb-3">
                                                  <span
                                                    className={`text-sm font-black ${isDomingo ? "text-red-600" : "text-liturgy-600"}`}
                                                  >
                                                    {horario}
                                                  </span>
                                                  <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isDomingo ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400"}`}
                                                  >
                                                    {missa.nome || "Missa"}
                                                  </span>
                                                </div>
                                                <div className="space-y-2">
                                                  {(Array.isArray(missa)
                                                    ? missa
                                                    : missa?.ministros || []
                                                  ).map((m, idx) => {
                                                    const ministerName =
                                                      typeof m === "string"
                                                        ? m
                                                        : m?.nome || "";
                                                    const normalizedM =
                                                      normalize(ministerName);
                                                    const isMe =
                                                      allUserNames.some(
                                                        (userName) => {
                                                          if (
                                                            normalizedM ===
                                                            userName
                                                          )
                                                            return true;

                                                          // Split schedule into parts (for couples like "Osvaldo e Maria")
                                                          const mParts =
                                                            normalizedM
                                                              .split(" e ")
                                                              .map((p) =>
                                                                p.trim(),
                                                              )
                                                              .filter(Boolean);

                                                          // If any part of the schedule matches any of the user's names exactly
                                                          return mParts.some(
                                                            (mp) =>
                                                              allUserNames.includes(
                                                                mp,
                                                              ),
                                                          );
                                                        },
                                                      );

                                                    return (
                                                      <div
                                                        key={idx}
                                                        className={`text-xs font-bold flex items-center gap-2 ${isMe ? "text-liturgy-700 bg-liturgy-50 px-2 py-1 rounded-lg -ml-2 border border-liturgy-100" : isDomingo ? "text-red-800" : "text-slate-700"}`}
                                                      >
                                                        <div
                                                          className={`w-1.5 h-1.5 rounded-full ${isMe ? "bg-liturgy-600 animate-pulse" : isDomingo ? "bg-red-400" : "bg-liturgy-400"}`}
                                                        ></div>
                                                        {ministerName}
                                                        {isMe && (
                                                          <Check className="w-3 h-3 ml-auto text-liturgy-600" />
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {activeTab === "trocas" && (
                <div className="space-y-6">
                  {/* Swap Header Banner */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-blue-600" />
                        Troca de Missas
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Gerencie solicitações de trocas de celebrações e acompanhe confirmações.
                      </p>
                    </div>
                    {!isCoordenador && (
                      <button
                        onClick={() => {
                          setTrocaMissaOrigem(null);
                          setTrocaMissaDestino(null);
                          setTrocaDestinatario(null);
                          setTrocaTipo('direta');
                          setShowSolicitarTrocaModal(true);
                        }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
                      >
                        <Plus className="w-4 h-4" />
                        NOVA SOLICITAÇÃO
                      </button>
                    )}
                  </div>

                  {/* Pending actions for user / Alerts */}
                  {(() => {
                    // Find swaps requiring action from logged in minister or coord
                    const pendingMyAction = trocas.filter((t: any) => {
                      if (isCoordenador) {
                        return t.status === 'pendente_coordenacao';
                      } else {
                        // For minister:
                        // 1. Unaccepted requests directed to them
                        const unaccepted = t.destinatarioId === user.id && t.status === 'pendente_destinatario';
                        // 2. Completed requests they haven't dismissed yet
                        const solUnread = t.solicitanteId === user.id && t.confirmadoSolicitante !== true && 
                          (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao' || t.status === 'rejeitado_destinatario');
                        const destUnread = t.destinatarioId === user.id && t.confirmadoDestinatario !== true && 
                          (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao');

                        return unaccepted || solUnread || destUnread;
                      }
                    });

                    if (pendingMyAction.length === 0) return null;

                    return (
                      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 space-y-4">
                        <h3 className="font-bold text-amber-950 flex items-center gap-2 text-sm uppercase tracking-wider">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          Ações Pendentes ({pendingMyAction.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingMyAction.map((t: any) => {
                            const isSolicitant = t.solicitanteId === user.id;
                            const isDest = t.destinatarioId === user.id;
                            const oData = t.missaOrigemData ? t.missaOrigemData.split('-').reverse().join('/') : '';

                            return (
                              <div key={t.id} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between gap-4">
                                <div>
                                  {/* Coordinators pending view */}
                                  {isCoordenador && t.status === 'pendente_coordenacao' && (
                                    <div>
                                      <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1 font-mono">APROVAÇÃO DA COORDENAÇÃO</p>
                                      <p className="text-sm text-slate-800">
                                        <strong>{getSwapSolicitanteDisplay(t)}</strong> solicita troca para o dia <strong>{oData} às {t.missaOrigemHorario}</strong>.
                                      </p>
                                      <p className="text-xs text-slate-500 mt-2">
                                        Substituto: <strong>{getSwapDestinatarioDisplay(t)}</strong>{t.segundoDestinatarioNome ? ` e ${t.segundoDestinatarioNome}` : ''} {t.tipo === 'direta' ? `(Troca direta pela missa de ${t.missaDestinoData ? t.missaDestinoData.split('-').reverse().join('/') : ''} às ${t.missaDestinoHorario})` : '(Substituição direta)'}.
                                      </p>
                                    </div>
                                  )}

                                  {/* Target Minister pending view */}
                                  {!isCoordenador && isDest && t.status === 'pendente_destinatario' && (
                                    <div>
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 font-mono">PEDIDO DE TROCA RECEBIDO</p>
                                      <p className="text-sm text-slate-800">
                                        <strong>{getSwapSolicitanteDisplay(t)}</strong> quer trocar com você a missa dele do dia <strong>{oData} às {t.missaOrigemHorario}</strong>.
                                      </p>
                                      {t.tipo === 'direta' ? (
                                        <p className="text-xs text-slate-500 mt-2">
                                          Em troca, ele propõe assumir a sua celebração de <strong>{t.missaDestinoData ? t.missaDestinoData.split('-').reverse().join('/') : ''} às {t.missaDestinoHorario}</strong>.
                                        </p>
                                      ) : (
                                        <p className="text-xs text-slate-500 mt-2">
                                          Ele solicita que você atue como padrinho substituto para esta data.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Confirm outcome for solicitor */}
                                  {!isCoordenador && isSolicitant && (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao' || t.status === 'rejeitado_destinatario') && (
                                    <div>
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">RESPOSTA DO SEU PEDIDO</p>
                                      <p className="text-sm text-slate-800">
                                        Seu pedido para o dia <strong>{oData} às {t.missaOrigemHorario}</strong> foi:
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        {t.status === 'aprovado' ? (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                            <Check className="w-3.5 h-3.5" /> Aprovado pela Coordenação! (Escala Atualizada)
                                          </span>
                                        ) : t.status === 'rejeitado_coordenacao' ? (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                            <X className="w-3.5 h-3.5" /> Recusado pela Coordenação.
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                            <X className="w-3.5 h-3.5" /> Recusado pelo ministro convidado.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Confirm outcome for target minister */}
                                  {!isCoordenador && isDest && (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao') && (
                                    <div>
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 font-mono">AVISO DE TROCA CONCLUÍDO</p>
                                      <p className="text-sm text-slate-800">
                                        O pedido de troca entre você e <strong>{getSwapSolicitanteDisplay(t)}</strong> foi:
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        {t.status === 'aprovado' ? (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                            <Check className="w-3.5 h-3.5" /> Aprovado pela Coordenação! (Você assumiu a missa)
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                            <X className="w-3.5 h-3.5" /> Recusado pela Coordenação.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 justify-end pt-2 border-t border-slate-50">
                                  {/* Coord actions */}
                                  {isCoordenador && t.status === 'pendente_coordenacao' && (
                                    <>
                                      <button
                                        onClick={() => handleResponderCoordenador(t.id, 'rejeitar')}
                                        className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                                      >
                                        Recusar
                                      </button>
                                      <button
                                        onClick={() => handleResponderCoordenador(t.id, 'aprovar')}
                                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Aprovar e Atualizar
                                      </button>
                                    </>
                                  )}

                                  {/* Dest minister actions */}
                                  {!isCoordenador && isDest && t.status === 'pendente_destinatario' && (
                                    <>
                                      <button
                                        onClick={() => handleResponderMinistro(t.id, 'rejeitar')}
                                        className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                                      >
                                        Rejeitar
                                      </button>
                                      <button
                                        onClick={() => handleResponderMinistro(t.id, 'aceitar')}
                                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Aceitar Troca
                                      </button>
                                    </>
                                  )}

                                  {/* Acknowledge outcomes (Amém / Entendido) */}
                                  {!isCoordenador && (
                                    ((isSolicitant && t.confirmadoSolicitante !== true && (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao' || t.status === 'rejeitado_destinatario')) ||
                                     (isDest && t.confirmadoDestinatario !== true && (t.status === 'aprovado' || t.status === 'rejeitado_coordenacao'))) && (
                                      <button
                                        onClick={() => handleConfirmarLeitura(t.id)}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider"
                                      >
                                        Amém / Entendido
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Swaps History and List */}
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Navigation bar with sub tabs */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTrocaTabFiltro('pendentes')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${trocaTabFiltro === 'pendentes' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          Ativos
                        </button>
                        <button
                          onClick={() => setTrocaTabFiltro('historico')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${trocaTabFiltro === 'historico' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          Histórico Geral
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        {user?.paroquia ? user.paroquia.replace('paroquia ', '').toUpperCase() : ""}
                      </span>
                    </div>

                    <div className="p-6">
                      {(() => {
                        // Filter swaps to display
                        const displayedSwaps = trocas.filter((t: any) => {
                          if (trocaTabFiltro === 'pendentes') {
                            return t.status === 'pendente_destinatario' || t.status === 'pendente_coordenacao';
                          } else {
                            // Historico shows finished states
                            return t.status === 'aprovado' || t.status === 'rejeitado_coordenacao' || t.status === 'rejeitado_destinatario';
                          }
                        });

                        if (displayedSwaps.length === 0) {
                          return (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin-slow" />
                              <p className="text-slate-500 font-medium">Nenhum pedido encontrado nesta seção.</p>
                            </div>
                          );
                        }

                        // Display in neat list
                        return (
                          <div className="space-y-4">
                            {displayedSwaps.map((t: any) => {
                              const oData = t.missaOrigemData ? t.missaOrigemData.split('-').reverse().join('/') : '';
                              const dData = t.missaDestinoData ? t.missaDestinoData.split('-').reverse().join('/') : '';

                              return (
                                <div key={t.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapSolicitanteDisplay(t)}
                                      </span>
                                      <span className="text-slate-400 text-xs">➔</span>
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapDestinatarioDisplay(t)}{t.segundoDestinatarioNome ? ` e ${t.segundoDestinatarioNome}` : ''}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono ${t.tipo === 'direta' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {t.tipo === 'direta' ? 'Troca Direta' : 'Substituição'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      Origem: <strong>{oData} às {t.missaOrigemHorario}</strong> ({t.missaOrigemMissa})
                                    </p>
                                    {t.tipo === 'direta' && (
                                      <p className="text-xs text-slate-500">
                                        Destino sugerido: <strong>{dData} às {t.missaDestinoHorario}</strong> ({t.missaDestinoMissa})
                                      </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Solicitado em: {(() => {
                                        try {
                                          if (!t.dataSolicitacao) return "Padrão";
                                          const parsedDate = new Date(t.dataSolicitacao);
                                          if (isNaN(parsedDate.getTime())) return "Padrão";
                                          return parsedDate.toLocaleDateString('pt-BR');
                                        } catch (err) {
                                          return "Padrão";
                                        }
                                      })()}
                                    </p>
                                  </div>

                                  <div>
                                    {t.status === 'pendente_destinatario' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                        Aguardando Ministro
                                      </span>
                                    ) : t.status === 'pendente_coordenacao' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                        Pendente Coordenação
                                      </span>
                                    ) : t.status === 'aprovado' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        Aprovado
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                        <X className="w-3.5 h-3.5 text-red-600" />
                                        Recusado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "mensagem" && (

                <div className="space-y-8">
                  {/* Received Messages Section */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-liturgy-600" />
                        Mensagens Recebidas
                      </h3>
                    </div>
                    <div className="p-6">
                      {directMessages.length === 0 ? (
                        <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                          Nenhuma mensagem recebida.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {directMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-xl border transition-all ${msg.lida ? "bg-slate-50 border-slate-200 opacity-80" : "bg-white border-liturgy-200 shadow-sm ring-1 ring-liturgy-50"}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">
                                      {msg.nome}
                                    </p>
                                    {!msg.lida && (
                                      <span className="w-2 h-2 bg-liturgy-600 rounded-full animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {msg.telefone}
                                  </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(msg.data).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                              </div>
                              <p className="text-slate-700 text-sm whitespace-pre-wrap">
                                {msg.texto}
                              </p>

                              <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-200/50">
                                <div className="flex gap-2">
                                  {!msg.lida && (
                                    <button
                                      onClick={async () => {
                                        if (await onMarcarComoLida(msg.id)) {
                                          setDirectMessages((prev) =>
                                            prev.map((m) =>
                                              m.id === msg.id
                                                ? { ...m, lida: true }
                                                : m,
                                            ),
                                          );
                                        }
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-liturgy-50 text-liturgy-600 rounded-lg text-xs font-bold hover:bg-liturgy-100 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Marcar como lida
                                    </button>
                                  )}
                                  {isCoordenador && (
                                    <>
                                      <button
                                        onClick={() => handleResponder(msg)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                      >
                                        <Reply className="w-3.5 h-3.5" />
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => {
                                          onCustomConfirm(
                                            "Deseja excluir esta mensagem?",
                                            async () => {
                                              if (
                                                await onExcluirMensagem(msg.id)
                                              ) {
                                                fetchData();
                                              }
                                            },
                                          );
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Excluir
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCoordenador ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      {/* Broadcast Message Section */}
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Info className="w-5 h-5 text-liturgy-600" />
                          Enviar Recado aos Ministros (Mensagem Temporária)
                        </h3>
                      </div>
                      <div className="p-6">
                        <form
                          onSubmit={handleEnviarRecado}
                          className="max-w-2xl space-y-6"
                        >
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Mensagem
                            </label>
                            <textarea
                              value={mensagemTexto}
                              onChange={(e) =>
                                setMensagemTexto(e.target.value.slice(0, 500))
                              }
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-liturgy-500 focus:ring-2 focus:ring-liturgy-200 outline-none transition-all min-h-[150px]"
                              placeholder="Digite o recado que será exibido na tela inicial de todos os ministros da sua paróquia..."
                              required
                            />
                            <div className="text-right text-xs text-slate-400 mt-1">
                              {mensagemTexto.length}/500 caracteres
                            </div>
                          </div>

                          {mensagemError && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                              {mensagemError}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="submit"
                              disabled={!mensagemTexto.trim()}
                              className="flex-1 px-6 py-3 bg-liturgy-600 text-black font-bold rounded-xl hover:bg-liturgy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Info className="w-5 h-5" />
                              Enviar Recado no App
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      {/* Direct Message Section (For Ministros) */}
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-liturgy-600" />
                          Enviar Mensagem para a Coordenação da Paróquia
                        </h3>
                      </div>
                      <div className="p-6">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!mensagemTexto.trim()) return;
                            setMensagemError("");

                            try {
                              const response = await fetch("/api/mensagens", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  nome: user.nome,
                                  telefone: user.telefone,
                                  mensagem: mensagemTexto,
                                  paroquia: user.paroquia,
                                  type: "direct",
                                }),
                              });

                              if (response.ok) {
                                setMessage(
                                  "Mensagem enviada com sucesso para a coordenação!",
                                );
                                setMensagemTexto("");
                                setTimeout(() => setMessage(""), 3000);
                              } else {
                                const data = await response.json();
                                setMensagemError(
                                  data.error || "Erro ao enviar mensagem.",
                                );
                              }
                            } catch (err) {
                              setMensagemError(err.message);
                            }
                          }}
                          className="max-w-2xl space-y-6"
                        >
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Mensagem
                            </label>
                            <textarea
                              value={mensagemTexto}
                              onChange={(e) =>
                                setMensagemTexto(e.target.value.slice(0, 500))
                              }
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-liturgy-500 focus:ring-2 focus:ring-liturgy-200 outline-none transition-all min-h-[150px]"
                              placeholder="Digite a mensagem que será enviada para a coordenação da sua paróquia..."
                              required
                            />
                            <div className="text-right text-xs text-slate-400 mt-1">
                              {mensagemTexto.length}/500 caracteres
                            </div>
                          </div>

                          {mensagemError && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                              {mensagemError}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="submit"
                              disabled={!mensagemTexto.trim()}
                              className="flex-1 px-6 py-3 bg-liturgy-600 text-black font-bold rounded-xl hover:bg-liturgy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-5 h-5" />
                              Enviar Mensagem
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Toast Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
        >
          <div className="w-2 h-2 bg-liturgy-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold tracking-tight">{message}</span>
        </motion.div>
      )}

      <PanoramaModal
        show={showPanoramaModal}
        onClose={() => setShowPanoramaModal(false)}
        escala={escala}
        disponibilidades={disponibilidades}
        getLimiteMissa={getLimiteMissa}
        paroquiaName={user?.paroquia}
        mes={mesSelecionado}
        ano={anoSelecionado}
        allMinisters={allMinisters}
      />

      {/* Solicitar Troca Modal */}
      {showSolicitarTrocaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-bold">Solicitar Troca de Missa</h3>
                  <p className="text-xs text-blue-100">
                    Preencha os passos para propor uma troca ou substituição
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSolicitarTrocaModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* STEP 1: Selecionar Missa de Origem */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  1. Selecione Sua Celebração que deseja trocar
                </label>
                {myAssignments.length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                    Você não está escalado em nenhuma celebração futura na escala publicada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {myAssignments.map((a: any, idx: number) => {
                      const isSel = trocaMissaOrigem?.date === a.date && trocaMissaOrigem?.time === a.time;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTrocaMissaOrigem(a);
                            setTrocaMissaDestino(null);
                            setTrocaDestinatario(null);
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center ${isSel ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {a.date.split('-').reverse().join('/')} às {a.time}
                            </p>
                            <p className="text-xs text-slate-500">
                              {a.descricao || a.nome || 'Missa'}
                            </p>
                          </div>
                          {isSel && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional: Married couple selection details */}
              {trocaMissaOrigem && user.tipo === "casal" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ❓ Quem do casal irá trocar?
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSolicitanteSubMembro("ambos");
                        setSubstituirPorDoisIndividuais(false);
                        setSegundoDestinatario(null);
                      }}
                      className={`py-2 px-1 text-[10px] rounded-xl border text-center transition-all font-bold ${solicitanteSubMembro === "ambos" ? "border-blue-600 bg-blue-50 text-blue-700 font-extrabold" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                    >
                      💑 Ambos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSolicitanteSubMembro("marido");
                        setSubstituirPorDoisIndividuais(false);
                        setSegundoDestinatario(null);
                      }}
                      className={`py-2 px-1 text-[10px] rounded-xl border text-center transition-all font-bold ${solicitanteSubMembro === "marido" ? "border-blue-600 bg-blue-50 text-blue-700 font-extrabold" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                    >
                      👨 {user.nomeExibicao || user.nome}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSolicitanteSubMembro("esposa");
                        setSubstituirPorDoisIndividuais(false);
                        setSegundoDestinatario(null);
                      }}
                      className={`py-2 px-1 text-[10px] rounded-xl border text-center transition-all font-bold ${solicitanteSubMembro === "esposa" ? "border-blue-600 bg-blue-50 text-blue-700 font-extrabold" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                    >
                      👩 {user.nomeExibicaoConjuge || user.nomeConjuge}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {solicitanteSubMembro === "ambos" 
                      ? "Os dois serão substituídos juntos nesta celebração." 
                      : `Apenas ${solicitanteSubMembro === "marido" ? user.nomeExibicao || user.nome : user.nomeExibicaoConjuge || user.nomeConjuge} será substituído(a). O outro cônjuge continuará escalado.`}
                  </p>
                </div>
              )}

              {/* STEP 2: Selecionar Tipo de Troca */}
              {trocaMissaOrigem && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    2. Escolha a modalidade de troca
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTrocaTipo('direta');
                        setTrocaDestinatario(null);
                        setTrocaMissaDestino(null);
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all ${trocaTipo === 'direta' ? 'border-blue-600 bg-blue-50/20 font-bold text-blue-850' : 'border-slate-250 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <p className="text-xs font-black">Troca Direta</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">Troco com outra missa escalada</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrocaTipo('substituto');
                        setTrocaDestinatario(null);
                        setTrocaMissaDestino(null);
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all ${trocaTipo === 'substituto' ? 'border-blue-600 bg-blue-50/20 font-bold text-blue-850' : 'border-slate-250 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <p className="text-xs font-black">Substituição</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">Apenas indico um ministro livre</p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Selecionar Ministro / Celebração Destino */}
              {trocaMissaOrigem && (
                <div className="space-y-4 pt-2 border-t border-slate-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      3. {trocaTipo === 'direta' ? 'Selecione quem quer propor trocar' : 'Selecione ministro livre da escala'}
                    </label>
                  </div>

                  {/* Two individuals option for couple replacement */}
                  {user.tipo === "casal" && solicitanteSubMembro === "ambos" && trocaTipo === "substituto" && (
                    <div className="flex items-center gap-2.5 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-150">
                      <input
                        id="swap-two-individuals-checkbox"
                        type="checkbox"
                        checked={substituirPorDoisIndividuais}
                        onChange={(e) => {
                          setSubstituirPorDoisIndividuais(e.target.checked);
                          setTrocaDestinatario(null);
                          setSegundoDestinatario(null);
                          setEscolhendoSegundoIndiv(false);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="swap-two-individuals-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        🔄 Substituir casal por 2 ministros individuais
                      </label>
                    </div>
                  )}

                  {/* Dual Minister Slots selector */}
                  {substituirPorDoisIndividuais && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEscolhendoSegundoIndiv(false)}
                          className={`p-3 rounded-xl border text-left transition-all ${!escolhendoSegundoIndiv ? "border-blue-600 bg-white shadow-sm font-extrabold text-blue-700" : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-white/50"}`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Ministro 1</span>
                          <span className="text-xs truncate block">{trocaDestinatario ? (trocaDestinatario.nomeExibicao || trocaDestinatario.nome) : "Selecionar..."}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEscolhendoSegundoIndiv(true)}
                          className={`p-3 rounded-xl border text-left transition-all ${escolhendoSegundoIndiv ? "border-blue-600 bg-white shadow-sm font-extrabold text-blue-700" : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-white/50"}`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Ministro 2</span>
                          <span className="text-xs truncate block">{segundoDestinatario ? (segundoDestinatario.nomeExibicao || segundoDestinatario.nome) : "Selecionar..."}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center italic">
                        {!escolhendoSegundoIndiv ? "Clique em um ministro abaixo para preencher o slot 1" : "Clique em um ministro abaixo para preencher o slot 2"}
                      </p>
                    </div>
                  )}
                  {trocaDestinatario?.tipo === 'casal' && !substituirPorDoisIndividuais && (
                    <div className="bg-amber-50/20 p-3.5 rounded-2xl border border-amber-200/60 space-y-2">
                      <span className="block text-[10px] font-black text-amber-850 uppercase tracking-wider">
                        ❓ Quem do casal convidado atuará na troca?
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={!!(trocaDestinatario?.afastado || trocaDestinatario?.afastadoConjuge)}
                          onClick={() => setDestinatarioSubMembro("ambos")}
                          className={`py-1.5 px-0.5 text-[9px] rounded-lg border text-center transition-all font-bold ${
                            (trocaDestinatario?.afastado || trocaDestinatario?.afastadoConjuge)
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                              : destinatarioSubMembro === "ambos"
                                ? "border-amber-600 bg-amber-50 text-amber-800 font-extrabold"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100/50"
                          }`}
                        >
                          💑 Ambos
                        </button>
                        <button
                          type="button"
                          disabled={!!trocaDestinatario?.afastado}
                          onClick={() => setDestinatarioSubMembro("marido")}
                          className={`py-1.5 px-0.5 text-[9px] rounded-lg border text-center transition-all font-bold ${
                            trocaDestinatario?.afastado
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                              : destinatarioSubMembro === "marido"
                                ? "border-amber-600 bg-amber-50 text-amber-800 font-extrabold"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100/50"
                          }`}
                        >
                          👨 {trocaDestinatario?.nomeExibicao || trocaDestinatario?.nome} {trocaDestinatario?.afastado ? "(Afastado)" : ""}
                        </button>
                        <button
                          type="button"
                          disabled={!!trocaDestinatario?.afastadoConjuge}
                          onClick={() => setDestinatarioSubMembro("esposa")}
                          className={`py-1.5 px-0.5 text-[9px] rounded-lg border text-center transition-all font-bold ${
                            trocaDestinatario?.afastadoConjuge
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                              : destinatarioSubMembro === "esposa"
                                ? "border-amber-600 bg-amber-50 text-amber-800 font-extrabold"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100/50"
                          }`}
                        >
                          👩 {trocaDestinatario?.nomeExibicaoConjuge || trocaDestinatario?.nomeConjuge} {trocaDestinatario?.afastadoConjuge ? "(Afastada)" : ""}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search filter for selecting */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquisar ministro..."
                      value={trocaBuscaTerm}
                      onChange={(e) => setTrocaBuscaTerm(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:ring-1 focus:ring-blue-550 focus:bg-white transition-all outline-none"
                    />
                  </div>

                  {/* If direct swap: list futurePublishedSlots matching query */}
                  {trocaTipo === 'direta' ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        const filtered = futurePublishedSlots.filter((slot: any) => {
                          const normalSearch = trocaBuscaTerm.toLowerCase();
                          return (
                            slot.ministerName.toLowerCase().includes(normalSearch) ||
                            slot.missaNome.toLowerCase().includes(normalSearch) ||
                            slot.date.includes(normalSearch)
                          );
                        });

                        if (filtered.length === 0) {
                          return <p className="text-[11px] text-slate-400 text-center py-4">Nenhuma outra escala de outro ministro disponível para troca direta.</p>;
                        }

                        return filtered.map((slot: any, sIdx: number) => {
                          const isSelSlot = trocaMissaDestino?.date === slot.date && 
                                            trocaMissaDestino?.time === slot.time && 
                                            (trocaDestinatario?.nome === slot.ministerName || trocaDestinatario?.name === slot.ministerName);
                          const slotDateStr = slot.date.split('-').reverse().join('/');

                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                setTrocaMissaDestino({
                                  date: slot.date,
                                  time: slot.time,
                                  descricao: slot.missaNome
                                });
                                setTrocaDestinatario({
                                  id: slot.ministerId,
                                  nome: slot.ministerName,
                                  telefone: slot.ministerTelefone
                                });
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${isSelSlot ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-850">
                                  {slot.ministerName}
                                </span>
                                {isSelSlot && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {slotDateStr} às {slot.time} - {slot.missaNome}
                              </p>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    /* If substitution: list allMinisters of parish with restriction warnings */
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        const currentParish = user.paroquia || "";
                        const normalizedCurrentParish = currentParish.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                        const filtered = allMinisters.filter((m: any) => {
                          // Match parish
                          const mParoquia = m.paroquia || "";
                          const normalizedMParoquia = mParoquia.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                          if (normalizedMParoquia !== normalizedCurrentParish) return false;

                          // Exclude oneself
                          if (m.id === user.id) return false;

                          // Filter out away (inactive) ministers so they do not appear
                          const isFullyAway = m.tipo === "casal" ? (!!m.afastado || !!m.afastadoConjuge) : !!m.afastado;
                          if (isFullyAway) { console.log('DEBUG_MINISTER', m); return false; }

                          // Search term
                          const searchNormal = trocaBuscaTerm.toLowerCase();
                          return (
                            m.nome.toLowerCase().includes(searchNormal) ||
                            (m.nomeExibicao || "").toLowerCase().includes(searchNormal) ||
                            (m.nomeConjuge || "").toLowerCase().includes(searchNormal) ||
                            (m.nomeExibicaoConjuge || "").toLowerCase().includes(searchNormal)
                          );
                        });

                        if (filtered.length === 0) {
                          return <p className="text-[11px] text-slate-400 text-center py-4">Nenhum ministro cadastrado nesta paróquia.</p>;
                        }

                        return filtered.map((m: any) => {
                          // CHECK INCOMPATIBILITY CONSTRAINT AND DEVIATIONS
                          const isFullyAway = m.tipo === "casal" ? (!!m.afastado || !!m.afastadoConjuge) : !!m.afastado;
                          const isConflict = isMinisterScheduledOnDayOrWeek(m, trocaMissaOrigem.date);
                          const isSel = substituirPorDoisIndividuais
                            ? (trocaDestinatario?.id === m.id || segundoDestinatario?.id === m.id)
                            : (trocaDestinatario?.id === m.id);
                          const isAlreadySelectedInOtherSlot = substituirPorDoisIndividuais && (
                            (!escolhendoSegundoIndiv && segundoDestinatario?.id === m.id) ||
                            (escolhendoSegundoIndiv && trocaDestinatario?.id === m.id)
                          );
                          const isDisabled = isConflict || isAlreadySelectedInOtherSlot || isFullyAway;

                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (substituirPorDoisIndividuais) {
                                  if (!escolhendoSegundoIndiv) {
                                    setTrocaDestinatario(m);
                                    if (m.tipo === 'casal') {
                                      if (m.afastado && !m.afastadoConjuge) setDestinatarioSubMembro("esposa");
                                      else if (!m.afastado && m.afastadoConjuge) setDestinatarioSubMembro("marido");
                                      else setDestinatarioSubMembro("ambos");
                                    } else {
                                      setDestinatarioSubMembro("ambos");
                                    }
                                    setEscolhendoSegundoIndiv(true);
                                  } else {
                                    setSegundoDestinatario(m);
                                  }
                                } else {
                                  setTrocaDestinatario(m);
                                  if (m.tipo === 'casal') {
                                    if (m.afastado && !m.afastadoConjuge) setDestinatarioSubMembro("esposa");
                                    else if (!m.afastado && m.afastadoConjuge) setDestinatarioSubMembro("marido");
                                    else setDestinatarioSubMembro("ambos");
                                  } else {
                                    setDestinatarioSubMembro("ambos");
                                  }
                                  setTrocaMissaDestino(null);
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${isDisabled ? 'bg-slate-100 opacity-60 cursor-not-allowed border-slate-200' : isSel ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  <span>
                                    {m.tipo === "casal" 
                                      ? `${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}` 
                                      : (m.nomeExibicao || m.nome)}
                                  </span>
                                  {m.tipo === "casal" && (m.afastado || m.afastadoConjuge) && (
                                    <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                                      Partical. Afastado
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {m.tipo === "casal" ? "Casal" : (m.funcao || 'Ministro')}
                                </p>
                              </div>

                              <div>
                                {isFullyAway ? (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                    🚫 Afastado
                                  </span>
                                ) : isConflict ? (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                    ⚠️ Já escalado na semana/dia
                                  </span>
                                ) : isAlreadySelectedInOtherSlot ? (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                    Selecionado no outro slot
                                  </span>
                                ) : isSel ? (
                                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                    Disponível
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSolicitarTrocaModal(false)}
                className="flex-1 px-4 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all font-mono"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleEnviarSolicitacaoTroca}
                disabled={!trocaMissaOrigem || !trocaDestinatario || (trocaTipo === 'direta' && !trocaMissaDestino) || isSubmittingTroca}
                className="flex-1 px-4 py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 font-mono flex items-center justify-center gap-1"
              >
                {isSubmittingTroca ? 'ENVIANDO...' : 'SOLICITAR TROCA'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Responder Modal */}
      {showResponderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-liturgy-600 text-black">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Reply className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Responder Mensagem</h3>
                  <p className="text-xs text-liturgy-100">
                    Para: {selectedMessage?.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResponderModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Mensagem Original
                </p>
                <p className="text-sm text-slate-600 italic">
                  "{selectedMessage?.texto}"
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Sua Resposta
                </label>
                <textarea
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-liturgy-500 focus:border-liturgy-500 transition-all text-sm resize-none"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowResponderModal(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarResposta}
                disabled={!respostaTexto.trim()}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-liturgy-600 rounded-xl hover:bg-liturgy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-liturgy-200"
              >
                Enviar Resposta
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AdminView({
  onLogout,
  setView,
  user,
  mesSelecionado,
  anoSelecionado,
  onDownloadBackup,
  onRestoreBackup,
  setViewAsMinister,
  onImpersonate,
  onCustomConfirm,
  onAlert,
  setDownloadOptionMode,
}) {
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard"); // 'dashboard' | 'igrejas' | 'testes' | 'estoque'
  const [coordinatorEnabled, setCoordinatorEnabled] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [ministros, setMinistros] = useState([]);
  const [paroquias, setParoquias] = useState([]);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showPassForm, setShowPassForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedParoquiaForMinisters, setSelectedParoquiaForMinisters] =
    useState(null);
  const [filterCidade, setFilterCidade] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [coordFilterEstado, setCoordFilterEstado] = useState("");
  const [coordFilterCidade, setCoordFilterCidade] = useState("");

  const uniqueCoordinatorStates = useMemo(() => {
    if (!Array.isArray(paroquias)) return [];
    return Array.from(new Set(paroquias.map((p: any) => p.estado).filter(Boolean))).sort();
  }, [paroquias]);

  const uniqueCoordinatorCities = useMemo(() => {
    if (!Array.isArray(paroquias)) return [];
    return Array.from(
      new Set(
        paroquias
          .filter((p: any) => !coordFilterEstado || p.estado === coordFilterEstado)
          .map((p: any) => p.cidade)
          .filter(Boolean),
      ),
    ).sort();
  }, [paroquias, coordFilterEstado]);

  const filteredActiveCoordinators = useMemo(() => {
    return coordinators.filter((c: any) => {
      const p = paroquias.find((item: any) => item.nome === c.paroquia);
      const est = p?.estado || "";
      const cid = p?.cidade || "";

      if (coordFilterEstado && est !== coordFilterEstado) return false;
      if (coordFilterCidade && cid !== coordFilterCidade) return false;
      return true;
    });
  }, [coordinators, paroquias, coordFilterEstado, coordFilterCidade]);

  const [showParoquiaForm, setShowParoquiaForm] = useState(false);
  const [editingParoquia, setEditingParoquia] = useState(null);
  const [editingCoordinator, setEditingCoordinator] = useState(null);
  const [coordinatorFormData, setCoordinatorFormData] = useState({
    nome: "",
    nomeExibicao: "",
    telefone: "",
    senha: "",
    tipo: "individual",
    nomeConjuge: "",
    nomeExibicaoConjuge: "",
    telefoneConjuge: "",
    senhaConjuge: "",
    paroquia: "",
  });
  const [paroquiaFormData, setParoquiaFormData] = useState({
    nome: "",
    cnpj: "",
    coordenador: "",
    telefoneCoordenador: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    padre: "",
    telefone1: "",
    telefone2: "",
    email: "",
    site: "",
    bloqueada: false,
  });

  const lastAdminFetchRef = useRef<number>(0);

  const fetchData = async (force = false) => {
    if (!force) {
      // Throttle: don't fetch more than once every 3 seconds
      const now = Date.now();
      if (now - lastAdminFetchRef.current < 3000) return;
      lastAdminFetchRef.current = now;
    }

    try {
      const paroquiaQuery = user.paroquia
        ? `?paroquia=${encodeURIComponent(user.paroquia)}`
        : "";
      const [
        configRes,
        pendingRes,
        coordinatorsRes,
        ministrosRes,
        paroquiasRes,
      ] = await Promise.all([
        fetch(`/api/config${paroquiaQuery}`),
        fetch(`/api/admin/pending${paroquiaQuery}`),
        fetch(`/api/admin/coordinators${paroquiaQuery}`),
        fetch(`/api/admin/ministros${paroquiaQuery}`),
        fetch("/api/paroquias"),
      ]);
      const configData = await configRes.json();
      const pendingData = await pendingRes.json();
      const coordinatorsData = await coordinatorsRes.json();
      const ministrosData = await ministrosRes.json();
      const paroquiasData = await paroquiasRes.json();

      setCoordinatorEnabled(configData.coordinatorEnabled);
      setPendingUsers(Array.isArray(pendingData) ? pendingData : []);
      setCoordinators(
        Array.isArray(coordinatorsData) ? coordinatorsData : [],
      );
      setMinistros(Array.isArray(ministrosData) ? ministrosData : []);
      setParoquias(Array.isArray(paroquiasData) ? paroquiasData : []);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveParoquia = async (e) => {
    e.preventDefault();
    try {
      const url = editingParoquia
        ? `/api/paroquias/${editingParoquia.id}`
        : "/api/paroquias";
      const method = editingParoquia ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paroquiaFormData),
      });

      if (response.ok) {
        const saved = await response.json();
        if (editingParoquia) {
          setParoquias((prev) =>
            prev.map((p) => (p.id === saved.id ? saved : p)),
          );
          setMessage("Paróquia atualizada com sucesso!");
        } else {
          setParoquias((prev) => [...prev, saved]);
          setMessage("Paróquia cadastrada com sucesso!");
        }
        await fetchData(true);
        setShowParoquiaForm(false);
        setEditingParoquia(null);
        setParoquiaFormData({
          nome: "",
          cnpj: "",
          coordenador: "",
          telefoneCoordenador: "",
          endereco: "",
          numero: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
          padre: "",
          telefone1: "",
          telefone2: "",
          email: "",
          site: "",
          bloqueada: false,
        });
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao salvar paróquia:", err);
    }
  };

  const handleDeleteParoquia = (id) => {
    onCustomConfirm("Deseja excluir esta paróquia?", async () => {
      try {
        const response = await fetch(`/api/paroquias/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setParoquias((prev) => prev.filter((p) => p.id !== id));
          setMessage("Paróquia excluída com sucesso.");
          await fetchData(true);
          setTimeout(() => setMessage(""), 3000);
        }
      } catch (err) {
        console.error("Erro ao excluir paróquia:", err);
      }
    });
  };

  const handleSaveCoordinator = async (e) => {
    e.preventDefault();
    if (!editingCoordinator) return;
    try {
      const response = await fetch(`/api/admin/coordinators/${editingCoordinator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coordinatorFormData),
      });

      if (response.ok) {
        setMessage("Coordenador atualizado com sucesso!");
        setEditingCoordinator(null);
        await fetchData(true);
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await response.json();
        onAlert(errorData.error || "Erro ao atualizar coordenador.");
      }
    } catch (err) {
      console.error("Erro ao salvar coordenador:", err);
      onAlert("Erro de conexão ao salvar coordenador.");
    }
  };

  const handleToggle = async () => {
    const newState = !coordinatorEnabled;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorEnabled: newState }),
      });
      if (response.ok) {
        setCoordinatorEnabled(newState);
        setMessage(
          `Acesso de Coordenador ${newState ? "liberado" : "bloqueado"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao atualizar configuração:", err);
    }
  };

  const handleApprove = async (id, role = "coordenacao") => {
    try {
      const response = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        const approvedUser = pendingUsers.find((u) => u.id === id);
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        if (
          (role === "coordenacao" || role === "coordenador") &&
          approvedUser
        ) {
          setCoordinators((prev) => [
            ...prev,
            { ...approvedUser, role: "coordenacao", aprovado: true },
          ]);

          // Atualiza o estado das paróquias localmente se for um coordenador
          if (approvedUser.paroquia) {
            setParoquias((prev) =>
              prev.map((p) => {
                if (p.nome === approvedUser.paroquia) {
                  return {
                    ...p,
                    coordenador: approvedUser.nome,
                    telefoneCoordenador: approvedUser.telefone,
                  };
                }
                return p;
              }),
            );
          }
        } else if (role === "ministro" && approvedUser) {
          setMinistros((prev) => [
            ...prev,
            { ...approvedUser, role: "ministro", aprovado: true },
          ]);
        }
        setMessage("Usuário aprovado com sucesso!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao aprovar usuário:", err);
    }
  };

  const handleDeleteCoordinator = (id) => {
    onCustomConfirm(
      "Tem certeza que deseja excluir este coordenador?",
      async () => {
        try {
          const response = await fetch(`/api/admin/coordinators/${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            setCoordinators((prev) => prev.filter((c) => c.id !== id));
            setMessage("Coordenador excluído com sucesso.");
            setTimeout(() => setMessage(""), 3000);
          }
        } catch (err) {
          console.error("Erro ao excluir coordenador:", err);
        }
      },
    );
  };

  const handleDeleteMinistro = (id) => {
    onCustomConfirm(
      "Tem certeza que deseja excluir este ministro?",
      async () => {
        try {
          const response = await fetch(`/api/admin/coordinators/${id}`, {
            method: "DELETE",
          }); // Using same delete endpoint as it handles all users by ID
          if (response.ok) {
            setMinistros((prev) => prev.filter((m) => m.id !== id));
            setMessage("Ministro excluído com sucesso.");
            setTimeout(() => setMessage(""), 3000);
          }
        } catch (err) {
          console.error("Erro ao excluir ministro:", err);
        }
      },
    );
  };

  const handleReject = (id) => {
    onCustomConfirm(
      "Tem certeza que deseja rejeitar este cadastro?",
      async () => {
        try {
          const response = await fetch(`/api/admin/reject/${id}`, {
            method: "POST",
          });
          if (response.ok) {
            setPendingUsers((prev) => prev.filter((u) => u.id !== id));
            setMessage("Usuário rejeitado.");
            setTimeout(() => setMessage(""), 3000);
          }
        } catch (err) {
          console.error("Erro ao rejeitar cadastro:", err);
        }
      },
    );
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const adminPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,15}$/;

    if (!newAdminPassword || !adminPasswordRegex.test(newAdminPassword)) {
      setMessage(
        "A senha do Admin deve ter entre 8 e 15 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.",
      );
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha: newAdminPassword }),
      });
      if (response.ok) {
        setMessage("Senha alterada com sucesso!");
        setNewAdminPassword("");
        setShowPassForm(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Erro ao alterar senha.");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Painel de Administração
            </h1>
            <p className="text-slate-500">
              Gerencie usuários, acessos e configurações do sistema.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Top Navigation Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveAdminTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeAdminTab === "dashboard"
                ? "bg-liturgy-600 text-slate-900 shadow-md shadow-liturgy-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-liturgy-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveAdminTab("igrejas")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeAdminTab === "igrejas"
                ? "bg-liturgy-600 text-slate-900 shadow-md shadow-liturgy-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-liturgy-600"
            }`}
          >
            <Church className="w-4 h-4" />
            Igrejas / Paróquias
          </button>

          <button
            onClick={() => setActiveAdminTab("testes")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeAdminTab === "testes"
                ? "bg-liturgy-600 text-slate-900 shadow-md shadow-liturgy-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-liturgy-600"
            }`}
          >
            <Database className="w-4 h-4" />
            Testes
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          <button
            onClick={() => {
              setViewAsMinister(false);
              setView("coordenacao");
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 hover:text-liturgy-600 transition-all"
          >
            <Users className="w-4 h-4" />
            Visão da Coordenação
          </button>

          <button
            onClick={() => {
              setViewAsMinister(true);
              setView("coordenacao");
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 hover:text-liturgy-600 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Visão do Ministro
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {activeAdminTab === "testes" ? (
            <div className="lg:col-span-12">
              <AdminParoquiasView
                user={user}
                onCustomConfirm={onCustomConfirm}
              />
            </div>
          ) : (
            <>
              {/* Sidebar Area (Left) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Welcome & Stats Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                  <div className="absolute -top-6 -right-6 opacity-5">
                    <Settings className="w-32 h-32 text-slate-900" />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-xl font-bold text-slate-900">
                      Olá, Admin
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 mb-6">
                      {format(new Date(), "EEEE, d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Pendentes
                        </p>
                        <p
                          className={`text-xl font-bold ${pendingUsers.length > 0 ? "text-red-600" : "text-slate-700"}`}
                        >
                          {pendingUsers.reduce(
                            (acc, u) => acc + (u.tipo === "casal" ? 2 : 1),
                            0,
                          )}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Total Equipe
                        </p>
                        <p className="text-xl font-bold text-slate-700">
                          {[...coordinators, ...ministros].reduce(
                            (acc, u) => acc + (u.tipo === "casal" ? 2 : 1),
                            0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configurações
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Acesso Coordenador
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Liberar login externo
                        </p>
                      </div>
                      <button
                        onClick={handleToggle}
                        disabled={loading}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${coordinatorEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${coordinatorEnabled ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">
                          Segurança
                        </p>
                        <button
                          onClick={() => setShowPassForm(!showPassForm)}
                          className="text-[10px] font-bold text-liturgy-600 hover:underline"
                        >
                          {showPassForm ? "Cancelar" : "Alterar Senha"}
                        </button>
                      </div>

                      {showPassForm && (
                        <form
                          onSubmit={handleChangePassword}
                          className="space-y-2 pt-2 border-t border-slate-200"
                        >
                          <input
                            type="password"
                            maxLength={15}
                            placeholder="Nova senha (8-15 caracteres)"
                            value={newAdminPassword}
                            onChange={(e) =>
                              setNewAdminPassword(e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-liturgy-500/20"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="submit"
                            className="w-full bg-liturgy-600 text-slate-900 py-2 rounded-lg text-[10px] font-bold hover:bg-liturgy-700 transition-colors"
                          >
                            Salvar Nova Senha
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-2 border-liturgy-100 rounded-xl space-y-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-liturgy-600" />
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Backup do Sistema
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <button
                            onClick={onDownloadBackup}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                          >
                            <Download className="w-4 h-4" />
                            BAIXAR JSON
                          </button>

                          <div className="relative">
                            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-liturgy-600 text-slate-900 rounded-xl text-xs font-black hover:bg-liturgy-700 transition-all cursor-pointer shadow-md active:scale-95 text-center">
                              <Upload className="w-4 h-4" />
                              RESTAURAR JSON
                              <input
                                type="file"
                                accept=".json"
                                onChange={(e) => {
                                  onRestoreBackup(e);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-liturgy-100/30 p-2 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-liturgy-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                          Use estas funções para salvar ou recuperar todos os
                          dados do sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area (Right) */}
              <div className="lg:col-span-9 space-y-8">
                {activeAdminTab === "dashboard" ? (
                  <>
                    {/* Pending Approvals Section */}
                    {pendingUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden"
                      >
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                          <h3 className="font-bold text-red-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Aprovações Pendentes
                          </h3>
                          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {pendingUsers.length}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingUsers.map((user) => (
                              <div
                                key={user.id}
                                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {user.nomeExibicao || user.nome}{" "}
                                      {user.tipo === "casal" &&
                                      (user.nomeExibicaoConjuge ||
                                        user.nomeConjuge)
                                        ? `e ${user.nomeExibicaoConjuge || user.nomeConjuge}`
                                        : ""}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {user.telefone}
                                    </p>
                                    <p className="text-[10px] text-slate-400 italic mt-1">
                                      {user.paroquia}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-bold uppercase">
                                    {user.tipo || "individual"}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleApprove(user.id, "coordenacao")
                                      }
                                      className="flex-1 bg-liturgy-600 text-black py-2 rounded-xl text-[10px] font-bold hover:bg-liturgy-700 transition-colors"
                                    >
                                      Aprovar Coordenador
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleApprove(user.id, "ministro")
                                      }
                                      className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-black transition-colors"
                                    >
                                      Aprovar Ministro
                                    </button>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <button
                                      onClick={() => handleReject(user.id)}
                                      className="text-slate-400 py-1 px-3 text-[10px] font-bold hover:text-red-600 transition-colors"
                                    >
                                      Rejeitar Cadastro
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Coordinators List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-liturgy-500" />
                          Coordenação Ativa
                        </h3>
                        <span className="text-xs font-medium text-slate-400">
                          {filteredActiveCoordinators.length !== coordinators.length
                            ? `${filteredActiveCoordinators.length} de ${coordinators.length} usuários`
                            : `${coordinators.length} usuários`}
                        </span>
                      </div>
                      <div className="p-6">
                        {/* Filtros por Cidade / UF */}
                        {coordinators.length > 0 && (
                          <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap self-start sm:self-center">
                              📍 Filtrar por:
                            </span>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-1">
                              <select
                                value={coordFilterEstado}
                                onChange={(e) => {
                                  setCoordFilterEstado(e.target.value);
                                  setCoordFilterCidade(""); // Reset city when state changes
                                }}
                                className="w-full sm:w-48 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                              >
                                <option value="">Todos os Estados (UF)</option>
                                {uniqueCoordinatorStates.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={coordFilterCidade}
                                onChange={(e) => setCoordFilterCidade(e.target.value)}
                                className="w-full sm:w-64 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                                disabled={!coordFilterEstado && uniqueCoordinatorCities.length === 0}
                              >
                                <option value="">Todas as Cidades</option>
                                {uniqueCoordinatorCities.map((cidade) => (
                                  <option key={cidade} value={cidade}>
                                    {cidade}
                                  </option>
                                ))}
                              </select>
                              {(coordFilterEstado || coordFilterCidade) && (
                                <button
                                  onClick={() => {
                                    setCoordFilterEstado("");
                                    setCoordFilterCidade("");
                                  }}
                                  className="text-xs font-bold text-liturgy-600 hover:text-liturgy-700 hover:underline transition-all whitespace-nowrap px-2"
                                >
                                  Limpar Filtros
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {coordinators.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-slate-400 text-sm italic">
                              Nenhum coordenador ativo no sistema.
                            </p>
                          </div>
                        ) : filteredActiveCoordinators.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold text-sm">
                              Nenhum coordenador encontrado nos filtros.
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Tente ajustar ou limpar seus filtros de localização.
                            </p>
                            <button
                              onClick={() => {
                                setCoordFilterEstado("");
                                setCoordFilterCidade("");
                              }}
                              className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-xs"
                            >
                              Limpar Filtros
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(
                              filteredActiveCoordinators.reduce(
                                (acc: Record<string, any[]>, c: any) => {
                                  const p = c.paroquia || "Sem Paróquia";
                                  if (!acc[p]) acc[p] = [];
                                  acc[p].push(c);
                                  return acc;
                                },
                                {},
                              ),
                            ).map(([paroquia, lista]: [string, any[]]) => (
                              <div key={paroquia} className="space-y-4 p-5 bg-slate-50/40 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    {paroquia}
                                  </h4>
                                  <div className="h-px bg-slate-100 w-full" />
                                  <span className="text-[10px] font-bold text-slate-300">
                                    {lista.length}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  {lista.map((coord) => (
                                    <div
                                      key={coord.id}
                                      className="p-4 bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-250/60 shadow-xs flex items-start justify-between gap-4 group hover:shadow-sm hover:border-liturgy-200 transition-all duration-200 relative overflow-hidden"
                                    >
                                      <div className="flex items-start gap-3.5">
                                        {coord.tipo === "casal" ? (
                                          <div className="w-12 h-12 bg-rose-50/60 rounded-xl flex flex-col items-center justify-center border border-rose-100 text-rose-700 font-extrabold text-xs relative flex-shrink-0 shadow-2xs">
                                            <div className="font-mono tracking-tighter leading-none uppercase">
                                              {coord.nome.charAt(0)}{coord.nomeConjuge ? `+${coord.nomeConjuge.charAt(0)}` : ''}
                                            </div>
                                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 absolute bottom-1.5 right-1.5" />
                                          </div>
                                        ) : (
                                          <div className="w-12 h-12 bg-liturgy-50 rounded-xl flex items-center justify-center border border-liturgy-100 text-liturgy-700 font-mono font-extrabold text-sm uppercase flex-shrink-0 shadow-2xs">
                                            {coord.nome.charAt(0)}
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                            <span>{coord.nome}</span>
                                            {coord.tipo === "casal" && coord.nomeConjuge && (
                                              <>
                                                <span className="text-slate-300 font-normal">e</span>
                                                <span>{coord.nomeConjuge}</span>
                                              </>
                                            )}
                                          </div>

                                          <div className="flex flex-col gap-1">
                                            {/* Type Badge */}
                                            <div>
                                              {coord.tipo === "casal" ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] rounded-md font-bold uppercase tracking-wider scale-90 origin-left">
                                                  <Heart className="w-2 h-2 fill-rose-200 text-rose-500" /> Casal Coordenador
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] rounded-md font-bold uppercase tracking-wider scale-90 origin-left">
                                                  <User className="w-2 h-2 text-slate-500" /> Coordenador
                                                </span>
                                              )}
                                            </div>

                                            {/* Phones & Badges Detail */}
                                            {coord.tipo === "casal" ? (
                                              <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-1 border-t border-slate-100 pt-1.5 max-w-[240px]">
                                                <div className="flex items-center gap-1.5">
                                                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                  <span className="font-mono font-medium text-slate-700">{coord.telefone}</span>
                                                  {coord.nomeExibicao && (
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                                      {coord.nomeExibicao}
                                                    </span>
                                                  )}
                                                </div>
                                                {coord.nomeConjuge && (
                                                  <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-slate-450 flex-shrink-0" />
                                                    <span className="font-mono font-medium text-slate-700">
                                                      {coord.telefoneConjuge || coord.telefone}
                                                    </span>
                                                    {coord.nomeExibicaoConjuge && (
                                                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                                        {coord.nomeExibicaoConjuge}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5 max-w-[240px]">
                                                <div className="flex items-center gap-1.5">
                                                  <Phone className="w-3 h-3 text-slate-405 flex-shrink-0" />
                                                  <span className="font-mono font-medium text-slate-700">{coord.telefone}</span>
                                                  {coord.nomeExibicao && (
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                                      {coord.nomeExibicao}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                          onClick={() => {
                                            setEditingCoordinator(coord);
                                            setCoordinatorFormData({
                                              nome: coord.nome || "",
                                              nomeExibicao: coord.nomeExibicao || "",
                                              telefone: coord.telefone || "",
                                              senha: coord.senha || "",
                                              tipo: coord.tipo || "individual",
                                              nomeConjuge: coord.nomeConjuge || "",
                                              nomeExibicaoConjuge: coord.nomeExibicaoConjuge || "",
                                              telefoneConjuge: coord.telefoneConjuge || "",
                                              senhaConjuge: coord.senhaConjuge || "",
                                              paroquia: coord.paroquia || "",
                                            });
                                          }}
                                          className="p-1.5 bg-white hover:bg-liturgy-50 border border-slate-200 hover:border-liturgy-200 text-slate-400 hover:text-liturgy-600 rounded-lg transition-all shadow-sm"
                                          title="Editar Coordenador"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteCoordinator(coord.id)
                                          }
                                          className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-lg transition-all shadow-sm"
                                          title="Excluir Coordenador"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : selectedParoquiaForMinisters ? (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              setSelectedParoquiaForMinisters(null)
                            }
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                              Ministros: {selectedParoquiaForMinisters.nome}
                            </h2>
                            <p className="text-sm text-slate-500">
                              Lista de ministros vinculados a esta paróquia
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ministros.filter(
                          (m) =>
                            m.paroquia === selectedParoquiaForMinisters.nome,
                        ).length === 0 ? (
                          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-100">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 italic">
                              Nenhum ministro encontrado para esta paróquia.
                            </p>
                          </div>
                        ) : (
                          ministros
                            .filter(
                              (m) =>
                                m.paroquia ===
                                selectedParoquiaForMinisters.nome,
                            )
                            .map((m) => (
                              <div
                                key={m.id}
                                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-liturgy-50 text-liturgy-600 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900">
                                      {m.nomeExibicao || m.nome}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {m.tipo}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Phone className="w-3 h-3" />
                                    {m.telefone}
                                  </div>
                                  {m.tipo === "casal" && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Heart className="w-3 h-3 text-red-400" />
                                      {m.nomeExibicaoConjuge || m.nomeConjuge} (
                                      {m.telefoneConjuge})
                                    </div>
                                  )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end items-center">
                                  <button
                                    onClick={() => handleDeleteMinistro(m.id)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Excluir Ministro"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <Church className="w-7 h-7 text-liturgy-600" />
                          Gerenciamento de Paróquias
                        </h2>
                        <button
                          onClick={() => {
                            setEditingParoquia(null);
                            setParoquiaFormData({
                              nome: "",
                              cnpj: "",
                              coordenador: "",
                              telefoneCoordenador: "",
                              endereco: "",
                              numero: "",
                              bairro: "",
                              cidade: "",
                              estado: "",
                              cep: "",
                              padre: "",
                              telefone1: "",
                              telefone2: "",
                              email: "",
                              site: "",
                              bloqueada: false,
                            });
                            setShowParoquiaForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-liturgy-600 text-black rounded-xl font-bold text-sm hover:bg-liturgy-700 transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Nova Paróquia
                        </button>
                      </div>

                      {showParoquiaForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-white p-6 rounded-2xl border border-liturgy-100 shadow-md space-y-4"
                        >
                          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                            {editingParoquia
                              ? "Editar Paróquia"
                              : "Cadastrar Nova Paróquia"}
                          </h3>
                          <form
                            onSubmit={handleSaveParoquia}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Nome da Paróquia
                              </label>
                              <input
                                type="text"
                                required
                                value={paroquiaFormData.nome}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    nome: toTitleCase(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="Ex: Paróquia Santa Rita"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                CNPJ
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.cnpj}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    cnpj: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="00.000.000/0000-00"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Coordenador Geral
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.coordenador}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    coordenador: toTitleCase(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="Nome do coordenador"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Telefone Coordenador
                              </label>
                              <input
                                type="tel"
                                value={paroquiaFormData.telefoneCoordenador}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    telefoneCoordenador: formatPhone(
                                      e.target.value,
                                    ),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Cidade
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.cidade}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    cidade: toTitleCase(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="Cidade"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Estado (UF)
                              </label>
                              <select
                                value={paroquiaFormData.estado}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    estado: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none appearance-none"
                              >
                                <option value="">Selecione</option>
                                {BRAZILIAN_STATES.map((uf) => (
                                  <option key={uf} value={uf}>
                                    {uf}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                  Endereço
                                </label>
                                <input
                                  type="text"
                                  value={paroquiaFormData.endereco}
                                  onChange={(e) =>
                                    setParoquiaFormData({
                                      ...paroquiaFormData,
                                      endereco: toTitleCase(e.target.value),
                                    })
                                  }
                                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                  placeholder="Rua, Avenida, etc"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  value={paroquiaFormData.numero}
                                  onChange={(e) =>
                                    setParoquiaFormData({
                                      ...paroquiaFormData,
                                      numero: e.target.value,
                                    })
                                  }
                                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                  placeholder="Nº"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Bairro
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.bairro}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    bairro: toTitleCase(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="Bairro"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                CEP
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.cep}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    cep: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="00000-000"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Nome do Padre
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.padre}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    padre: toTitleCase(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="Nome do pároco"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Telefone Paróquia 1
                              </label>
                              <input
                                type="tel"
                                value={paroquiaFormData.telefone1}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    telefone1: formatPhone(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="(00) 0000-0000"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Telefone Paróquia 2
                              </label>
                              <input
                                type="tel"
                                value={paroquiaFormData.telefone2}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    telefone2: formatPhone(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="(00) 0000-0000"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                E-mail da Paróquia
                              </label>
                              <input
                                type="email"
                                value={paroquiaFormData.email}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="paroquia@email.com"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">
                                Site / Redes Sociais
                              </label>
                              <input
                                type="text"
                                value={paroquiaFormData.site}
                                onChange={(e) =>
                                  setParoquiaFormData({
                                    ...paroquiaFormData,
                                    site: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none"
                                placeholder="www.paroquia.com.br"
                              />
                            </div>
                            <div className="md:col-span-2 flex gap-3 pt-2">
                              <button
                                type="submit"
                                className="flex-1 bg-liturgy-600 text-black py-2.5 rounded-xl font-bold hover:bg-liturgy-700 transition-all"
                              >
                                {editingParoquia
                                  ? "Salvar Alterações"
                                  : "Cadastrar Paróquia"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowParoquiaForm(false)}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}

                      {!showParoquiaForm && paroquias.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center mb-6">
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                            <MapPin className="w-5 h-5 text-liturgy-500" />
                            Filtrar por Localidade:
                          </div>
                          <div className="flex-1 flex gap-3 w-full sm:w-auto">
                            <select
                              value={filterEstado}
                              onChange={(e) => {
                                setFilterEstado(e.target.value);
                                setFilterCidade(""); // Reset city when state changes
                              }}
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                            >
                              <option value="">Todos os Estados</option>
                              {Array.isArray(paroquias) &&
                                Array.from(
                                  new Set(
                                    paroquias
                                      .map((p) => p.estado)
                                      .filter(Boolean),
                                  ),
                                )
                                  .sort()
                                  .map((estado) => (
                                    <option key={estado} value={estado}>
                                      {estado}
                                    </option>
                                  ))}
                            </select>
                            <select
                              value={filterCidade}
                              onChange={(e) => setFilterCidade(e.target.value)}
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                              disabled={
                                !filterEstado &&
                                (!Array.isArray(paroquias) ||
                                  Array.from(
                                    new Set(
                                      paroquias
                                        .map((p) => p.cidade)
                                        .filter(Boolean),
                                    ),
                                  ).length === 0)
                              }
                            >
                              <option value="">Todas as Cidades</option>
                              {Array.from(
                                new Set(
                                  paroquias
                                    .filter(
                                      (p) =>
                                        !filterEstado ||
                                        p.estado === filterEstado,
                                    )
                                    .map((p) => p.cidade)
                                    .filter(Boolean),
                                ),
                              )
                                .sort()
                                .map((cidade) => (
                                  <option key={cidade} value={cidade}>
                                    {cidade}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {paroquias.filter((p) => {
                          if (filterEstado && p.estado !== filterEstado)
                            return false;
                          if (filterCidade && p.cidade !== filterCidade)
                            return false;
                          return true;
                        }).length === 0 ? (
                          <div className="md:col-span-2 text-center py-12 bg-white rounded-3xl border border-slate-100">
                            <Church className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 italic">
                              Nenhuma paróquia encontrada.
                            </p>
                          </div>
                        ) : (
                          paroquias
                            .filter((p) => {
                              if (filterEstado && p.estado !== filterEstado)
                                return false;
                              if (filterCidade && p.cidade !== filterCidade)
                                return false;
                              return true;
                            })
                            .map((p) => (
                              <div
                                key={p.id}
                                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Church className="w-6 h-6" />
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">
                                          {p.nome}
                                        </h3>
                                        {p.cnpj && (
                                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                            CNPJ: {p.cnpj}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="h-px bg-slate-100" />

                                  <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-600">
                                    {p.padre && (
                                      <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <span><strong>Sacerdote:</strong> {p.padre}</span>
                                      </div>
                                    )}
                                    {p.coordenador && (
                                      <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        <span>
                                          <strong>Coordenador:</strong> {p.coordenador}{" "}
                                          {p.telefoneCoordenador && `(${p.telefoneCoordenador})`}
                                        </span>
                                      </div>
                                    )}
                                    {(p.endereco || p.cidade) && (
                                      <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">
                                          <strong>Endereço:</strong> {[
                                            p.endereco && `${p.endereco}${p.numero ? `, ${p.numero}` : ""}`,
                                            p.bairro,
                                            p.cidade && `${p.cidade}${p.estado ? ` - ${p.estado}` : ""}`,
                                            p.cep
                                          ].filter(Boolean).join(", ")}
                                        </span>
                                      </div>
                                    )}
                                    {(p.telefone1 || p.telefone2 || p.email || p.site) && (
                                      <div className="pt-2 border-t border-slate-50 mt-1 space-y-1 text-[11px] text-slate-500">
                                        {p.email && <div className="truncate"><strong>E-mail:</strong> {p.email}</div>}
                                        {p.site && <div className="truncate"><strong>Site:</strong> {p.site}</div>}
                                        {(p.telefone1 || p.telefone2) && (
                                          <div>
                                            <strong>Contato:</strong> {[p.telefone1, p.telefone2].filter(Boolean).join(" / ")}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                  <button
                                    onClick={() => setSelectedParoquiaForMinisters(p)}
                                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    Ver Ministros
                                  </button>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingParoquia(p);
                                        setParoquiaFormData({
                                          nome: p.nome || "",
                                          cnpj: p.cnpj || "",
                                          coordenador: p.coordenador || "",
                                          telefoneCoordenador: p.telefoneCoordenador || "",
                                          endereco: p.endereco || "",
                                          numero: p.numero || "",
                                          bairro: p.bairro || "",
                                          cidade: p.cidade || "",
                                          estado: p.estado || "",
                                          cep: p.cep || "",
                                          padre: p.padre || "",
                                          telefone1: p.telefone1 || "",
                                          telefone2: p.telefone2 || "",
                                          email: p.email || "",
                                          site: p.site || "",
                                          bloqueada: p.bloqueada || false,
                                        });
                                        setShowParoquiaForm(true);
                                      }}
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                      title="Editar Paróquia"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteParoquia(p.id)}
                                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                      title="Excluir Paróquia"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Edição de Coordenador */}
      {editingCoordinator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Editar Coordenador
                </h3>
                <p className="text-xs text-slate-500">
                  Modifique os dados de cadastro e paróquia do coordenador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoordinator(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoordinator} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Titular */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorFormData.nome}
                    onChange={(e) =>
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        nome: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                    placeholder="Nome do coordenador"
                  />
                </div>

                {/* Nome de Exibição */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nome de Exibição (Crachá)
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorFormData.nomeExibicao}
                    onChange={(e) =>
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        nomeExibicao: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                    placeholder="Nome no crachá"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Telefone
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorFormData.telefone}
                    onChange={(e) =>
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        telefone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                    placeholder="Telefone"
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Senha de Acesso (3 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorFormData.senha}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        senha: val,
                      });
                    }}
                    maxLength={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800 font-mono"
                    placeholder="Ex: 123"
                  />
                </div>

                {/* Paróquia */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Paróquia Associada
                  </label>
                  <select
                    value={coordinatorFormData.paroquia}
                    onChange={(e) =>
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        paroquia: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800 font-semibold"
                  >
                    <option value="">Nenhuma Paróquia</option>
                    {paroquias.map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Cadastro */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Tipo de Cadastro
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCoordinatorFormData({
                          ...coordinatorFormData,
                          tipo: "individual",
                        })
                      }
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        coordinatorFormData.tipo === "individual"
                          ? "border-liturgy-500 bg-liturgy-50/20 text-slate-900"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-55"
                      }`}
                    >
                      Coordenador Individual
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCoordinatorFormData({
                          ...coordinatorFormData,
                          tipo: "casal",
                        })
                      }
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        coordinatorFormData.tipo === "casal"
                          ? "border-liturgy-500 bg-liturgy-50/20 text-slate-900"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-55"
                      }`}
                    >
                      Coordenador Casal
                    </button>
                  </div>
                </div>
              </div>

              {/* Campos do Cônjuge (Se Casal) */}
              {coordinatorFormData.tipo === "casal" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    💑 Informações do Cônjuge
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome Completo Cônjuge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Nome Completo do Cônjuge
                      </label>
                      <input
                        type="text"
                        required={coordinatorFormData.tipo === "casal"}
                        value={coordinatorFormData.nomeConjuge}
                        onChange={(e) =>
                          setCoordinatorFormData({
                            ...coordinatorFormData,
                            nomeConjuge: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                        placeholder="Nome do cônjuge"
                      />
                    </div>

                    {/* Nome de Exibição Cônjuge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Nome de Exibição do Cônjuge
                      </label>
                      <input
                        type="text"
                        required={coordinatorFormData.tipo === "casal"}
                        value={coordinatorFormData.nomeExibicaoConjuge}
                        onChange={(e) =>
                          setCoordinatorFormData({
                            ...coordinatorFormData,
                            nomeExibicaoConjuge: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                        placeholder="Nome no crachá do cônjuge"
                      />
                    </div>

                    {/* Telefone Cônjuge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Telefone do Cônjuge
                      </label>
                      <input
                        type="text"
                        value={coordinatorFormData.telefoneConjuge}
                        onChange={(e) =>
                          setCoordinatorFormData({
                            ...coordinatorFormData,
                            telefoneConjuge: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800"
                        placeholder="Telefone cônjuge"
                      />
                    </div>

                    {/* Senha Cônjuge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Senha de Acesso Cônjuge (3 dígitos)
                      </label>
                      <input
                        type="text"
                        value={coordinatorFormData.senhaConjuge}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                          setCoordinatorFormData({
                            ...coordinatorFormData,
                            senhaConjuge: val,
                          });
                        }}
                        maxLength={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800 font-mono"
                        placeholder="Ex: 456"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoordinator(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-black bg-liturgy-600 hover:bg-liturgy-700 rounded-xl transition-all shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3"
        >
          <div className="w-2 h-2 bg-liturgy-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold tracking-tight">{message}</span>
        </motion.div>
      )}
    </div>
  );
}

function LoginView({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'cadastro'
  const liturgyTheme = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const color = getLiturgicalThemeDynamic(today);
    switch (color) {
      case "red":
        return "rose";
      case "purple":
        return "purple";
      case "white":
        return "white";
      case "green":
        return "emerald";
      default:
        return "indigo";
    }
  }, []);

  // Login state
  const [localNome, setLocalNome] = useState("");
  const [localTelefone, setLocalTelefone] = useState("");
  const [loginEstado, setLoginEstado] = useState("");
  const [loginCidade, setLoginCidade] = useState("");
  const [loginParoquia, setLoginParoquia] = useState("");
  const [isCasal, setIsCasal] = useState(false);
  const [isCoordenador, setIsCoordenador] = useState(false);
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // Cadastro state
  const [cadIsCasal, setCadIsCasal] = useState(false);
  const [cadNome, setCadNome] = useState("");
  const [cadTelefone, setCadTelefone] = useState("");
  const [cadDataNascimento, setCadDataNascimento] = useState("");
  const [cadNomeConjuge, setCadNomeConjuge] = useState("");
  const [cadTelefoneConjuge, setCadTelefoneConjuge] = useState("");
  const [cadDataNascimentoConjuge, setCadDataNascimentoConjuge] = useState("");
  const [cadEstado, setCadEstado] = useState("");
  const [cadCidade, setCadCidade] = useState("");
  const [cadParoquia, setCadParoquia] = useState("");
  const [cadRole, setCadRole] = useState("ministro");
  const [cadSenha, setCadSenha] = useState("");
  const [cadMessage, setCadMessage] = useState("");
  const [paroquias, setParoquias] = useState([]);

  useEffect(() => {
    const fetchParoquias = async () => {
      try {
        const res = await fetch("/api/paroquias");
        const data = await res.json();
        if (Array.isArray(data)) setParoquias(data);
        else setParoquias([]);
        if (data.length > 0) {
          setCadParoquia(data[0].nome);
        }
      } catch (err) {
        console.error("Erro ao buscar paróquias:", err);
      }
    };
    fetchParoquias();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    // Limpa os campos de nome, telefone e senha antes de tentar o login
    const trimmedLocalNome = localNome.trim();
    const trimmedLocalTelefone = localTelefone.trim();
    const trimmedSenha = senha.trim();

    // Admin login check
    if (trimmedLocalNome.toLowerCase() === "admin") {
      try {
        console.log("Admin login attempt:", {
          name: trimmedLocalNome,
          senha: trimmedSenha,
        });
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha: trimmedSenha }),
        });
        const data = await response.json();
        console.log("Admin login response:", { ok: response.ok, data });
        if (response.ok) {
          onLogin({
            nome: "Admin",
            telefone: "000000000",
            tipo: "individual",
            role: "admin",
          });
          return;
        } else {
          setError(data.error || "Senha de administrador incorreta.");
          return;
        }
      } catch (err) {
        console.error("Erro ao conectar ao servidor (Admin):", err);
        setError("Erro de conexão com o servidor.");
        return;
      }
    }

    if (!trimmedLocalNome && trimmedLocalNome.toLowerCase() !== "admin") {
      setError("Por favor, digite seu nome.");
      return;
    }

    if (!trimmedLocalTelefone && trimmedLocalNome.toLowerCase() !== "admin") {
      setError("Por favor, digite seu telefone.");
      return;
    }

    if (!loginParoquia && trimmedLocalNome.toLowerCase() !== "admin") {
      setError("Por favor, selecione sua paróquia.");
      return;
    }

    const phoneDigits = trimmedLocalTelefone.replace(/\D/g, "");
    if (
      phoneDigits.length !== 11 &&
      trimmedLocalNome.toLowerCase() !== "admin"
    ) {
      setError(
        "O telefone deve conter exatamente 11 números (DDD + 9 dígitos).",
      );
      return;
    }

    if (
      trimmedSenha.length !== 3 &&
      !isCoordenador &&
      trimmedLocalNome.toLowerCase() !== "admin"
    ) {
      setError("A senha deve ter exatamente 3 números.");
      return;
    }

    try {
      console.log("Regular user login attempt:", {
        nome: trimmedLocalNome,
        telefone: trimmedLocalTelefone,
        senha: trimmedSenha,
        paroquia: loginParoquia,
      });
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: trimmedLocalNome,
          telefone: trimmedLocalTelefone,
          senha: trimmedSenha,
          paroquia: loginParoquia,
        }),
      });

      const data = await response.json();
      console.log("Regular user login response:", {
        ok: response.ok,
        data,
        error: data.error,
      });

      if (response.ok) {
        const u = data.user;
        onLogin(u, !!data.reset);
      } else {
        setError(data.error || "Erro ao realizar login.");
      }
    } catch (err) {
      console.error("Erro no login (Usuário):", err);
      setError("Erro de conexão com o servidor.");
    }
  };

  const handleForgotPassword = async () => {
    if (!localTelefone.trim()) {
      setError("Digite seu telefone para recuperar a senha.");
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: localTelefone }),
      });

      const data = await response.json();
      if (response.ok) {
        setResetMessage(
          `Sua nova senha provisória é: ${data.newPassword}. Anote-a!`,
        );
        setError("");
      } else {
        setError(data.error || "Erro ao resetar senha.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    }
  };

  const handleCadastroSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCadMessage("");

    if (
      !cadNome.trim() ||
      !cadTelefone.trim() ||
      !cadDataNascimento ||
      !cadSenha ||
      !cadParoquia
    ) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const phoneDigits = cadTelefone.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      setError(
        "O telefone deve conter exatamente 11 números (DDD + 9 dígitos).",
      );
      return;
    }

    if (cadSenha.length !== 3) {
      setError("A senha deve ter exatamente 3 números.");
      return;
    }

    if (cadIsCasal) {
      if (
        !cadNomeConjuge.trim() ||
        !cadTelefoneConjuge.trim() ||
        !cadDataNascimentoConjuge
      ) {
        setError("Por favor, preencha todos os dados do cônjuge.");
        return;
      }
      const conjugePhoneDigits = cadTelefoneConjuge.replace(/\D/g, "");
      if (conjugePhoneDigits.length !== 11) {
        setError(
          "O telefone do cônjuge deve conter exatamente 11 números (DDD + 9 dígitos).",
        );
        return;
      }
    }

    try {
      const response = await fetch("/api/ministros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: cadNome,
          telefone: cadTelefone,
          dataNascimento: cadDataNascimento,
          nomeConjuge: cadNomeConjuge,
          dataNascimentoConjuge: cadDataNascimentoConjuge,
          telefoneConjuge: cadTelefoneConjuge,
          paroquia: cadParoquia,
          senha: cadSenha,
          role: cadRole,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const mensagemSucesso =
          cadRole === "coordenacao"
            ? "Cadastro realizado com sucesso! Aguarde a liberação do Administrador."
            : "Cadastro realizado com sucesso! Aguarde a aprovação da Coordenação.";

        setCadMessage(mensagemSucesso);
        setTimeout(() => {
          setActiveTab("login");
          setLocalNome("");
          setLocalTelefone("");
          setSenha("");
          setCadNome("");
          setCadTelefone("");
          setCadDataNascimento("");
          setCadNomeConjuge("");
          setCadTelefoneConjuge("");
          setCadDataNascimentoConjuge("");
          setCadParoquia(paroquias.length > 0 ? paroquias[0].nome : "");
          setCadSenha("");
          setCadRole("ministro");
          setCadIsCasal(false);
          setIsCasal(false);
          setIsCoordenador(false);
          setCadMessage("");
        }, 3000);
      } else {
        setError(data.error || "Erro ao realizar cadastro.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    }
  };

  return (
    <div
      className={`theme-${liturgyTheme} bg-slate-50 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Portal do Mece
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Identifique-se para acessar a escala
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            onClick={() => {
              setActiveTab("login");
              setError("");
              setCadMessage("");
              setResetMessage("");
              setLocalNome("");
              setLocalTelefone("");
              setSenha("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "login" ? "bg-red-100 text-red-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab("cadastro");
              setError("");
              setCadMessage("");
              setResetMessage("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "cadastro" ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Novo Cadastro
          </button>
          <button
            onClick={() => {
              setActiveTab("suporte");
              setError("");
              setCadMessage("");
              setResetMessage("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "suporte" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Suporte
          </button>
        </div>

        {activeTab === "suporte" ? (
          <div className="text-center py-6 px-4 text-slate-700">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Adquirir Sistema ou Suporte
            </h2>
            <div className="space-y-4 text-sm text-slate-600">
              <p>Gostou do aplicativo e deseja adquirir? 😊</p>
              <p>
                Ele possui um valor de aquisição e mensalidade. Para mais
                informações, entre em contato pelo e-mail{" "}
                <strong>portaldomece@gmail.com</strong>.
              </p>
              <p>Ficaremos muito felizes em atendê-lo!</p>
            </div>
            <p className="text-xs text-slate-400 mt-8">
              © 2026 ABF. Todos os direitos reservados.
            </p>
          </div>
        ) : activeTab === "login" ? (
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            {resetMessage && (
              <div className="p-4 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm">
                {resetMessage}
              </div>
            )}

            {resetError && (
              <div className="p-4 mb-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                {resetError}
              </div>
            )}

            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Como quer ser chamado (na escala)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={localNome}
                  onChange={(e) => setLocalNome(toTitleCase(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="Seu nome de exibição"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Telefone (DDD + 9 números)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={localTelefone}
                  onChange={(e) =>
                    setLocalTelefone(formatPhone(e.target.value))
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="(14) 99999-9999"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer mb-0">
                <input
                  type="checkbox"
                  checked={isCasal}
                  onChange={(e) => {
                    setIsCasal(e.target.checked);
                    if (e.target.checked) setIsCoordenador(false);
                  }}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300"
                />
                <span className="text-slate-700 font-medium">Ministros</span>
              </label>

              <div className="border-t border-slate-200 my-2"></div>

              <label className="flex items-center gap-3 cursor-pointer mb-0">
                <input
                  type="checkbox"
                  checked={isCoordenador}
                  onChange={(e) => {
                    setIsCoordenador(e.target.checked);
                    if (e.target.checked) setIsCasal(false);
                  }}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300"
                />
                <span className="text-slate-700 font-medium">Coordenação</span>
              </label>
            </div>

            {localNome.toLowerCase() !== "admin" && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-2">
                  <MapPin className="w-4 h-4 text-liturgy-500" />
                  Localização da Paróquia
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Estado
                    </label>
                    <select
                      value={loginEstado}
                      onChange={(e) => {
                        setLoginEstado(e.target.value);
                        setLoginCidade("");
                        setLoginParoquia("");
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                    >
                      <option value="">Selecione...</option>
                      {Array.isArray(paroquias) &&
                        Array.from(
                          new Set(
                            paroquias.map((p) => p.estado).filter(Boolean),
                          ),
                        )
                          .sort()
                          .map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Cidade
                    </label>
                    <select
                      value={loginCidade}
                      onChange={(e) => {
                        setLoginCidade(e.target.value);
                        setLoginParoquia("");
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                      disabled={!loginEstado}
                    >
                      <option value="">Selecione...</option>
                      {Array.from(
                        new Set(
                          paroquias
                            .filter((p) => p.estado === loginEstado)
                            .map((p) => p.cidade)
                            .filter(Boolean),
                        ),
                      )
                        .sort()
                        .map((cidade) => (
                          <option key={cidade} value={cidade}>
                            {cidade}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Paróquia
                  </label>
                  <select
                    value={loginParoquia}
                    onChange={(e) => setLoginParoquia(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                    disabled={!loginCidade}
                  >
                    <option value="">Selecione sua paróquia...</option>
                    {paroquias
                      .filter(
                        (p) =>
                          p.estado === loginEstado && p.cidade === loginCidade,
                      )
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((p) => (
                        <option key={p.id} value={p.nome}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  maxLength={localNome.toLowerCase() === "admin" ? 15 : 3}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder={
                    localNome.toLowerCase() === "admin"
                      ? "8-15 caracteres"
                      : "3 números"
                  }
                  autoComplete="new-password"
                />
              </div>
            </div>

            {resetMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm text-center font-medium">
                {resetMessage}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition duration-300 font-semibold shadow-sm shadow-red-200 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-center text-sm text-slate-500 hover:text-red-600 transition-colors mt-4"
            >
              Esqueceu a senha?
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastroSubmit} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="tipoCadastro"
                  checked={!cadIsCasal}
                  onChange={() => setCadIsCasal(false)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-slate-700 font-medium text-sm">
                  Individual
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="tipoCadastro"
                  checked={cadIsCasal}
                  onChange={() => setCadIsCasal(true)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-slate-700 font-medium text-sm">
                  Casal
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Perfil de Acesso
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cadRole"
                      checked={cadRole === "ministro"}
                      onChange={() => setCadRole("ministro")}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="text-slate-700 text-sm">Ministro</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cadRole"
                      checked={cadRole === "coordenacao"}
                      onChange={() => setCadRole("coordenacao")}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="text-slate-700 text-sm">Coordenação</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Seus Dados
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Nome
                </label>
                <input
                  type="text"
                  value={cadNome}
                  onChange={(e) => setCadNome(toTitleCase(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Telefone (DDD + 9 números)
                  </label>
                  <input
                    type="tel"
                    value={cadTelefone}
                    onChange={(e) =>
                      setCadTelefone(formatPhone(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                    placeholder="(14) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Data Nasc.
                  </label>
                  <input
                    type="text"
                    value={cadDataNascimento}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 4) v = v.slice(0, 4);
                      if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                      setCadDataNascimento(v);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                    placeholder="DD/MM"
                    pattern="\d{2}/\d{2}"
                    title="Formato DD/MM (ex: 25/03)"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {cadIsCasal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-2"
              >
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Dados do Cônjuge
                </h3>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Nome do Cônjuge
                  </label>
                  <input
                    type="text"
                    value={cadNomeConjuge}
                    onChange={(e) =>
                      setCadNomeConjuge(toTitleCase(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                    placeholder="Nome completo do cônjuge"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Telefone (Cônjuge)
                    </label>
                    <input
                      type="tel"
                      value={cadTelefoneConjuge}
                      onChange={(e) =>
                        setCadTelefoneConjuge(formatPhone(e.target.value))
                      }
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                      placeholder="(14) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Data Nasc. (Cônjuge)
                    </label>
                    <input
                      type="text"
                      value={cadDataNascimentoConjuge}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setCadDataNascimentoConjuge(v);
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                      placeholder="DD/MM"
                      pattern="\d{2}/\d{2}"
                      title="Formato DD/MM (ex: 25/03)"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-2">
                <MapPin className="w-4 h-4 text-liturgy-500" />
                Localização da Paróquia
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Estado
                  </label>
                  <select
                    value={cadEstado}
                    onChange={(e) => {
                      setCadEstado(e.target.value);
                      setCadCidade("");
                      setCadParoquia("");
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {Array.isArray(paroquias) &&
                      Array.from(
                        new Set(paroquias.map((p) => p.estado).filter(Boolean)),
                      )
                        .sort()
                        .map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cidade
                  </label>
                  <select
                    value={cadCidade}
                    onChange={(e) => {
                      setCadCidade(e.target.value);
                      setCadParoquia("");
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                    disabled={!cadEstado}
                  >
                    <option value="">Selecione...</option>
                    {Array.from(
                      new Set(
                        paroquias
                          .filter((p) => p.estado === cadEstado)
                          .map((p) => p.cidade)
                          .filter(Boolean),
                      ),
                    )
                      .sort()
                      .map((cidade) => (
                        <option key={cidade} value={cidade}>
                          {cidade}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Paróquia
                </label>
                <select
                  value={cadParoquia}
                  onChange={(e) => setCadParoquia(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm font-medium text-slate-700"
                  disabled={!cadCidade}
                >
                  <option value="">Selecione sua paróquia...</option>
                  {paroquias
                    .filter(
                      (p) => p.estado === cadEstado && p.cidade === cadCidade,
                    )
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-slate-700">
                Criar Senha (3 números)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={cadSenha}
                  onChange={(e) => setCadSenha(e.target.value)}
                  maxLength={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="Ex: 123"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {cadMessage && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm text-center">
                {cadMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-900 transition duration-300 font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Cadastrar
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function EscalaView({
  escala,
  user,
  voltar,
  onCustomConfirm,
  setDownloadOptionMode,
  handleToggleEscala,
  escalaPublicadaPorMes,
  escalaPublicadaGlobal,
  isCoordenador,
}) {
  const normalize = useCallback((s: any) => {
    if (typeof s !== "string") return "";
    return s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " e ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const allUserNames = useMemo(() => {
    const normalizedUserNames = [
      user.nome,
      user.nomeExibicao,
      user.nomeConjuge,
      user.nomeExibicaoConjuge,
    ]
      .filter(Boolean)
      .map(normalize);

    return [...new Set(normalizedUserNames)];
  }, [user, normalize]);

  const hasEscala =
    escala &&
    Object.keys(escala).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).length > 0;
  
  console.log('[DEBUG EscalaView] hasEscala:', hasEscala, 'isCoordenador:', isCoordenador, 'escala keys:', escala ? Object.keys(escala).slice(0, 5) : []);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const currentMonthStr = format(new Date(), "yyyy-MM");
  // Change prevMonthStr to currentMonthStr to exclude the previous month once the new month starts.
  const prevMonthStr = format(new Date(), "yyyy-MM");
  const months = hasEscala
    ? Object.keys(escala)
        .reduce((acc, date) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return acc;
          const month = date.substring(0, 7);
          
          // Changed: Always exclude previous months regardless of user role.
          if (month < currentMonthStr) {
              console.log(`[DEBUG EscalaView] Month ${month} < ${currentMonthStr}, excluding.`);
              return acc;
          }

          // STRICT FILTER for general viewing: only show published months for ministers.
          // Coordinators should see draft months in the main Dashboard too to verify their work.
          // Fallback to global escalaPublicada if no specific month configuration exists
          const explicitMonthPublic = escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined ? escalaPublicadaPorMes[month] : null;
          const isMonthPublic = explicitMonthPublic === true || (explicitMonthPublic === null && escalaPublicadaGlobal === true) || month === currentMonthStr;
          
          if (!isMonthPublic) return acc;

          if (!acc.includes(month)) acc.push(month);
          return acc;
        }, [] as string[])
        .sort()
    : [];

  useEffect(() => {
    // Debug log to help identify why a month might be appearing
    if (user.role === 'coordenacao') {
      console.log(`[DEBUG EscalaView] Months found:`, months);
      console.log(`[DEBUG EscalaView] scalePublishedMap:`, escalaPublicadaPorMes);
    }
    
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }
  }, [months, selectedMonth, escalaPublicadaPorMes, user.role]);

  const handleDownloadPDF = () => {
    const currentMonthStr = format(new Date(), "yyyy-MM");
    const monthsInEscala = Object.keys(escala)
      .reduce((acc, date) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return acc;
        const month = date.substring(0, 7);
        // Do not force hiding past months in PDF, use the same logic as the view!
        // if (month < currentMonthStr) return acc;
        
        // Mostrar apenas meses publicados no PDF também para todos (respeitando global flag)
        const explicitMonthPublic = escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined ? escalaPublicadaPorMes[month] : null;
        const isMonthPublic = explicitMonthPublic === true || (explicitMonthPublic === null && escalaPublicadaGlobal === true) || month === currentMonthStr;
        
        if (!isMonthPublic && !isCoordenador) return acc;
        
        if (!acc.includes(month)) acc.push(month);
        return acc;
      }, [] as string[])
      .sort();

    if (monthsInEscala.length > 1) {
      const m1 = monthsInEscala[0];
      const m2 = monthsInEscala[1];
      const m1Label = format(new Date(m1 + "-01T00:00:00"), "MMMM", {
        locale: ptBR,
      });
      const m2Label = format(new Date(m2 + "-01T00:00:00"), "MMMM", {
        locale: ptBR,
      });

      onCustomConfirm(
        `Qual escala deseja baixar?`,
        () => {
          const filtered = Object.keys(escala || {}).reduce((acc: any, k: string) => {
            if (k.startsWith(m2) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
              acc[k] = (escala || {})[k];
            return acc;
          }, {} as any);
          setDownloadOptionMode({ aberta: true, escala: filtered });
        },
        m2Label.charAt(0).toUpperCase() + m2Label.slice(1),
        undefined,
        m1Label.charAt(0).toUpperCase() + m1Label.slice(1),
        () => {
          const filtered = Object.keys(escala || {}).reduce((acc: any, k: string) => {
            if (k.startsWith(m1) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
              acc[k] = (escala || {})[k];
            return acc;
          }, {} as any);
          setDownloadOptionMode({ aberta: true, escala: filtered });
        },
      );
    } else {
      setDownloadOptionMode({ aberta: true, escala: escala || {} });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Escala de Missas
          </h1>
          <div className="flex gap-2">
            {hasEscala && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </button>
            )}
            <button
              onClick={voltar}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>

        {!hasEscala ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Escala em processamento
            </h2>
            <p className="text-slate-500">
              A escala ainda não foi gerada pela coordenação. Por favor,
              aguarde.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {months.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm capitalize whitespace-nowrap transition-all ${
                      selectedMonth === month
                        ? "bg-liturgy-600 text-black shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {format(new Date(month + "-01T00:00:00"), "MMMM yyyy", {
                      locale: ptBR,
                    })}
                  </button>
                ))}
              </div>
            )}

            {selectedMonth && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 capitalize flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-liturgy-600" />
                  {format(
                    new Date(selectedMonth + "-01T00:00:00"),
                    "MMMM yyyy",
                    { locale: ptBR },
                  )}
                </h3>
                <div className="space-y-8">
                  {Object.keys(escala)
                    .filter(
                      (date) =>
                        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                        date.startsWith(selectedMonth),
                    )
                    .sort()
                    .map((data) => (
                      <div key={data} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {format(
                              new Date(data + "T00:00:00"),
                              "EEEE, d 'de' MMMM",
                              { locale: ptBR },
                            )}
                          </h4>
                          <div className="h-px bg-slate-100 w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(escala[data] || {})
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([horario, missa]: [string, any]) => {
                              const isDomingo =
                                format(new Date(data + "T00:00:00"), "EEEE", {
                                  locale: ptBR,
                                }).toLowerCase() === "domingo";
                              return (
                                <div
                                  key={horario}
                                  className={`relative overflow-hidden p-6 rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1 ${isDomingo ? "bg-white border-red-200 shadow-red-50" : "bg-white border-slate-200 shadow-slate-100"}`}
                                >
                                  {isDomingo && (
                                    <div className="absolute top-0 right-0 p-2 opacity-5">
                                      <Heart className="w-12 h-12 text-red-600" />
                                    </div>
                                  )}
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <span
                                        className={`text-lg font-black block leading-none ${isDomingo ? "text-red-600" : "text-slate-900"}`}
                                      >
                                        {horario}
                                      </span>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
                                        Horário
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${isDomingo ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}
                                    >
                                      {missa.nome || "Missa"}
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {(Array.isArray(missa)
                                      ? missa
                                      : missa?.ministros || []
                                    ).map((m, idx) => {
                                      const normalizedM = normalize(m);
                                      const isMe = allUserNames.some(
                                        (userName) => {
                                          if (normalizedM === userName)
                                            return true;
                                          const mParts = normalizedM
                                            .split(" e ")
                                            .map((p) => p.trim())
                                            .filter(Boolean);
                                          return mParts.some((mp) =>
                                            allUserNames.includes(mp),
                                          );
                                        },
                                      );

                                      return (
                                        <div
                                          key={idx}
                                          className={`p-3 rounded-2xl flex items-center gap-3 transition-colors ${isMe ? "bg-liturgy-600 text-black shadow-lg shadow-liturgy-100" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                                        >
                                          <div
                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${isMe ? "bg-black animate-pulse" : isDomingo ? "bg-red-400" : "bg-liturgy-400"}`}
                                          />
                                          <span
                                            className={`text-xs font-bold ${isMe ? "text-black" : "text-slate-700"}`}
                                          >
                                            {m}
                                          </span>
                                          {isMe && (
                                            <div className="ml-auto bg-black/20 p-1 rounded-lg">
                                              <UserCheck className="w-3 h-3 text-black" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Cruz Customizado
const CrossIcon = ({ className }) => (
  <span
    className={`flex items-center justify-center font-serif font-bold text-2xl leading-none ${className}`}
    style={{ marginTop: "-4px" }}
  >
    ✝
  </span>
);

// Componente de Confirmação Customizado
const AvisoModal = ({ show, title, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-slate-100"
      >
        <div className="flex items-center gap-3 mb-6 text-amber-600">
          <div className="bg-amber-100 p-2.5 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 max-h-[400px] overflow-y-auto">
          <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmModal = ({
  show,
  message,
  subMessage,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}) => {
  if (!show) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20"
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            Confirmação
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed px-2 text-sm">
            {message}
          </p>
          {subMessage && (
            <p className="mt-4 text-rose-600 font-bold leading-relaxed px-4 text-[10px] uppercase tracking-wider bg-rose-50 py-2 rounded-xl border border-rose-100">
              {subMessage}
            </p>
          )}
        </div>
        <div className="p-6 bg-slate-50/80 flex gap-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 text-center"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 text-center"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};

export default function App() {
  const [downloadOptionMode, setDownloadOptionMode] = useState<{
    aberta: boolean;
    escala: any;
  } | null>(null);
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao processar usuário salvo:", e);
      sessionStorage.removeItem("user");
      return null;
    }
  });
  const isCoordenador = useMemo(() => {
    if (!user?.role) return false;
    const role = user.role.toLowerCase().trim();
    return (
      role === "coordenacao" ||
      role === "admin" ||
      role === "coordenador" ||
      role.includes("coordena")
    );
  }, [user]);
  const [modalAviso, setModalAviso] = useState<{
    aberta: boolean;
    titulo: string;
    mensagem: string;
  }>({ aberta: false, titulo: "", mensagem: "" });
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [escala, setEscala] = useState(null);
  const [view, setView] = useState<
    | "login"
    | "home"
    | "cadastro"
    | "admin"
    | "mensagem"
    | "escala"
    | "calendario"
    | "welcome"
    | "disponibilidade"
    | "coordenacao"
  >(() => {
    const saved = sessionStorage.getItem("user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === "admin") return "admin";
        return "coordenacao";
      } catch (e) {
        return "login";
      }
    }
    return "login";
  });
  const [mensagensRecebidas, setMensagensRecebidas] = useState<any[]>([]);
  const unreadCount = useMemo(
    () => mensagensRecebidas.filter((m) => !m.lida).length,
    [mensagensRecebidas],
  );

  const fetchMensagensRecebidas = useCallback(async () => {
    if (user && user.telefone) {
      try {
        const res = await fetch(
          `/api/mensagens?paroquia=${encodeURIComponent(user.paroquia)}&type=broadcast&telefone=${encodeURIComponent(user.telefone)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMensagensRecebidas(data);
        }
      } catch (err) {
        console.error("Erro ao buscar mensagens:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchMensagensRecebidas();
    const interval = setInterval(fetchMensagensRecebidas, 30000);
    return () => clearInterval(interval);
  }, [fetchMensagensRecebidas]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoCadastro, setTipoCadastro] = useState("individual"); // 'individual' | 'casal'
  const [nomeConjuge, setNomeConjuge] = useState("");

  // Sincronizar estados do formulário com o objeto user (importante para impersonificação)
  useEffect(() => {
    if (user) {
      setNome(user.nomeExibicao || user.nome || "");
      setTelefone(user.telefone || "");
      setTipoCadastro(user.tipo || "individual");
      setNomeConjuge(user.nomeConjuge || "");
    }
  }, [user?.id]);

  const [mensagem, setMensagem] = useState("");
  const [slotsDisponiveis, setSlotsDisponiveis] = useState([]);
  const [slotsSelecionados, setSlotsSelecionados] = useState([]);
  const [initialSlotsSelecionados, setInitialSlotsSelecionados] = useState([]);
  const [ocupacao, setOcupacao] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [disponibilidadeAberta, setDisponibilidadeAberta] = useState(false);
  const [escalaPublicada, setEscalaPublicada] = useState(false);
  const [escalaPublicadaPorMes, setEscalaPublicadaPorMes] = useState<
    Record<string, boolean>
  >({});
  const [showPreAberturaMessage, setShowPreAberturaMessage] = useState(false);
  const [mensagemDisponibilidade, setMensagemDisponibilidade] = useState<{
    texto: string;
    tipo: "info" | "warning" | "error" | "success";
  } | null>(null);
  const [manualOverride, setManualOverride] = useState<boolean | undefined>(
    undefined,
  );
  const [viewAsMinister, setViewAsMinister] = useState(false);
  const [viewAsUser, setViewAsUser] = useState<any | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const today = new Date();
    let m = today.getMonth() + 2;
    if (m > 12) m -= 12;
    return m;
  });
  const [anoSelecionado, setAnoSelecionado] = useState(() => {
    const today = new Date();
    let m = today.getMonth() + 2;
    let y = today.getFullYear();
    if (m > 12) y++;
    return y;
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title?: string;
    message: string;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const customConfirm = (
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    subMessage?: string,
    cancelText?: string,
    onCancel?: () => void,
  ) => {
    setConfirmDialog({
      show: true,
      message,
      subMessage,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      },
    });
  };

  const renderModal = () => (
    <>
      <ConfirmModal
        show={confirmDialog?.show || false}
        message={confirmDialog?.message || ""}
        subMessage={confirmDialog?.subMessage}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={confirmDialog?.onCancel || (() => setConfirmDialog(null))}
      />
      <AvisoModal
        show={modalAviso.aberta}
        title={modalAviso.titulo}
        message={modalAviso.mensagem}
        onClose={() => setModalAviso({ ...modalAviso, aberta: false })}
      />
      {downloadOptionMode?.aberta && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Printer className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                Formato de Impressão
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed px-2 text-sm">
                Escolha o formato desejado para sua escala em PDF:
              </p>
            </div>

            <div className="px-8 pb-8 space-y-3">
              <button
                onClick={() => {
                  generateEscalaPDF(downloadOptionMode.escala, user);
                  setDownloadOptionMode(null);
                }}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all group flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LayoutDashboard className="w-6 h-6 text-slate-400 group-hover:text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">
                    Tabela Paisagem
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                    Ideal para Murais
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  generateEscalaListPDF(downloadOptionMode.escala, user);
                  setDownloadOptionMode(null);
                }}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all group flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <List className="w-6 h-6 text-slate-400 group-hover:text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">
                    Lista Retrato
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                    Compacto para Celular
                  </p>
                </div>
              </button>

              <button
                onClick={() => setDownloadOptionMode(null)}
                className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );

  useEffect(() => {
    const checkDate = () => {
      const today = new Date();
      let m = today.getMonth() + 2;
      if (m > 12) m -= 12;

      let y = today.getFullYear();
      if (today.getMonth() + 2 > 12) y++;

      if (m !== mesSelecionado) setMesSelecionado(m);
      if (y !== anoSelecionado) setAnoSelecionado(y);
    };

    const interval = setInterval(checkDate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [mesSelecionado, anoSelecionado]);

  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const prevSlotsSerializedRef = useRef<string>("");

  useEffect(() => {
    const fetchConfig = async (retries = 3) => {
      if (isFetchingRef.current) return;

      // Prevent fetching too frequently unless initialSlotsSelecionados has changed
      const now = Date.now();
      const serializedSlots = JSON.stringify(initialSlotsSelecionados);
      const initialSlotsChanged = prevSlotsSerializedRef.current !== serializedSlots;
      prevSlotsSerializedRef.current = serializedSlots;

      if (!initialSlotsChanged && now - lastFetchRef.current < 5000 && retries === 3) {
        return;
      }

      isFetchingRef.current = true;
      try {
        const targetUser = viewAsUser || user;
        const url = `/api/config?paroquia=${targetUser ? encodeURIComponent(targetUser.paroquia) : ""}&t=${now}`;
        const res = await fetch(url);

        if (res.status === 429) {
          console.warn("Rate limit hit (429). Waiting longer before retry...");
          isFetchingRef.current = false;
          // Don't retry immediately if it's 429
          return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error(
            `Expected JSON but received ${contentType}. Body start: ${text.substring(0, 100)}`,
          );
          throw new Error(
            "Server returned non-JSON response (likely HTML fallback)",
          );
        }

        const config = await res.json();
        lastFetchRef.current = Date.now();
        const isNoPeriodo = checkPeriodoAgendado(config, targetUser?.paroquia);
        const manualOverrideVal =
          targetUser &&
          config.disponibilidadeAbertaPorParoquia?.[targetUser.paroquia];
        setManualOverride(manualOverrideVal);
        const isAberta =
          manualOverrideVal !== undefined
            ? manualOverrideVal
            : config.disponibilidadeAberta || isNoPeriodo;
        console.log(
          `App fetchConfig: paroquia=${targetUser?.paroquia}, manualOverride=${manualOverrideVal}, isNoPeriodo=${isNoPeriodo}, isAberta=${isAberta}`,
        );
        setDisponibilidadeAberta(isAberta);

        // Lógica de mensagens de status
        const agora = new Date();
        const agendamento =
          targetUser?.paroquia && config.agendamentoPorParoquia
            ? config.agendamentoPorParoquia[targetUser.paroquia]
            : {};
        const horaAbertura =
          agendamento?.horaAbertura || config.horaAbertura || "00:00";
        const [hA, mA] = horaAbertura.split(":").map(Number);
        const horaFechamento =
          agendamento?.horaFechamento || config.horaFechamento || "23:59";
        const [hF, mF] = horaFechamento.split(":").map(Number);
        const diaAbertura = agendamento?.diaAbertura ?? config.diaAbertura;
        const diaFechamento =
          agendamento?.diaFechamento ?? config.diaFechamento;

        // Determinar a data de fechamento efetiva para o período atual
        let dF = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          diaFechamento,
          hF,
          mF,
          59,
          999,
        );
        let dA = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          diaAbertura,
          hA,
          mA,
          0,
          0,
        );

        if (dF < dA) {
          dF.setMonth(dF.getMonth() + 1);
        }

        // Verifica se o dF correto não é o do ciclo que começou no mês anterior
        const dA_ant = new Date(dA);
        dA_ant.setMonth(dA_ant.getMonth() - 1);
        const dF_ant = new Date(dF);
        dF_ant.setMonth(dF_ant.getMonth() - 1);
        if (agora >= dA_ant && agora <= dF_ant) {
          dF = dF_ant;
        }

        const dF_date = new Date(dF);
        dF_date.setHours(0, 0, 0, 0);
        const agora_date = new Date(agora);
        agora_date.setHours(0, 0, 0, 0);

        const timeDiff = dF_date.getTime() - agora_date.getTime();
        const diffDays = Math.round(timeDiff / (1000 * 60 * 60 * 24));

        // Use precise comparison for "encerra hoje" to be really today
        if (isAberta) {
          if (initialSlotsSelecionados.length > 0) {
            setMensagemDisponibilidade({
              texto: "Sua disponibilidade foi enviada com sucesso! Aguarde a geração da escala e o próximo mês para envio.",
              tipo: "success",
            });
          } else if (diffDays === 2) {
            setMensagemDisponibilidade({
              texto:
                "A disponibilidade está aberta. Atenção: encerra em 2 dias!",
              tipo: "warning",
            });
          } else if (diffDays === 1) {
            setMensagemDisponibilidade({
              texto: "A disponibilidade está aberta. Atenção: encerra amanhã!",
              tipo: "warning",
            });
          } else if (diffDays === 0) {
            setMensagemDisponibilidade({
              texto: "A disponibilidade está aberta. Atenção: encerra hoje!",
              tipo: "error",
            });
          } else {
            setMensagemDisponibilidade({
              texto: "A disponibilidade está aberta para envio.",
              tipo: "success",
            });
          }
        } else {
          // Check if it closed recently (last 2 days)
          let dF_ant = new Date(dF);
          dF_ant.setMonth(dF_ant.getMonth() - 1);
          const diffRecent = agora.getTime() - dF_ant.getTime();
          if (diffRecent > 0 && diffRecent <= 2 * 24 * 60 * 60 * 1000) {
            setMensagemDisponibilidade({
              texto: "O período de disponibilidade foi encerrado.",
              tipo: "info",
            });
            setTimeout(
              () => setMensagemDisponibilidade(null),
              2 * 24 * 60 * 60 * 1000 - diffRecent,
            );
          } else {
            setMensagemDisponibilidade(null);
          }
        }

        const isEscalaPublicada =
          config.escalaPublicada === true ||
          (user &&
            config.escalaPublicadaPorParoquia?.[user.paroquia] === true) ||
          (user &&
            config.escalaPublicadaPorMes &&
            Object.values(config.escalaPublicadaPorMes).some(
              (v) => v === true,
            ));
        setEscalaPublicada(isEscalaPublicada);
        setEscalaPublicadaPorMes(config.escalaPublicadaPorMes || {});

        // Lógica para mensagem de pré-abertura
        // Usar as variáveis diaAbertura e horaAbertura calculadas acima que respeitam a paróquia
        if (!isAberta && diaAbertura && horaAbertura) {
          const agora = new Date();
          const [hA, mA] = horaAbertura.split(":").map(Number);
          let dataAbertura = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            diaAbertura,
            hA,
            mA,
          );

          if (agora > dataAbertura) {
            dataAbertura = new Date(
              agora.getFullYear(),
              agora.getMonth() + 1,
              diaAbertura,
              hA,
              mA,
            );
          }

          const diffTime = dataAbertura.getTime() - agora.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          setShowPreAberturaMessage(diffDays > 0 && diffDays <= 4);
        } else {
          setShowPreAberturaMessage(false);
        }
      } catch (err: any) {
        if (err.message && err.message.includes("Failed to fetch")) {
          console.warn(
            "Conexão temporariamente perdida ao buscar config. Tentando novamente...",
          );
        } else {
          console.error("Erro detalhado ao buscar config:", err);
        }

        if (retries > 0) {
          const delay = 2000 * (4 - retries); // Gradual backoff
          console.log(
            `Retrying fetchConfig in ${delay}ms... (${retries} retries left)`,
          );
          setTimeout(() => {
            isFetchingRef.current = false;
            fetchConfig(retries - 1);
          }, delay);
        } else {
          console.error("Max retries reached for fetchConfig");
          isFetchingRef.current = false;
        }
        return; // Important: don't set isFetchingRef to false here if we already scheduled a retry
      }
      isFetchingRef.current = false;
    };
    fetchConfig();
    // Re-fetch config every 60 seconds (increased from 30)
    const interval = setInterval(() => fetchConfig(3), 60000);
    return () => clearInterval(interval);
  }, [user, view, initialSlotsSelecionados]);

  useEffect(() => {
    const fetchInitialAvailability = async () => {
      const targetUser = viewAsUser || user;
      if (!targetUser) return;

      // Clear current selection when month changes to avoid mixing data
      setSlotsSelecionados([]);

      try {
        const response = await fetch(
          `/api/disponibilidade/${encodeURIComponent(targetUser.telefone)}?mes=${mesSelecionado}&ano=${anoSelecionado}`,
        );
        if (response.ok) {
          const data = await response.json();
          const ids = data.map((d) => {
            const id = normalizeId(`${d.data}-${d.horario}-${d.nomeMissa}`);
            return { id, modo: d.modo || "individual" };
          });
          setInitialSlotsSelecionados(ids);
          // Also update current selection if it's the first load for this month
          if (slotsSelecionados.length === 0) {
            setSlotsSelecionados(ids);
          }
        }
      } catch (error) {
        console.error(
          "Erro ao buscar disponibilidade inicial para o mês:",
          error,
        );
      }
    };

    fetchInitialAvailability();
  }, [mesSelecionado, anoSelecionado, user?.telefone, viewAsUser]);

  const LIMITES_VAGAS = {
    penitencial: 2,
    sagrado: 4,
    santissimo: 4,
    sabado: 6,
    domingo: 8,
  };

  const getLimiteVagas = (slot) => {
    if (slot.limiteManual) return slot.limiteManual;
    if (slot.tipo === "domingo") {
      if (slot.horario === "07:30") return 5;
      return 8; // 10:00 e 19:00
    }
    return LIMITES_VAGAS[slot.tipo] || 10;
  };

  const getChaveOcupacao = (slot: any) => {
    const norm = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    const chave = `${slot.data}-${slot.horario}-${norm(slot.nome || slot.nomeMissa || "")}`;
    if (Math.random() < 0.1) { // Log occasionally to avoid spam
      console.log(`[DEBUG /App.tsx] Chave gerada: "${chave}" (Data: ${slot.data}, Horario: ${slot.horario}, Nome: "${slot.nome || slot.nomeMissa}")`);
    }
    return chave;
  };

  const handleExcluirMensagem = async (id: number) => {
    try {
      const response = await fetch(`/api/mensagens/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setMessage("Mensagem excluída com sucesso.");
        setTimeout(() => setMessage(""), 3000);
        return true;
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Erro ao excluir mensagem.");
        return false;
      }
    } catch (err) {
      console.error("Erro ao excluir mensagem:", err);
      setMessage("Erro ao excluir mensagem.");
      return false;
    }
  };

  const handleMarcarComoLida = async (id: number) => {
    try {
      const response = await fetch(`/api/mensagens/${id}/read`, {
        method: "PATCH",
      });
      return response.ok;
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
      return false;
    }
  };

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!mensagem.trim()) return;

    try {
      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: user?.nome || nome,
          telefone: user?.telefone || telefone,
          mensagem,
          paroquia: user?.paroquia,
          type: "direct",
        }),
      });

      if (response.ok) {
        setMessage("Mensagem enviada com sucesso!");
        setMensagem("");
        fetchMensagensRecebidas();
        setTimeout(() => setView("welcome"), 2000);
      } else {
        throw new Error("Erro ao enviar mensagem.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const onLogin = async (userData, reset = false) => {
    const userRoleOrDefault = userData.role || "ministro";
    const initialUser = {
      ...userData,
      role: userRoleOrDefault,
      disponibilidadeConfirmada: userData.disponibilidadeConfirmada || false,
      excecaoAcessoAte: userData.excecaoAcessoAte || "",
    };
    setUser(initialUser);
    setNeedsPasswordReset(reset);
    sessionStorage.setItem("user", JSON.stringify(initialUser));
    setNome(userData.nome);
    setTelefone(userData.telefone);
    setTipoCadastro(userData.tipo);
    setNomeConjuge(userData.nomeConjuge);

    if (userRoleOrDefault === "admin") {
      setView("admin");
      return;
    }

    setView("coordenacao");

    // Busca dados completos do ministro e disponibilidade
    try {
      // Start of data fetching block
      // 1. Buscar dados do ministro (incluindo aniversário)
      const ministroResponse = await fetch(
        `/api/ministros/${encodeURIComponent(userData.telefone)}`,
      );
      if (ministroResponse.ok) {
        const ministroData = await ministroResponse.json();
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, ...ministroData };
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      }

      // 2. Buscar disponibilidade para o mês e ano selecionados
      const response = await fetch(
        `/api/disponibilidade/${encodeURIComponent(userData.telefone)}?mes=${mesSelecionado}&ano=${anoSelecionado}`,
      );
      if (response.ok) {
        const data = await response.json();
        const ids = data.map((d) => {
          const id = normalizeId(`${d.data}-${d.horario}-${d.nomeMissa}`);
          return { id, modo: d.modo || "individual" };
        });
        setSlotsSelecionados(ids);
        setInitialSlotsSelecionados(ids);

        if (userRoleOrDefault !== "coordenacao") {
          setView("welcome");
        }
      }

      // 3. Buscar escala (para verificar se já foi gerada e mostrar lembretes)
      const escalaResponse = await fetch(
        `/api/escala?paroquia=${encodeURIComponent(userData.paroquia)}`,
      );
      if (escalaResponse.ok) {
        const escalaData = await escalaResponse.json();
        setEscala(escalaData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados iniciais:", error);
    } // End of data fetching block
  };

  const handleSaveCadastro = async (formData) => {
    try {
      // Since CadastroView now always shows Titular first and Spouse second,
      // formData is already in the primary user's perspective.
      const payload = {
        ...formData,
        telefoneConjuge: formData.telefoneConjuge || "", // Ensure telefoneConjuge is always sent
      };

      const response = await fetch(
        `/api/ministros/${encodeURIComponent(user.telefone)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar dados.");
      }
      const data = await response.json();
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...data.ministro };
        sessionStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });

      if (data.ministro.telefone) setTelefone(data.ministro.telefone);
      if (data.ministro.nome) setNome(data.ministro.nome);
      if (data.ministro.nomeConjuge !== undefined)
        setNomeConjuge(data.ministro.nomeConjuge);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleToggleEscala = async (
    monthOrEvent?: string | React.MouseEvent,
  ) => {
    const month =
      monthOrEvent && typeof monthOrEvent === "string"
        ? monthOrEvent
        : undefined;
    const currentStatus = month
      ? escalaPublicadaPorMes[month] || false
      : escalaPublicada;
    const newState = !currentStatus;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalaPublicada: newState,
          paroquia: user?.paroquia,
          mesPublicado: month,
        }),
      });
      if (response.ok) {
        if (month) {
          setEscalaPublicadaPorMes((prev) => ({ ...prev, [month]: newState }));
          // setEscalaPublicada(false); // Removido para não esconder meses antigos
        } else {
          setEscalaPublicada(newState);
          if (!newState) {
            setEscalaPublicadaPorMes({});
          }
        }
        const label = month
          ? format(new Date(month + "-01T00:00:00"), "MMMM yyyy", {
              locale: ptBR,
            })
          : "Escala";
        setMessage(
          `${label} ${newState ? "publicada" : "recolhida"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao alterar publicação da escala:", err);
    }
  };

  const handleVerEscala = async () => {
    try {
      const isPreview = isCoordenador;
      const response = await fetch(
        `/api/escala?paroquia=${encodeURIComponent(user.paroquia)}${isPreview ? "&preview=true" : ""}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar escala.");
      }
      setEscala(data);
      setView("escala");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    setNeedsPasswordReset(false);
    setView("login");
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (user) {
          handleLogout();
        }
      }, 6 * 60 * 1000); // 6 minutes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start
    resetTimer();

    return () => {
       clearTimeout(timeoutId);
       events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const handleDownloadBackup = async () => {
    try {
      const response = await fetch("/api/admin/backup");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileName = `backup_paroquia_${new Date().toISOString().split("T")[0]}.json`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Erro ao baixar backup");
      }
    } catch (err) {
      console.error("Erro ao baixar backup:", err);
    }
  };

  const handleRestoreBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const inputTarget = event.target;

    customConfirm(
      "Deseja realmente restaurar os dados do sistema? Isso substituirá todas as informações atuais.",
      async () => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const result = e.target?.result;
            if (typeof result !== "string") return;
            const json = JSON.parse(result);
            const response = await fetch("/api/admin/restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(json),
            });

            if (response.ok) {
              setMessage("Backup restaurado com sucesso!");
              setTimeout(() => window.location.reload(), 1500);
            } else {
              const data = await response.json();
              setError(
                "Erro ao restaurar: " + (data.error || "Erro desconhecido"),
              );
            }
          } catch (err) {
            setError("Erro ao processar arquivo: " + err);
          } finally {
            inputTarget.value = "";
          }
        };
        reader.readAsText(file);
      },
    );

    inputTarget.value = "";
  };

  const fetchVagas = async () => {
    console.log("[DEBUG] fetchVagas route call: /api/vagas");
    if (!user || !user.paroquia) {
      console.log("[DEBUG] fetchVagas skipped: user or paroquia missing", {
        user,
      });
      return;
    }
    console.log(
      `[DEBUG] fetchVagas calling /api/vagas for paroquia: "${user.paroquia}", mes: ${mesSelecionado}, ano: ${anoSelecionado}`,
    );
    try {
      const response = await fetch(
        `/api/vagas?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}`,
      );
      if (response.ok) {
        const data = await response.json();
        console.log("[DEBUG] fetchVagas received data:", data);
        setOcupacao(data);
      } else {
        console.error("[DEBUG] fetchVagas error response:", response.status);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
    }
  };

  useEffect(() => {
    const targetUser = viewAsUser || user;
    const hasException = !!(
      targetUser?.excecaoAcessoAte &&
      new Date(targetUser.excecaoAcessoAte) > new Date()
    );
    const needsPolling =
      !hasException &&
      !disponibilidadeAberta &&
      targetUser?.role === "ministro" &&
      !!targetUser?.telefone;

    if (!needsPolling) return;

    const checkException = async () => {
      try {
        const res = await fetch(
          `/api/ministros/${encodeURIComponent(targetUser.telefone || "")}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.excecaoAcessoAte !== targetUser.excecaoAcessoAte) {
            if (viewAsUser) {
              setViewAsUser((prev: any) =>
                prev
                  ? { ...prev, excecaoAcessoAte: data.excecaoAcessoAte }
                  : null,
              );
            } else {
              setUser((prev) => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  excecaoAcessoAte: data.excecaoAcessoAte,
                };
                sessionStorage.setItem("user", JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar exceção:", err);
      }
    };

    const interval = setInterval(checkException, 5000);
    return () => clearInterval(interval);
  }, [
    user?.telefone,
    user?.excecaoAcessoAte,
    disponibilidadeAberta,
    user?.role,
    viewAsUser,
  ]);

  useEffect(() => {
    const targetUser = viewAsUser || user;
    console.log("[DEBUG /App.tsx] useEffect for fetchVagas triggered", {
      targetUser: !!targetUser,
      paroquia: targetUser?.paroquia,
      view,
      mesSelecionado,
      anoSelecionado
    });
    if (targetUser?.paroquia) {
      fetchVagas();

      const gerarSlotsAsync = async () => {
        const slots = await getExpectedSlots(
          targetUser.paroquia,
          mesSelecionado,
          anoSelecionado,
        );
        setSlotsDisponiveis(slots);
      };

      gerarSlotsAsync();
    }
  }, [viewAsUser, user?.paroquia, view, mesSelecionado, anoSelecionado]);

  const handleSlotChange = (slotId) => {
    const role = user?.role?.toLowerCase().trim() || "";
    const isCoordenador =
      role === "admin" ||
      role === "coordenador" ||
      role === "coordenacao" ||
      role.includes("coordena");
    const hasException = !!(
      user?.excecaoAcessoAte && new Date(user.excecaoAcessoAte) > new Date()
    );
    const hasSubmitted = (initialSlotsSelecionados || []).length > 0;
    const isLocked =
      !isCoordenador &&
      !hasException &&
      (hasSubmitted || !disponibilidadeAberta);
    if (isLocked) return;

    setSlotsSelecionados((prev) => {
      const exists = prev.find((s) => s.id === slotId);
      if (exists) {
        return prev.filter((s) => s.id !== slotId);
      } else {
        return [
          ...prev,
          {
            id: slotId,
            modo: tipoCadastro === "casal" ? "casal" : "individual",
          },
        ];
      }
    });
  };

  const handleModeChange = (slotId, newMode) => {
    const role = user?.role?.toLowerCase().trim() || "";
    const isCoordenador =
      role === "admin" ||
      role === "coordenador" ||
      role === "coordenacao" ||
      role.includes("coordena");
    const hasException = !!(
      user?.excecaoAcessoAte && new Date(user.excecaoAcessoAte) > new Date()
    );
    const hasSubmitted = (initialSlotsSelecionados || []).length > 0;
    const isLocked =
      !isCoordenador &&
      !hasException &&
      (hasSubmitted || !disponibilidadeAberta);
    if (isLocked) return;

    setSlotsSelecionados((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, modo: newMode } : s)),
    );
  };

  const validarSelecao = () => {
    // Verificação robusta de coordenação/admin (case-insensitive)
    const role = user?.role?.toLowerCase().trim() || "";
    const isCoordenador =
      role === "admin" ||
      role === "coordenador" ||
      role === "coordenacao" ||
      role.includes("coordena");

    if (slotsSelecionados.length === 0) {
      if (isCoordenador)
        return {
          valid: true,
          message:
            "Clique em Enviar para registrar sua disponibilidade (ou limpar).",
        };
      return {
        valid: false,
        message: "Selecione pelo menos duas missas em datas não sequenciais.",
      };
    }

    const datasSelecionadas = [
      ...new Set(
        slotsSelecionados.map((s) => {
          const slot = slotsDisponiveis.find((sl) => sl.id === s.id);
          if (slot) return slot.data;

          // Fallback find by partial matching if ID changed format
          const found = slotsDisponiveis.find((sl) => {
            const normH = sl.horario.replace(/[^a-zA-Z0-9_\-]/g, "_");
            return s.id.includes(sl.data) && s.id.includes(normH);
          });
          return found?.data;
        }),
      ),
    ]
      .filter(Boolean)
      .sort() as string[];

    if (!isCoordenador && datasSelecionadas.length < 2) {
      return {
        valid: false,
        message: "Selecione pelo menos duas datas diferentes para prosseguir.",
      };
    }

    // Verificar se a seleção não é composta apenas por datas sequenciais (blocos)
    let temSaltoValido = false;
    for (let i = 0; i < datasSelecionadas.length - 1; i++) {
      const d1 = new Date(datasSelecionadas[i] + "T00:00:00");
      const d2 = new Date(datasSelecionadas[i + 1] + "T00:00:00");
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        temSaltoValido = true;
        break;
      }
    }

    if (!isCoordenador && !temSaltoValido) {
      return {
        valid: false,
        message:
          "Selecione datas em períodos diferentes (ex: dois sábados ou datas não sequenciais).",
      };
    }

    return { valid: true, message: "" };
  };

  const handleSubmit = async (e, onSuccess?: () => void) => {
    e.preventDefault();
    setError("");
    setMessage("Enviando disponibilidade...");

    // Sempre verifica o papel do usuário logado ORIGINAL para permissão de coordenador
    // Mesmo que esteja visualizando outro usuário, o envio deve respeitar o poder de quem está logado
    const role = user?.role?.toLowerCase().trim() || "";
    const isUserCoordenador =
      role === "admin" ||
      role === "coordenador" ||
      role === "coordenacao" ||
      role.includes("coordena");
    const targetUser = viewAsUser || user;

    // Coordenadores NUNCA são bloqueados
    const hasException = !!(
      targetUser?.excecaoAcessoAte &&
      new Date(targetUser.excecaoAcessoAte) > new Date()
    );
    const hasSubmitted = (initialSlotsSelecionados || []).length > 0;
    const isLocked =
      !isUserCoordenador &&
      !hasException &&
      (hasSubmitted || !disponibilidadeAberta);

    if (isLocked) {
      setError("A disponibilidade está bloqueada para alterações.");
      setMessage("");
      return;
    }

    const validacao = validarSelecao();
    if (!validacao.valid) {
      setError(validacao.message);
      setMessage("");
      return;
    }

    const payload = {
      ministro_id: targetUser?.id,
      nome: targetUser?.nomeExibicao || targetUser?.nome,
      telefone: targetUser?.telefone || "N/A", // Garante um valor para não falhar no servidor
      tipo: targetUser?.tipo || "individual",
      nomeConjuge: targetUser?.nomeConjuge,
      paroquia: targetUser?.paroquia,
      isCoordenador: isUserCoordenador,
      disponibilidade: slotsSelecionados
        .map((s) => {
          const slot = slotsDisponiveis.find((sl) => sl.id === s.id);
          if (!slot) return null;
          return {
            data: slot.data,
            horario: slot.horario,
            nomeMissa: slot.nome,
            modo: s.modo,
          };
        })
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/disponibilidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar disponibilidade.");
      }

      setInitialSlotsSelecionados([...slotsSelecionados]);

      // Lock the interface immediately and clear any temporary exception
      if (viewAsUser) {
        setViewAsUser((prev) =>
          prev
            ? {
                ...prev,
                disponibilidadeConfirmada: true,
                excecaoAcessoAte: null,
              }
            : null,
        );
      } else {
        setUser((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            disponibilidadeConfirmada: true,
            excecaoAcessoAte: null,
          };
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      }

      fetchVagas(); // Atualiza as vagas após salvar
      setMessage("Disponibilidade enviada com sucesso!");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          setView("welcome");
        }
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro ao enviar.",
      );
      setMessage("");
    }
  };

  useEffect(() => {
    if (user && user.telefone) {
      fetch(`/api/escala?paroquia=${encodeURIComponent(user.paroquia)}`)
        .then((res) => res.json())
        .then((data) => setEscala(data))
        .catch((err) => console.error("Erro ao buscar escala:", err));
    }
  }, [user, escalaPublicada]);

  useEffect(() => {
    console.log("App.tsx useEffect[user] triggered. User:", user);
    if (user) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      let message = "";

      console.log("Today is:", day, "/", month);
      console.log("user.dataNascimento:", user.dataNascimento);

      if (getBirthdayMatch(user.dataNascimento, month, day)) {
        const padroeiro = user.paroquia
          ? user.paroquia
              .replace(
                /^(Paróquia\s+(?:e\s+Santuário\s+)?|Santuário\s+|Capela\s+|Igreja\s+|Catedral\s+|Basílica\s+|Comunidade\s+)/i,
                "",
              )
              .trim()
          : "o padroeiro da sua paróquia";
        message = `Feliz Aniversário, ${user.nome}! Que Deus abençoe abundantemente a sua vida e que ${padroeiro} interceda sempre por você e sua família.`;
        console.log("Birthday match for user!");
      }

      if (
        user.tipo === "casal" &&
        getBirthdayMatch(user.dataNascimentoConjuge, month, day)
      ) {
        const padroeiro = user.paroquia
          ? user.paroquia
              .replace(
                /^(Paróquia\s+(?:e\s+Santuário\s+)?|Santuário\s+|Capela\s+|Igreja\s+|Catedral\s+|Basílica\s+|Comunidade\s+)/i,
                "",
              )
              .trim()
          : "o padroeiro da sua paróquia";
        message = message
          ? `${message} E um abençoado aniversário também para ${user.nomeConjuge}!`
          : `Feliz Aniversário, ${user.nomeConjuge}! Que Deus abençoe abundantemente a sua vida e que ${padroeiro} interceda sempre por você e sua família.`;
        console.log("Birthday match for conjuge!");
      }

      console.log("Setting birthday message to:", message);
      setBirthdayMessage(message);
    } else {
      setBirthdayMessage("");
    }
  }, [user]);

  if (!user) {
    return <LoginView onLogin={onLogin} />;
  }

  const isCoordenadorGlobal =
    user?.role === "admin" ||
    user?.role === "coordenador" ||
    user?.role === "coordenacao" ||
    user?.role?.toLowerCase().includes("coordena");
  const finalInitialSlots = initialSlotsSelecionados;

  if (view === "welcome" || view === "coordenacao") {
    return (
      <>
        <CoordenacaoView
          user={viewAsUser || user}
          originalUser={viewAsUser ? user : viewAsMinister ? user : null}
          onClearImpersonation={() => {
            setViewAsUser(null);
            setViewAsMinister(false);
            setView(user.role === "admin" ? "admin" : "coordenacao");
          }}
          setUser={setUser}
          onLogout={handleLogout}
          onBackToHome={() => setView("welcome")}
          onSetView={(v) => {
            setViewAsUser(null);
            setViewAsMinister(false);
            setView(v as any);
          }}
          needsPasswordReset={needsPasswordReset}
          slotsDisponiveisApp={slotsDisponiveis}
          escalaApp={escala}
          setEscalaApp={setEscala}
          birthdayMessage={birthdayMessage}
          disponibilidadeAberta={disponibilidadeAberta}
          setDisponibilidadeAberta={setDisponibilidadeAberta}
          manualOverride={manualOverride}
          setManualOverride={setManualOverride}
          mesSelecionado={mesSelecionado}
          anoSelecionado={anoSelecionado}
          setMesSelecionado={setMesSelecionado}
          setAnoSelecionado={setAnoSelecionado}
          onExcluirMensagem={handleExcluirMensagem}
          onMarcarComoLida={handleMarcarComoLida}
          slotsSelecionados={slotsSelecionados}
          setSlotsSelecionados={setSlotsSelecionados}
          initialSlotsSelecionados={finalInitialSlots}
          setInitialSlotsSelecionados={setInitialSlotsSelecionados}
          handleSlotChange={handleSlotChange}
          handleModeChange={handleModeChange}
          handleSubmit={handleSubmit}
          validarSelecao={validarSelecao}
          error={error}
          message={message}
          isCoordenador={isCoordenadorGlobal}
          ocupacao={ocupacao}
          setOcupacao={setOcupacao}
          showPreAberturaMessage={showPreAberturaMessage}
          mensagemDisponibilidade={mensagemDisponibilidade}
          getChaveOcupacao={getChaveOcupacao}
          getLimiteVagas={getLimiteVagas}
          setViewAsMinister={setViewAsMinister}
          viewAsMinister={viewAsMinister}
          onImpersonate={(m) => {
            setViewAsUser(m);
            setView("coordenacao");
          }}
          onCustomConfirm={customConfirm}
          onAlert={(titulo, mensagem) => {
            if (typeof titulo === "object" && titulo !== null) {
              const obj = titulo as any;
              const typeLabel = obj.type === "success" ? "Sucesso" : "Erro / Atenção";
              setModalAviso({
                aberta: true,
                titulo: typeLabel,
                mensagem: obj.text || "",
              });
            } else {
              setModalAviso({
                aberta: true,
                titulo: String(titulo || "Aviso"),
                mensagem: String(mensagem || ""),
              });
            }
          }}
          setDownloadOptionMode={setDownloadOptionMode}
        />
        {renderModal()}
      </>
    );
  }

  if (view === "admin") {
    return (
      <>
        <AdminView
          onLogout={handleLogout}
          setView={(v) => {
            setViewAsUser(null);
            setViewAsMinister(false);
            setView(v as any);
          }}
          user={user}
          mesSelecionado={mesSelecionado}
          anoSelecionado={anoSelecionado}
          onDownloadBackup={handleDownloadBackup}
          onRestoreBackup={handleRestoreBackup}
          setViewAsMinister={setViewAsMinister}
          onImpersonate={(m) => {
            setViewAsUser(m);
            setView("coordenacao");
          }}
          onCustomConfirm={customConfirm}
          onAlert={(titulo, mensagem) => {
            if (typeof titulo === "object" && titulo !== null) {
              const obj = titulo as any;
              const typeLabel = obj.type === "success" ? "Sucesso" : "Erro / Atenção";
              setModalAviso({
                aberta: true,
                titulo: typeLabel,
                mensagem: obj.text || "",
              });
            } else {
              setModalAviso({
                aberta: true,
                titulo: String(titulo || "Aviso"),
                mensagem: String(mensagem || ""),
              });
            }
          }}
          setDownloadOptionMode={setDownloadOptionMode}
        />
        {renderModal()}
      </>
    );
  }

  if (
    view === "home" ||
    view === "disponibilidade" ||
    view === "escalaOnline"
  ) {
    const targetUser = viewAsUser || user;
    const isCoordenador =
      user?.role === "admin" ||
      user?.role === "coordenador" ||
      user?.role === "coordenacao" ||
      user?.role?.toLowerCase().includes("coordena");
    const hasException = !!(
      targetUser?.excecaoAcessoAte &&
      new Date(targetUser.excecaoAcessoAte) > new Date()
    );
    const hasSubmitted = (initialSlotsSelecionados || []).length > 0;

    // Agrupar slots por dia para exibição
    const slotsPorDia = (slotsDisponiveis || []).reduce(
      (acc: any, slot: any) => {
        if (!slot?.data) return acc;
        if (!acc[slot.data]) {
          acc[slot.data] = {
            diaFormatado: slot.diaFormatado,
            slots: [],
          };
        }
        acc[slot.data].slots.push(slot);
        return acc;
      },
      {},
    );

    const isLocked =
      !isCoordenador &&
      !hasException &&
      (hasSubmitted || !disponibilidadeAberta);

    // Se estiver bloqueado (enviado ou fechado), mostra a tela correspondente
    if (isLocked && view === "disponibilidade") {
      const isReceived = hasSubmitted;
      return (
        <div className="bg-white min-h-screen w-full flex items-center justify-center p-6 font-sans">
          <div
            className={
              isReceived
                ? "bg-emerald-50 border border-emerald-200 rounded-[2.5rem] p-16 max-w-2xl w-full text-center shadow-sm"
                : "bg-[#f0f7ff] border border-[#dce9f9] rounded-[2.5rem] p-16 max-w-2xl w-full text-center shadow-sm"
            }
          >
            <div
              className={
                isReceived
                  ? "w-20 h-20 bg-white text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100"
                  : "w-20 h-20 bg-white text-[#2563eb] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#e5effb]"
              }
            >
              {isReceived ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Lock className="w-10 h-10" />
              )}
            </div>
            <h3
              className={
                isReceived
                  ? "text-[28px] font-bold text-emerald-800 mb-4 tracking-tight leading-tight"
                  : "text-[28px] font-bold text-[#1e40af] mb-4 tracking-tight leading-tight"
              }
            >
              {isReceived
                ? "Agendamento Recebido"
                : "Agendamento de Disponibilidade Encerrado"}
            </h3>
            <p
              className={
                isReceived
                  ? "text-emerald-700 text-[15px] leading-relaxed mb-10 max-w-md mx-auto"
                  : "text-[#64748b] text-[15px] leading-relaxed mb-10 max-w-md mx-auto"
              }
            >
              {isReceived
                ? "Sua disponibilidade já foi enviada com sucesso! Caso precise de alguma alteração, contate a coordenação para desbloquear seu acesso."
                : "O período para envio do Agendamento Mensal de Disponibilidade foi concluído. Caso precise de suporte, contate a coordenação."}
            </p>
            <button
              type="button"
              onClick={() => setView("welcome")}
              className={
                isReceived
                  ? "px-8 py-3.5 bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-200"
                  : "px-8 py-3.5 bg-[#1e40af] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-100"
              }
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
                Informe a Disponibilidade
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Olá,{" "}
                <span className="font-semibold text-red-600">
                  {targetUser?.loggedInName ||
                    targetUser?.nomeExibicao ||
                    (targetUser?.nome || "").split(" ")[0]}
                </span>
                {(targetUser?.role === "coordenacao" ||
                  targetUser?.role === "coordenador") && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold uppercase">
                    Coordenador
                  </span>
                )}
                . Selecione as datas que você pode servir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setView("welcome")}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              {user.role === "admin" && (
                <button
                  onClick={() => setView("admin")}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-liturgy-600 rounded-lg hover:bg-liturgy-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>

          {showPreAberturaMessage && !disponibilidadeAberta && (
            <div className="mb-6 p-4 bg-liturgy-50 border border-liturgy-200 rounded-xl flex items-center gap-3 text-liturgy-800 shadow-sm animate-bounce">
              <Info className="w-6 h-6 text-liturgy-600 flex-shrink-0" />
              <p className="font-bold text-lg">
                A disponibilidade será aberta em breve.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => handleSubmit(e, () => setView("welcome"))}
            className="space-y-8"
          >
            {isLocked ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
                <div className="bg-[#f0f7ff] border border-[#dce9f9] rounded-[2rem] p-12 max-w-xl w-full text-center shadow-sm">
                  <div className="w-16 h-16 bg-white text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#e5effb]">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e40af] mb-4 tracking-tight">
                    Agendamento de Disponibilidade Encerrado
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed mb-8">
                    O período para envio do Agendamento Mensal de
                    Disponibilidade foi concluído. Caso precise de suporte,
                    contate a coordenação.
                  </p>
                  <button
                    type="button"
                    onClick={() => setView("welcome")}
                    className="px-8 py-3 bg-[#1e40af] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#1d4ed8] transition-all shadow-md shadow-blue-100"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            ) : !disponibilidadeAberta && !isCoordenador && !hasException ? (
              <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-3xl text-center shadow-sm">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-2">
                  Disponibilidade Fechada
                </h3>
                <p className="text-amber-700 max-w-md mx-auto">
                  No momento a coleta de disponibilidades está encerrada.
                  Aguarde o próximo período ou entre em contato com a
                  coordenação caso precise de acesso especial.
                </p>
                <button
                  type="button"
                  onClick={() => setView("welcome")}
                  className="mt-6 px-6 py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all shadow-md"
                >
                  Voltar ao Início
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  const diasSemana = Object.keys(slotsPorDia)
                    .filter((data) => {
                      const dateObj = new Date(data + "T00:00:00");
                      const dayOfWeek = dateObj.getDay();
                      return dayOfWeek > 0 && dayOfWeek < 6; // Monday to Friday
                    })
                    .sort();

                  if (diasSemana.length === 0) return null;

                  const renderDailyDayCard = (data) => {
                    const slotsDoDia = slotsPorDia[data].slots;
                    if (slotsDoDia.length === 0) return null;

                    return (
                      <div
                        key={data}
                        className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm"
                      >
                        <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <h3 className="font-bold text-blue-900 capitalize text-md">
                            {slotsPorDia[data].diaFormatado}
                          </h3>
                        </div>
                        <div className="p-3">
                          {slotsDoDia.map((slot) => {
                            const selection = slotsSelecionados.find(
                              (s) => s.id === slot.id,
                            );
                            const isSelected = !!selection;
                            const initialSelection =
                              initialSlotsSelecionados.find(
                                (s) => s.id === slot.id,
                              );
                            const wasInitiallySelected = !!initialSelection;

                            const chaveOcupacao = getChaveOcupacao(slot);
                            console.log('DEBUG 4: chave:', chaveOcupacao, 'ocupacao:', ocupacao[chaveOcupacao]);
                            const ocupadosNoServidorData =
                              ocupacao[chaveOcupacao] || 0;
                            const ocupadosNoServidor =
                              typeof ocupadosNoServidorData === "object"
                                ? ocupadosNoServidorData.total || 0
                                : ocupadosNoServidorData;
                            const limite = getLimiteVagas(slot);

                            const getPeso = (modo) => {
                              if (modo === "casal") return 2;
                              if (modo === "ele" || modo === "ela") return 1;
                              return 1;
                            };

                            const pesoInicial = wasInitiallySelected
                              ? getPeso(initialSelection.modo)
                              : 0;
                            const pesoAtual = isSelected
                              ? getPeso(selection.modo)
                              : 0;

                            const ocupadosPorOutros =
                              ocupadosNoServidor - pesoInicial;
                            const ocupadosProjetados =
                              ocupadosPorOutros + pesoAtual;

                            const pesoParaCheck =
                              tipoCadastro === "casal"
                                ? isSelected
                                  ? getPeso(selection.modo)
                                  : 2
                                : 1;
                            const disponivel =
                              ocupadosPorOutros + pesoParaCheck <= limite;
                            const isFull = false;
                            const nomeMinistro =
                              targetUser?.nomeExibicao ||
                              targetUser?.nome ||
                              "";
                            const isUserScheduled =
                              escala &&
                              slot?.data &&
                              slot?.horario &&
                              escala[slot.data] &&
                              escala[slot.data][slot.horario] &&
                              (
                                escala[slot.data][slot.horario].ministros || []
                              ).includes(nomeMinistro);
                            const isDisabled = isFull || isUserScheduled;

                            return (
                              <div
                                key={slot.id}
                                className="flex flex-col gap-2 mb-2"
                              >
                                <label
                                  className={`
                              relative flex items-center p-3 rounded-xl transition-all duration-200 border w-full
                              ${isDisabled ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : "cursor-pointer"}
                              ${isSelected ? "bg-blue-600 border-blue-700 text-white shadow-md" : !isDisabled && "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"}
                            `}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() =>
                                      !isDisabled && handleSlotChange(slot.id)
                                    }
                                    disabled={isDisabled}
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="block text-lg font-bold leading-none">
                                        {slot.horario} - {slot.nome}
                                      </span>
                                      <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDisabled ? "bg-blue-100 text-blue-600" : isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                                      >
                                        Ministros {ocupadosProjetados}/{limite}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-slate-500"}`}
                                    >
                                      {slot.nome}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check className="absolute top-3 right-3 w-4 h-4" />
                                  )}
                                </label>

                                {isSelected && tipoCadastro === "casal" && (
                                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-blue-100 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "casal")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "casal" ? "bg-blue-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      Casal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "ele")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "ele" ? "bg-blue-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      {
                                        (
                                          targetUser?.nomeExibicao ||
                                          targetUser?.nome ||
                                          ""
                                        ).split(" ")[0]
                                      }
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "ela")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "ela" ? "bg-blue-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      {
                                        (
                                          targetUser?.nomeExibicaoConjuge ||
                                          targetUser?.nomeConjuge ||
                                          ""
                                        ).split(" ")[0]
                                      }
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <CalendarDays className="w-4.5 h-4.5 text-blue-600" />
                        </div>
                        Missas Diárias
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {diasSemana.map((data) => renderDailyDayCard(data))}
                      </div>
                    </div>
                  );
                })()}

                {/* Seção: Missas dos Finais de Semana */}
                {(() => {
                  const diasFimDeSemana = Object.keys(slotsPorDia)
                    .filter((data) => {
                      const dateObj = new Date(data + "T00:00:00");
                      const dayOfWeek = dateObj.getDay();
                      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
                    })
                    .sort();

                  if (diasFimDeSemana.length === 0) return null;

                  const weekends = [];
                  let currentWeekend = { sabado: null, domingo: null };

                  diasFimDeSemana.forEach((data) => {
                    const dateObj = new Date(data + "T00:00:00");
                    const day = dateObj.getDay();

                    if (day === 6) {
                      // Saturday
                      if (currentWeekend.sabado) {
                        weekends.push(currentWeekend);
                        currentWeekend = { sabado: data, domingo: null };
                      } else {
                        currentWeekend.sabado = data;
                      }
                    } else if (day === 0) {
                      // Sunday
                      currentWeekend.domingo = data;
                      weekends.push(currentWeekend);
                      currentWeekend = { sabado: null, domingo: null };
                    }
                  });
                  if (currentWeekend.sabado || currentWeekend.domingo) {
                    weekends.push(currentWeekend);
                  }

                  const renderDayCard = (data) => {
                    const slotsDoDia = slotsPorDia[data].slots;
                    if (slotsDoDia.length === 0) return null;

                    return (
                      <div
                        key={data}
                        className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm"
                      >
                        <div className="bg-emerald-50/50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <h3 className="font-bold text-emerald-900 capitalize text-md">
                            {slotsPorDia[data].diaFormatado}
                          </h3>
                        </div>
                        <div className="p-3">
                          {slotsDoDia.map((slot) => {
                            const selection = slotsSelecionados.find(
                              (s) => s.id === slot.id,
                            );
                            const isSelected = !!selection;
                            const initialSelection =
                              initialSlotsSelecionados.find(
                                (s) => s.id === slot.id,
                              );
                            const wasInitiallySelected = !!initialSelection;

                            const chaveOcupacao = getChaveOcupacao(slot);
                            console.log('DEBUG 2:', chaveOcupacao, slot);
                            const ocupadosNoServidorData =
                              ocupacao[chaveOcupacao] || 0;
                            const ocupadosNoServidor =
                              typeof ocupadosNoServidorData === "object"
                                ? ocupadosNoServidorData.total || 0
                                : ocupadosNoServidorData;
                            const limite = getLimiteVagas(slot);

                            const getPeso = (modo) => {
                              if (modo === "casal") return 2;
                              if (modo === "ele" || modo === "ela") return 1;
                              return 1;
                            };

                            const pesoInicial = wasInitiallySelected
                              ? getPeso(initialSelection.modo)
                              : 0;
                            const pesoAtual = isSelected
                              ? getPeso(selection.modo)
                              : 0;

                            const ocupadosPorOutros =
                              ocupadosNoServidor - pesoInicial;
                            const ocupadosProjetados =
                              ocupadosPorOutros + pesoAtual;

                            const pesoParaCheck =
                              tipoCadastro === "casal"
                                ? isSelected
                                  ? getPeso(selection.modo)
                                  : 2
                                : 1;
                            const disponivel =
                              ocupadosPorOutros + pesoParaCheck <= limite;
                            const isFull = false;
                            const nomeMinistro =
                              targetUser?.nomeExibicao ||
                              targetUser?.nome ||
                              "";
                            const isUserScheduled =
                              escala &&
                              slot?.data &&
                              slot?.horario &&
                              escala[slot.data] &&
                              escala[slot.data][slot.horario] &&
                              (
                                escala[slot.data][slot.horario].ministros || []
                              ).includes(nomeMinistro);
                            const isDisabled = isFull || isUserScheduled;

                            return (
                              <div
                                key={slot.id}
                                className="flex flex-col gap-2 mb-2"
                              >
                                <label
                                  className={`
                              relative flex items-center p-3 rounded-xl transition-all duration-200 border w-full
                              ${isDisabled ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : "cursor-pointer"}
                              ${isSelected ? "bg-emerald-600 border-emerald-700 text-white shadow-md" : !isDisabled && "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"}
                            `}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() =>
                                      !isDisabled && handleSlotChange(slot.id)
                                    }
                                    disabled={isDisabled}
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="block text-lg font-bold leading-none">
                                        {slot.horario} - {slot.nome}
                                      </span>
                                      <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDisabled ? "bg-emerald-100 text-emerald-600" : isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                                      >
                                        Ministros {ocupadosProjetados}/{limite}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-slate-500"}`}
                                    >
                                      {slot.nome}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check className="absolute top-3 right-3 w-4 h-4" />
                                  )}
                                </label>

                                {isSelected && tipoCadastro === "casal" && (
                                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-emerald-100 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "casal")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "casal" ? "bg-emerald-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      Casal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "ele")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "ele" ? "bg-emerald-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      {
                                        (
                                          targetUser?.nomeExibicao ||
                                          targetUser?.nome ||
                                          ""
                                        ).split(" ")[0]
                                      }
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "ela")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "ela" ? "bg-emerald-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      {
                                        (
                                          targetUser?.nomeExibicaoConjuge ||
                                          targetUser?.nomeConjuge ||
                                          ""
                                        ).split(" ")[0]
                                      }
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        Missas dos Finais de Semana
                      </h2>

                      <div className="space-y-6">
                        {weekends.map((weekend, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {weekend.sabado ? (
                              renderDayCard(weekend.sabado)
                            ) : (
                              <div className="hidden md:block"></div>
                            )}
                            {weekend.domingo ? (
                              renderDayCard(weekend.domingo)
                            ) : (
                              <div className="hidden md:block"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm text-center">
                    {message}
                  </div>
                )}

                <div className="pt-4 pb-12">
                  {((porDia, selecionados, coordenador, submited) => {
                    const totalSlots = Object.values(porDia).reduce(
                      (acc: number, dia: any) => acc + dia.slots.length,
                      0,
                    );

                    const weightedCount = (selecionados || []).reduce(
                      (acc: number, slot: any) => {
                        if (slot.modo === "casal") return acc + 2;
                        return acc + 1;
                      },
                      0,
                    );

                    return (
                      <button
                        type="submit"
                        disabled={!validarSelecao().valid || isLocked}
                        className={`w-full py-4 px-6 rounded-2xl transition duration-300 font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${!validarSelecao().valid || isLocked ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-red-600 text-white hover:bg-red-700 shadow-red-200"}`}
                      >
                        {isLocked ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                        {isLocked
                          ? "Disponibilidade Enviada"
                          : coordenador
                            ? `Enviar Disponibilidade (${weightedCount}/${totalSlots})`
                            : submited
                              ? `Disponibilidade Enviada (${weightedCount}/${totalSlots})`
                              : `Enviar Disponibilidade para a Coordenação (${weightedCount}/${totalSlots})`}
                      </button>
                    );
                  })(
                    slotsPorDia,
                    slotsSelecionados,
                    isCoordenador,
                    hasSubmitted,
                  )}
                  <p
                    className={`text-center text-sm mt-3 font-medium ${!validarSelecao().valid ? "text-red-500" : "text-emerald-600"}`}
                  >
                    {validarSelecao().message ||
                      "Disponibilidade pronta para envio."}
                  </p>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    );
  }

  const handleSaveUserGlobally = async (formData) => {
    const targetTelefone = (viewAsUser || user)?.telefone;
    if (!targetTelefone) return;
    try {
      const payload = { ...formData };
      const response = await fetch(
        `/api/ministros/${encodeURIComponent(targetTelefone)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setUser((currentUser) => {
          if (!currentUser) return null;
          const finalUser = {
            ...currentUser,
            ...data.ministro,
            isCoordenador: currentUser.isCoordenador,
          };
          localStorage.setItem("user", JSON.stringify(finalUser));
          return finalUser;
        });
        setMessage("Perfil atualizado com sucesso!");
        setTimeout(() => {
          setMessage("");
        }, 1500);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar os dados.");
      }
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      throw err;
    }
  };

  if (view === "cadastro") {
    return (
      <>
        <CadastroView
          user={user}
          onSave={handleSaveUserGlobally}
          voltar={() => setView("welcome")}
          onBack={() => setView("welcome")}
          onSetView={setView}
        />
        {renderModal()}
      </>
    );
  }

  if (view === "mensagem") {
    return (
      <>
        <MensagemView
          voltar={() => setView("welcome")}
          onSubmit={handleEnviarMensagem}
          mensagem={mensagem}
          setMensagem={setMensagem}
          message={message}
          error={error}
          mensagensRecebidas={mensagensRecebidas}
          onMarcarComoLida={handleMarcarComoLida}
          onExcluirMensagem={handleExcluirMensagem}
          fetchMensagens={fetchMensagensRecebidas}
          onCustomConfirm={customConfirm}
        />
        {renderModal()}
      </>
    );
  }

  if (view === "escala") {
    return (
      <>
        <EscalaView
          escala={escala}
          user={user}
          voltar={() => setView("welcome")}
          onCustomConfirm={customConfirm}
          setDownloadOptionMode={setDownloadOptionMode}
          handleToggleEscala={handleToggleEscala}
          escalaPublicadaPorMes={escalaPublicadaPorMes}
          escalaPublicadaGlobal={escalaPublicada}
          isCoordenador={isCoordenadorGlobal}
        />
        {renderModal()}
      </>
    );
  }

  if (view === "calendario") {
    return (
      <>
        <CalendarioCatolicoView
          voltar={() => setView("welcome")}
          slots={slotsDisponiveis}
          user={user}
        />
        {renderModal()}
      </>
    );
  }

  return (
    <>
      {null}
      {renderModal()}
    </>
  );
}
