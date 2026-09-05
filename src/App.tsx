import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { hasCoordAccess, areMinistersOverlapping, isMinisterMatchingUser, isMinisterLiderForUser, isMinisterLeader, formatMinisterWithLeader, renderMinisterWithStar, fetchAndCacheMinistros, safeJson, safeFetchJson } from "./utils";
import { createPortal } from "react-dom";
import LiderView from "./components/LiderView";
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

function formatMessageDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const match = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      d = new Date(year, month, day, hours, minutes);
    }
  }
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
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
  Search,
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
  Globe,
  BarChart,
  Zap,
  Church,
  MapPin,
  Gift,
  HelpCircle,
  HandHeart,
  MessageCircle,
  Reply,
  ShieldCheck,
  CheckCircle2,
  Package,
  Presentation,
  Smartphone,
  Monitor,
  Cpu,
  DollarSign,
  Flag,
  Star,
  Sparkles,
} from "lucide-react";
import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import WelcomeView from "./components/WelcomeView";
import LiturgiaDiariaView from "./components/LiturgiaDiariaView";

function BackgroundLogo({ paroquia }: { paroquia?: string }) {
  if (paroquia !== "Paróquia Santa Rita de Cássia") return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src="/logo-santa-rita.png"
          alt=""
          className="w-full max-w-2xl object-contain px-8 opacity-[0.22] select-none transition-opacity duration-300"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
import { AdminParoquiasView } from "./components/AdminParoquiasView";
import { AdminEstoqueView } from "./components/AdminEstoqueView";
import { AdminFidelisView } from "./components/AdminFidelisView";
import CoordenacaoCadastroView from "./components/CoordenacaoCadastroView";
import CoordenacaoMissasView from "./components/CoordenacaoMissasView";
import { ComunhaoView } from "./components/ComunhaoView";
import FinanceiroView from "./components/FinanceiroView";
import { EditarDisponibilidadeView } from "./components/EditarDisponibilidadeView";
import { CoordenacaoFaltasView } from "./components/CoordenacaoFaltasView";
import { CoordenacaoLideresView } from "./components/CoordenacaoLideresView";
import { SantosView } from "./components/SantosView";
import { PrivacyView } from "./components/PrivacyView";
import type {
  User as UserType,
  Disponibilidade,
  DisponibilidadeSlot,
} from "./types";
import { toTitleCase, formatPhone } from "./utils";
import { prayers, Prayer as PrayerType } from "./data/prayers";
const isComplexPassword = (password: string | null | undefined): boolean => {
  if (!password) return false;
  if (password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasSpecial;
};
import {
  getCalendarioLiturgico,
  getLiturgicalThemeDynamic,
  getTodayDateStringForLiturgy,
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

function CalendarioCatolicoView({ voltar, slots, user, escala, myAssignments, isTab = false }) {
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
      <div className="bg-blue-900/[0.04] backdrop-blur-md border border-red-300/40 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)] rounded-2xl overflow-hidden">
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
        {selectedDayEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setSelectedDayEvent(null)}
          >
            <div
              className="bg-white p-5 rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4"
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
          </div>
        )}

        {/* Modal de Agendar Novo Evento / Reunião */}
        {showAddModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white p-5 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md space-y-4"
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
                    {newEvent.destinatario !== "todos" && newEvent.alvoIds.length > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {newEvent.alvoIds.length} selecionado(s)
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
                          const allCasais = ministersList.filter(m => m.tipo === 'casal' || m.nomeConjuge);
                          const allIds = allCasais.map(m => String(m.id));
                          const allNomes = allCasais.map(m => `${m.nome} & ${m.nomeConjuge || m.nomeExibicaoConjuge || 'Cônjuge'}`);
                          setNewEvent({ ...newEvent, alvoIds: allIds, alvoNomes: allNomes });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white">
                      {ministersList
                        .filter(m => m.tipo === 'casal' || m.nomeConjuge)
                        .map((m) => {
                          const mId = String(m.id);
                          const isSelected = newEvent.alvoIds.includes(mId);
                          const label = `${m.nome} & ${m.nomeConjuge || m.nomeExibicaoConjuge || 'Cônjuge'}`;
                          return (
                            <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-blue-50/50 rounded-lg cursor-pointer text-xs transition-colors">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  let updatedIds = [...newEvent.alvoIds];
                                  let updatedNomes = [...newEvent.alvoNomes];
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
                          const allIds = ministersList.map(m => String(m.id));
                          const allNomes = ministersList.map(m => m.nomeExibicao || m.nome);
                          setNewEvent({ ...newEvent, alvoIds: allIds, alvoNomes: allNomes });
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Selecionar Todos
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white">
                      {ministersList.map((m) => {
                        const mId = String(m.id);
                        const isSelected = newEvent.alvoIds.includes(mId);
                        const label = m.nomeExibicao || m.nome;
                        return (
                          <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-blue-50/50 rounded-lg cursor-pointer text-xs transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let updatedIds = [...newEvent.alvoIds];
                                let updatedNomes = [...newEvent.alvoNomes];
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
          </div>
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
                        {formatMessageDateDisplay(msg.data)}
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
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

const normalizeHorario = (h: string) => {
  if (!h) return "00:00";
  const parts = h.trim().split(/[:h]/);
  if (parts.length === 0) return "00:00";
  let HH = parts[0].padStart(2, "0");
  let MM = (parts[1] || "00").padStart(2, "0");
  if (parseInt(HH) > 23) HH = "23";
  if (parseInt(MM) > 59) MM = "59";
  return `${HH}:${MM}`;
};

const slotsCache = new Map<string, { slots: any[]; timestamp: number }>();

const getExpectedSlots = async (
  paroquiaNameProp?: string,
  mesParam?: number,
  anoParam?: number,
) => {
  const cacheKey = `${paroquiaNameProp}-${mesParam}-${anoParam}`;
  const now = Date.now();
  if (slotsCache.has(cacheKey)) {
    const cached = slotsCache.get(cacheKey)!;
    if (now - cached.timestamp < 60000) {
      // Cache for 1 minute
      return cached.slots;
    }
  }

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

  // Se não passar parâmetros, calcula o mês ativo (até dia 19 às 23:59 = mês atual; a partir do dia 20 = próximo mês)
  let targetMonth = mesParam;
  let targetYear = anoParam;

  if (!targetMonth || !targetYear) {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
    targetMonth = targetDate.getMonth() + 1;
    targetYear = targetDate.getFullYear();
  }

  const ano = targetYear;
  const mes = targetMonth - 1;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  try {
    const data = await safeFetchJson<any[]>(
      `/api/missas-temporarias?paroquia=${encodeURIComponent(paroquiaName)}`,
      undefined,
      []
    );
    const missasTemporarias = Array.isArray(data) ? data : [];
    console.log(
      `[DEBUG] getExpectedSlots: Recebeu ${missasTemporarias.length} missas temporárias.`,
    );

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
            // Since this mass is scheduled for this date, always remove any existing standard slot first
            const existingIndex = slots.findIndex(
              (s) =>
                s.data === dataStr &&
                s.horario === mt.horario &&
                s.nome === mt.nome,
            );
            if (existingIndex !== -1) {
              slots.splice(existingIndex, 1);
            }

            // Check if the date is inactive or mass is inactive (quantity <= 0)
            const isInactiveDate = mt.datasInativas && mt.datasInativas.includes(dataStr);
            const isInactiveQty = Number(mt.quantidade) <= 0;

            if (!isInactiveDate && !isInactiveQty) {
              const diaFmt = d
                .toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
                .replace(",", "");

              slots.push({
                id: normalizeId(`${dataStr}-${mt.horario}-${mt.nome}`),
                data: dataStr,
                diaFormatado: diaFmt,
                horario: mt.horario,
                nome: mt.nome,
                tipo: `fixa-${mt.id}`,
                limiteManual: Number(mt.quantidade),
                paroquia: mt.paroquia || paroquiaName,
              });
            }
          }
        }
      } else {
        // Single date mass
        if (!mt.data) return;

        const dataObj = new Date(mt.data + "T00:00:00");
        // Check if it's in the target month/year
        if (dataObj.getMonth() !== mes || dataObj.getFullYear() !== ano) return;

        // Since this is a single date mass, always remove any existing matching slot first
        const existingIndex = slots.findIndex(
          (s) =>
            s.data === mt.data &&
            s.horario === mt.horario &&
            s.nome === mt.nome,
        );
        if (existingIndex !== -1) {
          slots.splice(existingIndex, 1);
        }

        // Check if the date is inactive or mass is inactive
        const isInactiveDate = mt.datasInativas && mt.datasInativas.includes(mt.data);
        const isInactiveQty = Number(mt.quantidade) <= 0;

        if (!isInactiveDate && !isInactiveQty) {
          const diaFormatado = dataObj
            .toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })
            .replace(",", "");

          slots.push({
            id: normalizeId(`${mt.data}-${mt.horario}-${mt.nome}`),
            data: mt.data,
            diaFormatado,
            horario: mt.horario,
            nome: mt.nome,
            tipo: `temp-${mt.id}`,
            limiteManual: Number(mt.quantidade),
            paroquia: mt.paroquia || paroquiaName,
          });
        }
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

  slotsCache.set(cacheKey, { slots, timestamp: Date.now() });
  return slots;
};

const DEFAULT_PAROQUIAS = [
  {
    id: "1772280333795",
    nome: "Paróquia Santa Rita de Cássia",
    cidade: "Bauru",
    estado: "SP",
    coordenador: "Alexandre",
    telefoneCoordenador: "14997865806",
  },
  {
    id: "1772281505207",
    nome: "Paróquia São Cristóvão",
    cidade: "Bauru",
    estado: "SP",
    coordenador: "Josué",
    telefoneCoordenador: "14999999999",
  },
  {
    id: "1774922106968",
    nome: "Paróquia Nossa Senhora das Graças",
    cidade: "Bauru",
    estado: "SP",
    coordenador: "Fernanda e Celiomar",
    telefoneCoordenador: "14 99113-3422",
  },
];

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
  const [paroquias, setParoquias] = useState(DEFAULT_PAROQUIAS);
  const [showSenha, setShowSenha] = useState(false);
  const [showSenhaConjuge, setShowSenhaConjuge] = useState(false);

  useEffect(() => {
    const fetchParoquias = async () => {
      try {
        const res = await fetch("/api/paroquias");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let data = await res.json();
        if (Array.isArray(data)) {
          if (user && user.role !== "admin" && user.paroquia) {
            data = data.filter((p: any) => p.nome === user.paroquia);
          }
          if (data.length > 0) {
            setParoquias(data);
          } else {
            setParoquias(DEFAULT_PAROQUIAS);
          }
        } else {
          console.error("Dados de paróquias inválidos:", data);
          setParoquias(DEFAULT_PAROQUIAS);
        }
      } catch (err) {
        const isNet = err instanceof Error && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("network") || err.message.includes("Failed to fetch") || err.message.includes("HTTP"));
        if (isNet) {
          console.warn("Aviso de conexão ao buscar paróquias (perfil):", err instanceof Error ? err.message : err);
        } else {
          console.error("Erro ao buscar paróquias:", err);
        }
        setParoquias(DEFAULT_PAROQUIAS);
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
      const isCoordenador = hasCoordAccess(user);
      const v = isCoordenador
        ? value.slice(0, 30)
        : value.replace(/\D/g, "").slice(0, 3);
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

    const isCoordenador = hasCoordAccess(user);
    if (formData.senha) {
      if (isCoordenador) {
        if (!isComplexPassword(formData.senha)) {
          setError(
            "A senha do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.",
          );
          return;
        }
      } else {
        if (formData.senha.length !== 3) {
          setError("A nova senha deve conter exatamente 3 números.");
          return;
        }
      }
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
      if (formData.senhaConjuge) {
        if (isCoordenador) {
          if (!isComplexPassword(formData.senhaConjuge)) {
            setError(
              "A nova senha do cônjuge do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.",
            );
            return;
          }
        } else {
          if (formData.senhaConjuge.length !== 3) {
            setError(
              "A nova senha do cônjuge deve conter exatamente 3 números.",
            );
            return;
          }
        }
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
                        {hasCoordAccess(user)
                          ? "Alterar Senha (mín. 6 caracteres: maiúsculas, minúsculas e símbolos)"
                          : "Alterar Senha (3 números)"}
                      </label>
                      <div className="relative">
                        <input
                          type={showSenha ? "text" : "password"}
                          name="senha"
                          value={formData.senha}
                          onChange={handleChange}
                          maxLength={hasCoordAccess(user) ? 30 : 3}
                          placeholder={
                            hasCoordAccess(user)
                              ? "Nova senha forte"
                              : "***"
                          }
                          className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showSenha ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {hasCoordAccess(user)
                        ? "Alterar Senha do Cônjuge (mín. 6 caracteres: maiúsculas, minúsculas e símbolos)"
                        : "Alterar Senha do Cônjuge (3 números)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showSenhaConjuge ? "text" : "password"}
                        name="senhaConjuge"
                        value={formData.senhaConjuge}
                        onChange={handleChange}
                        maxLength={hasCoordAccess(user) ? 30 : 3}
                        placeholder={
                          hasCoordAccess(user)
                            ? "Nova senha cônjuge forte"
                            : "***"
                        }
                        className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-liturgy-500 outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenhaConjuge(!showSenhaConjuge)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showSenhaConjuge ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
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
    const nameLower = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const found = allMins.find((m) => {
      const display1 = (m.nomeExibicao || m.nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const display2 = (m.nomeExibicaoConjuge || m.nomeConjuge || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const full = (m.nome || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (m.tipo === "casal") {
        const expectedCoupled = `${display1} e ${display2}`
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (nameLower === expectedCoupled) return true;
        if (nameLower.includes(display1) && nameLower.includes(display2))
          return true;
      }

      return (
        nameLower === display1 || nameLower === display2 || nameLower === full
      );
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
        const mIncNames = incomp1
          .map((incId: any) => {
            const fx = allMins.find((x) => String(x.id) === String(incId));
            return fx
              ? (fx.nome || "")
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
              : "";
          })
          .filter(Boolean);

        const pIncNames = incomp2
          .map((incId: any) => {
            const fx = allMins.find((x) => String(x.id) === String(incId));
            return fx
              ? (fx.nome || "")
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
              : "";
          })
          .filter(Boolean);

        const mNameNorm = (m.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const pNameNorm = (p.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        incompByName =
          mIncNames.some(
            (name) => pNameNorm.includes(name) || name.includes(pNameNorm),
          ) ||
          pIncNames.some(
            (name) => mNameNorm.includes(name) || name.includes(mNameNorm),
          );
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
  if (
    !ministerList ||
    ministerList.length <= 1 ||
    !allMins ||
    allMins.length === 0
  )
    return 0;

  const scaledMinisters: any[] = [];
  const itemMap = new Map<string, any>();

  ministerList.forEach((mItem) => {
    if (!mItem) return;
    const mId = mItem.id !== undefined ? String(mItem.id) : String(mItem);

    // Find minister in allMinisters by ID first
    let found = allMins.find((m) => String(m.id) === mId);

    // Fallback search by name if ID did not match
    if (!found && mItem.nome) {
      const itemNomeNorm = mItem.nome
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      found = allMins.find((m) => {
        const display1 = (m.nomeExibicao || m.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const display2 = (m.nomeExibicaoConjuge || m.nomeConjuge || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const full = (m.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (m.tipo === "casal") {
          const expectedCoupled = `${display1} e ${display2}`
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (itemNomeNorm === expectedCoupled) return true;
          if (
            itemNomeNorm.includes(display1) &&
            itemNomeNorm.includes(display2)
          )
            return true;
        }
        return (
          itemNomeNorm === display1 ||
          itemNomeNorm === display2 ||
          itemNomeNorm === full
        );
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
        const mIncNames = incomp1
          .map((incId: any) => {
            const fx = allMins.find((x) => String(x.id) === String(incId));
            return fx
              ? (fx.nome || "")
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
              : "";
          })
          .filter(Boolean);

        const pIncNames = incomp2
          .map((incId: any) => {
            const fx = allMins.find((x) => String(x.id) === String(incId));
            return fx
              ? (fx.nome || "")
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
              : "";
          })
          .filter(Boolean);

        const mNameNorm = (m.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const pNameNorm = (p.nome || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        incompByName =
          mIncNames.some(
            (name) => pNameNorm.includes(name) || name.includes(pNameNorm),
          ) ||
          pIncNames.some(
            (name) => mNameNorm.includes(name) || name.includes(mNameNorm),
          );
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
        : m.tipo === "casal";
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
          leitoresList: [],
        };
      }

      let peso = pesoPadrao;
      if (slot.modo === "ele" || slot.modo === "ela") peso = 1;
      else if (slot.modo === "casal") peso = 2;

      const ministerInfo = {
        id: d.ministro_id,
        tipo: d.tipo,
        isCasalActive:
          slot.modo === "casal" || (!slot.modo && d.tipo === "casal"),
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

                      const stats = availabilityStats[lookupChave] || {
                        ministros: 0,
                        leitores: 0,
                        ministrosList: [],
                        leitoresList: [],
                      };

                      const discount = getIncompatibilityDiscountForList(
                        stats.ministrosList || [],
                        allMinisters,
                      );
                      const adjustedMinistros = Math.max(
                        0,
                        stats.ministros - discount,
                      );

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
                                Ministros {adjustedMinistros} /{" "}
                                {limits.ministros}
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
          if (missa.ministros) {
            let sortedMin = [...missa.ministros];
            const normalizeStr = (s: any) => s ? String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
            if (missa.lider) {
              const normalizedL = normalizeStr(missa.lider);
              sortedMin.sort((a: string, b: string) => {
                const normalizedA = normalizeStr(a);
                const normalizedB = normalizeStr(b);
                const isALider = isMinisterLeader(a, missa.lider);
                const isBLider = isMinisterLeader(b, missa.lider);
                if (isALider && !isBLider) return -1;
                if (!isALider && isBLider) return 1;
                return a.localeCompare(b, "pt-BR");
              });
              sortedMin = sortedMin.map((m: string) => {
                return formatMinisterWithLeader(m, missa.lider);
              });
            }
            let pdfHeadcount = 0;
            (missa.ministros || []).forEach((m: any) => {
              const mName = typeof m === "string" ? m : m?.nome || "";
              if (mName.includes(" e ")) pdfHeadcount += 2;
              else pdfHeadcount += 1;
            });
            const pdfLimite = missa?.limiteManual !== undefined ? Number(missa.limiteManual) : 8;
            const missingSlots = Math.max(0, pdfLimite - pdfHeadcount);
            for (let i = 0; i < missingSlots; i++) {
              sortedMin.push("[AGUARDANDO]");
            }
            corpo += sortedMin.join("\n");
          }
          if (missa.leitores && missa.leitores.length > 0)
            corpo += "\nL: " + missa.leitores.join(", ");
        }
        missasData.push({ horario, corpo, lider: missa.lider });
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

          // Corpo (Normal, Smaller, Bold + Blue for Leader)
          doc.setFontSize(6.5);
          const lines = doc.splitTextToSize(m.corpo, cell.width - 3);
          lines.forEach((line: string) => {
            const isLeader = isMinisterLeader(line, m.lider);
            if (isLeader) {
              doc.setFont("helvetica", "bold");
              doc.setTextColor(30, 58, 138); // blue-900
            } else {
              doc.setFont("helvetica", "normal");
              const defaultColor = isSunday ? [220, 38, 38] : [0, 0, 0];
              doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
            }
            doc.text(line, cell.x + cell.width / 2, currentY, {
              align: "center",
            });
            currentY += 2.8;
          });
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
      const normalizeStr = (s: any) => s ? String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
      const normalizedL = normalizeStr(missa.lider);
      let listHeadcount = 0;
      (missa.ministros || []).forEach((m: any) => {
        const mName = typeof m === "string" ? m : m?.nome || "";
        if (mName.includes(" e ")) listHeadcount += 2;
        else listHeadcount += 1;
      });
      const listLimite = missa?.limiteManual !== undefined ? Number(missa.limiteManual) : 8;
      const missingListSlots = Math.max(0, listLimite - listHeadcount);

      const sortedMin = [...(missa.ministros || [])].sort((a: string, b: string) => {
        const isALider = isMinisterLeader(a, missa.lider);
        const isBLider = isMinisterLeader(b, missa.lider);
        if (isALider && !isBLider) return -1;
        if (!isALider && isBLider) return 1;
        return a.localeCompare(b, "pt-BR");
      }).map(m => formatMinisterWithLeader(m, missa.lider));

      for (let i = 0; i < missingListSlots; i++) {
        sortedMin.push("[AGUARDANDO]");
      }
      const nomeMissa = missa.nome ? `[${missa.nome}] ` : "";
      const cellObj = {
        content: `${nomeMissa}${sortedMin.join(" - ")}`,
        customData: {
          nomeMissa,
          sortedMin,
          lider: missa.lider,
        },
      };

      tableBody.push([
        index === 0 ? dayLabel : "",
        index === 0 ? weekdayLabel : "",
        horario,
        cellObj,
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
      if (data.section === "body" && data.column.index === 3) {
        const raw = data.cell.raw as any;
        if (raw && raw.customData) {
          data.cell.styles.textColor = [255, 255, 255]; // Hide default text so custom renderer takes over
          (data.cell as any).customData = raw.customData;
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const cell = data.cell as any;
        if (cell.customData) {
          const { nomeMissa, sortedMin, lider } = cell.customData;
          const doc = data.doc;
          doc.setFontSize(6.8);

          let currentX = cell.x + 1.2;
          let currentY = cell.y + 2.5;
          const maxX = cell.x + cell.width - 1.2;
          const lineHeight = 2.8;

          if (nomeMissa) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(nomeMissa, currentX, currentY);
            currentX += doc.getTextWidth(nomeMissa);
          }

          sortedMin.forEach((mName: string, idx: number) => {
            const isL = mName.startsWith("* ");
            const separator = idx < sortedMin.length - 1 ? " - " : "";

            doc.setFont("helvetica", isL ? "bold" : "normal");
            doc.setTextColor(isL ? 30 : 0, isL ? 58 : 0, isL ? 138 : 0);

            const nameWidth = doc.getTextWidth(mName);
            if (currentX + nameWidth > maxX && currentX > cell.x + 1.5) {
              currentX = cell.x + 1.2;
              currentY += lineHeight;
            }
            doc.text(mName, currentX, currentY);
            currentX += nameWidth;

            if (separator) {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(0, 0, 0);
              const sepWidth = doc.getTextWidth(separator);
              if (currentX + sepWidth > maxX && currentX > cell.x + 1.5) {
                currentX = cell.x + 1.2;
                currentY += lineHeight;
              }
              doc.text(separator, currentX, currentY);
              currentX += sepWidth;
            }
          });
        }
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


function SubmittedSlotsConsultation({
  submittedList,
  allSlots,
  mes,
  ano,
  user,
}: {
  submittedList: any[];
  allSlots?: any[];
  mes?: number;
  ano?: number;
  user?: any;
}) {
  if (!submittedList || submittedList.length === 0) return null;

  const isCasalUser =
    user?.tipo === "casal" ||
    !!(user?.nomeConjuge && user.nomeConjuge.trim().length > 0) ||
    !!(user?.nomeExibicaoConjuge && user.nomeExibicaoConjuge.trim().length > 0);

  const nameEle = (
    user?.nomeExibicao ||
    user?.nome ||
    "Ele"
  )
    .trim()
    .split(" ")[0];

  const nameEla = (
    user?.nomeExibicaoConjuge ||
    user?.nomeConjuge ||
    "Ela"
  )
    .trim()
    .split(" ")[0];

  const normalizeModo = (m: string | null | undefined): string => {
    if (!m) return "individual";
    const clean = m.trim().toLowerCase();
    if (clean === "ele" || clean === "marido" || clean === "esposo" || clean === "titular") {
      return "ele";
    }
    if (clean === "ela" || clean === "esposa" || clean === "conjuge") {
      return "ela";
    }
    if (clean === "casal" || clean === "ambos") {
      return "casal";
    }
    return "individual";
  };

  const resolved = submittedList
    .map((item: any) => {
      const matched = (allSlots || []).find((s: any) => s.id === item.id);
      const data = item.data || matched?.data || "";
      const horario = item.horario || matched?.horario || "";
      const nomeMissa = item.nomeMissa || matched?.nome || "Missa";
      let rawModo = item.modo || matched?.modo;
      let modo = normalizeModo(rawModo);
      
      // Se for casal, e o modo for individual (indefinido), assumimos casal/ambos
      if (isCasalUser && modo === "individual") {
        modo = "casal";
      }
      
      const diaFormatado = matched?.diaFormatado;
      return {
        id: item.id,
        data,
        horario,
        nomeMissa,
        modo,
        diaFormatado,
      };
    })
    .sort((a: any, b: any) => {
      if (!a.data || !b.data) return 0;
      const cmp = a.data.localeCompare(b.data);
      if (cmp !== 0) return cmp;
      return (a.horario || "").localeCompare(b.horario || "");
    });

  let mesAnoHeader = "";
  if (mes && ano) {
    try {
      const d = new Date(ano, mes - 1, 1);
      mesAnoHeader = format(d, "MMMM de yyyy", { locale: ptBR });
      mesAnoHeader = mesAnoHeader.charAt(0).toUpperCase() + mesAnoHeader.slice(1);
    } catch (e) {
      mesAnoHeader = "";
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto my-6 text-left bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            Minhas Datas Enviadas {mesAnoHeader ? `• ${mesAnoHeader}` : ""}
          </span>
        </div>
        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
          {resolved.length} {resolved.length === 1 ? "missa" : "missas"}
        </span>
      </div>
      <div className="p-3 divide-y divide-slate-100 max-h-[320px] overflow-y-auto custom-scrollbar">
        {resolved.map((slot: any, idx: number) => {
          let dateTitle = slot.data;
          try {
            if (slot.diaFormatado) {
              dateTitle = slot.diaFormatado;
            } else if (slot.data) {
              const d = new Date(slot.data + "T00:00:00");
              dateTitle = format(d, "EEEE, dd de MMMM", { locale: ptBR });
            }
          } catch (e) {
            dateTitle = slot.data;
          }
          if (dateTitle) {
            dateTitle = dateTitle.charAt(0).toUpperCase() + dateTitle.slice(1);
          }
          
          const isEle = slot.modo === "ele";
          const isEla = slot.modo === "ela";
          const isCasalSlot = slot.modo === "casal";

          return (
            <div
              key={slot.id || idx}
              className="py-2.5 px-2 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate capitalize">
                    {dateTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {slot.nomeMissa}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isCasalSlot && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                    Ambos
                  </span>
                )}
                {isEle && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                    {nameEle}
                  </span>
                )}
                {isEla && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                    {nameEla}
                  </span>
                )}
                {!isCasalSlot && !isEle && !isEla && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                    Individual
                  </span>
                )}
                {slot.horario && (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {slot.horario}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-500 font-medium">
          Apenas para consulta. Para solicitar alterações nas suas datas, contate a coordenação.
        </p>
      </div>
    </div>
  );
}

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
  setSlotsDisponiveisApp,
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
  isCoordenador: isCoordenadorProp,
  error: parentError,
  message: parentMessage,
  setDownloadOptionMode,
  regraDisponibilidade: initialRegraDisponibilidade,
  onTabChange,
}) {
  const [dailyGospel, setDailyGospel] = useState<{
    text: string;
    ref: string;
    vaticanUrl: string;
    papasText: string;
    liturgia?: Array<{ id: string; titulo: string; referencia: string; paragrafos: string[] }>;
  }>({
    text: "Carregando...",
    ref: "",
    vaticanUrl: "https://www.vaticannews.va/pt/palavra-do-dia.html",
    papasText: "",
    liturgia: [],
  });
  const [activeGospelTabId, setActiveGospelTabId] = useState<string>("tab-evangelho");
  const [fontScale, setFontScale] = useState(1);
  const [enfermoPatientName, setEnfermoPatientName] = useState("");
  const [classicWebMode, setClassicWebMode] = useState<boolean>(false);
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const [showGerarEscalaModal, setShowGerarEscalaModal] = useState(false);
  const [showConferenciaModal, setShowConferenciaModal] = useState(false);
  const [conferenciaMes, setConferenciaMes] = useState<number>(0);
  const [conferenciaAno, setConferenciaAno] = useState<number>(0);
  const [escalaConferencia, setEscalaConferencia] = useState<any>(null);
  const [loadingConferencia, setLoadingConferencia] = useState<boolean>(false);
  const [mesGerar, setMesGerar] = useState(Number(mesSelecionado));
  const [anoGerar, setAnoGerar] = useState(Number(anoSelecionado));

  // Real-time discreet clock state for Coordination view
  const [liveDateTime, setLiveDateTime] = useState({
    weekday: "",
    date: "",
    time: ""
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      
      const weekdayStr = now.toLocaleDateString('pt-BR', { weekday: 'long' });
      const capitalizedWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);
      
      const dateStr = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setLiveDateTime({
        weekday: capitalizedWeekday,
        date: dateStr,
        time: timeStr
      });
    };

    updateClock(); // Initial run
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Sync with global selections
  useEffect(() => {
    setMesGerar(Number(mesSelecionado));
    setAnoGerar(Number(anoSelecionado));
  }, [mesSelecionado, anoSelecionado]);

  const isCoordenadorInitial = hasCoordAccess(user);

  // Use a unified isCoordenador check that respects both the prop and the current user role
  const isActualCoord = isCoordenadorProp || isCoordenadorInitial;

  const [customEventsApp, setCustomEventsApp] = useState<any[]>([]);
  const [readEventIdsApp, setReadEventIdsApp] = useState<string[]>(() => {
    try {
      const userKey = user?.id || user?.telefone || "guest";
      return JSON.parse(localStorage.getItem(`read_events_${userKey}`) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleEventsReadUpdate = () => {
      try {
        const userKey = user?.id || user?.telefone || "guest";
        setReadEventIdsApp(
          JSON.parse(localStorage.getItem(`read_events_${userKey}`) || "[]"),
        );
      } catch {
        // ignore
      }
    };
    window.addEventListener("events_read_updated", handleEventsReadUpdate);
    window.addEventListener("storage", handleEventsReadUpdate);
    return () => {
      window.removeEventListener("events_read_updated", handleEventsReadUpdate);
      window.removeEventListener("storage", handleEventsReadUpdate);
    };
  }, [user?.id, user?.telefone]);

  useEffect(() => {
    if (user && user.paroquia) {
      safeFetchJson<any[]>(`/api/eventos?paroquia=${encodeURIComponent(user.paroquia)}`, undefined, [])
        .then((data) => {
          if (Array.isArray(data)) {
            setCustomEventsApp(data);
          }
        })
        .catch((err) =>
          console.error("Erro ao buscar eventos em CoordenacaoView:", err),
        );
    }
  }, [user?.paroquia]);

  const [activeTab, setActiveTab] = useState(
    needsPasswordReset ? "editar" : "home",
  );
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerType | null>(null);
  const [selectedEscalaMonth, setSelectedEscalaMonth] = useState<string>("");

  const [vigilGospel, setVigilGospel] = useState<any | null>(null);

  // Ao entrar em modo de impersonação (Espelho), força voltar para a aba Dashboard (home)
  useEffect(() => {
    if (originalUser) {
      setActiveTab("home");
    }
  }, [originalUser, user?.id]);

  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);
  const hasSubmittedGlobal = (initialSlotsSelecionados || []).length > 0;

  useEffect(() => {
    safeFetchJson<any>("/api/liturgia", undefined, null)
      .then((data) => {
        if (data && data.evangelho) {
          const lit = data.liturgia || [];
          setDailyGospel({
            text: data.evangelho.texto || "",
            ref: data.evangelho.referencia || "",
            vaticanUrl: data.evangelho.vaticanUrl || "https://www.vaticannews.va/pt/palavra-do-dia.html",
            papasText: data.evangelho.papasText || "",
            liturgia: lit,
          });
          if (lit.length > 0) {
            const evTab = lit.find((t: any) => t.id.includes('evangelho') || t.titulo.toLowerCase().includes('evangelho'));
            if (evTab) {
              setActiveGospelTabId(evTab.id);
            } else {
              setActiveGospelTabId(lit[0].id);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar liturgia Vatican News em App.tsx:", err);
        setDailyGospel({
          text: "Não foi possível carregar a liturgia.",
          ref: "",
          papasText: "",
          vaticanUrl: "https://www.vaticannews.va/pt/palavra-do-dia.html",
          liturgia: [],
        });
      });
  }, []);
  const [subTab, setSubTab] = useState<string | null>(null);

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

  const anyBirthdayToday = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    return (aniversariantes || []).filter((a: any) => {
      const birthDia = parseInt(a.dia);
      return birthDia === todayDay;
    });
  }, [aniversariantes]);

  const [selectedBirthdayDay, setSelectedBirthdayDay] = useState<number | null>(
    null,
  );
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

  // Fetch personal availability (or simulated user's availability) when viewing the personal availability tab or changing selected month/year
  useEffect(() => {
    if (activeTab === "disponibilidade" && user?.telefone) {
      const fetchAvailability = async () => {
        // Clear current selection first
        setSlotsSelecionados([]);
        
        try {
          const response = await fetch(
            `/api/disponibilidade/${encodeURIComponent(user.telefone)}?mes=${mesSelecionado}&ano=${anoSelecionado}`,
          );
          if (response.ok) {
            const data = await response.json();
            const ids = data.map((d: any) => {
              const id = normalizeId(`${d.data}-${d.horario}-${d.nomeMissa}`);
              return { id, modo: d.modo || "individual", data: d.data, horario: d.horario, nomeMissa: d.nomeMissa };
            });
            setInitialSlotsSelecionados(ids);
            setSlotsSelecionados(ids);
          }
        } catch (error) {
          console.error("Erro ao buscar disponibilidade:", error);
        }
      };
      
      fetchAvailability();
    }
  }, [activeTab, mesSelecionado, anoSelecionado, user?.telefone]);

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
          console.log(
            `[DEBUG] Filtering date ${date} (Obj: ${dateObj}) < ${firstDayOfCurrentMonth}`,
          );
          return acc;
        }

        const month = date.substring(0, 7);
        // Coordenadores devem ver todos os meses para gestão.
        // Já para a visualização pública (EscalaView), filtramos meses publicados.
        const isCoord = hasCoordAccess(user);

        const currentMonthStr = format(today, "yyyy-MM");
        const explicitMonthPublic =
          escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined
            ? escalaPublicadaPorMes[month]
            : null;
        const isMonthPublic =
          explicitMonthPublic === true ||
          (explicitMonthPublic === null && escalaPublicada === true) ||
          month === currentMonthStr;

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
  const [limiteNovos, setLimiteNovos] = useState<number | "livre">(2);
  const [regraDisponibilidade, setRegraDisponibilidade] = useState<
    "livre" | "regra2" | "regra3"
  >("regra2");
  const [lembreteAutomatico, setLembreteAutomatico] = useState(false);
  const [enviandoLembretes, setEnviandoLembretes] = useState(false);

  useEffect(() => {
    if (initialRegraDisponibilidade) {
      setRegraDisponibilidade(initialRegraDisponibilidade);
    }
  }, [initialRegraDisponibilidade]);
  const [stats, setStats] = useState({
    totalMinistros: 0,
    totalDisponibilidades: 0,
    totalAniversariantes: 0,
    pendingApprovals: 0,
    lowStockCount: 0,
    pontualidade: 100,
    totalFaltasMes: 0,
    totalEscaladosMes: 0,
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
  const [showWeekendReminder, setShowWeekendReminder] = useState(false);
  const [trocas, setTrocas] = useState<any[]>([]);

  const fetchTrocas = useCallback(async () => {
    try {
      let url = `/api/trocas?paroquia=${encodeURIComponent(user?.paroquia || "")}`;
      if (user?.id && !isActualCoord) {
        url += `&ministroId=${user.id}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const ct = response.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const data = await response.json();
          if (Array.isArray(data)) {
            data.sort((a: any, b: any) => {
              const dateA = a.dataSolicitacao
                ? new Date(a.dataSolicitacao).getTime()
                : 0;
              const dateB = b.dataSolicitacao
                ? new Date(b.dataSolicitacao).getTime()
                : 0;
              return dateB - dateA;
            });
          }
          setTrocas(data);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar trocas:", e);
    }
  }, [user?.paroquia, user?.id, isActualCoord]);

  useEffect(() => {
    fetchTrocas();
    const interval = setInterval(fetchTrocas, 20000);
    return () => clearInterval(interval);
  }, [fetchTrocas]);

  // Swap request modal states
  const [showSolicitarTrocaModal, setShowSolicitarTrocaModal] = useState(false);
  const [showTrocasRapidasModal, setShowTrocasRapidasModal] = useState(false);
  const [quickSwapSlotA, setQuickSwapSlotA] = useState<any>(null);
  const [quickSwapSlotB, setQuickSwapSlotB] = useState<any>(null);
  const [quickSwapMemberA, setQuickSwapMemberA] = useState<"both" | "c1" | "c2">("both");
  const [quickSwapMemberB, setQuickSwapMemberB] = useState<"both" | "c1" | "c2">("both");
  const [isSubmittingQuickSwap, setIsSubmittingQuickSwap] = useState(false);
  const [trocaMissaOrigem, setTrocaMissaOrigem] = useState<any | null>(null);
  const [trocaTipo, setTrocaTipo] = useState<"direta" | "substituto">("direta");
  const [trocaMissaDestino, setTrocaMissaDestino] = useState<any | null>(null);
  const [trocaDestinatario, setTrocaDestinatario] = useState<any | null>(null);
  const [isSubmittingTroca, setIsSubmittingTroca] = useState(false);
  const [trocaBuscaTerm, setTrocaBuscaTerm] = useState("");
  const [trocaTabFiltro, setTrocaTabFiltro] = useState<
    "pendentes" | "historico"
  >("pendentes");
  const [showCharts, setShowCharts] = useState(false);

  const getMonthFromSwap = useCallback((t: any) => {
    if (t.missaOrigemData) {
      const parts = t.missaOrigemData.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return parseInt(parts[1], 10);
        } else {
          return parseInt(parts[1], 10);
        }
      }
    }
    if (t.dataSolicitacao) {
      const d = new Date(t.dataSolicitacao);
      if (!isNaN(d.getTime())) {
        return d.getMonth() + 1;
      }
    }
    return null;
  }, []);

  const statsTrocas = useMemo(() => {
    const total = trocas.length;
    if (total === 0) return { total: 0, porMes: [], porStatus: [] };

    const mesCounts: { [key: number]: number } = {};
    trocas.forEach((t: any) => {
      const month = getMonthFromSwap(t);
      if (month !== null) {
        mesCounts[month] = (mesCounts[month] || 0) + 1;
      }
    });

    const MONTH_NAMES = [
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

    const porMes = Object.keys(mesCounts)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => {
        const count = mesCounts[m];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return {
          monthNum: m,
          name: MONTH_NAMES[m - 1],
          count,
          percentage: pct,
        };
      });

    const statusCounts: { [key: string]: number } = {
      aprovado: 0,
      pendente: 0,
      rejeitado: 0,
    };

    trocas.forEach((t: any) => {
      if (t.status === "aprovado") {
        statusCounts.aprovado++;
      } else if (
        t.status === "pendente_destinatario" ||
        t.status === "pendente_coordenacao"
      ) {
        statusCounts.pendente++;
      } else {
        statusCounts.rejeitado++;
      }
    });

    const porStatus = [
      {
        label: "Aprovadas",
        key: "aprovado",
        count: statusCounts.aprovado,
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
      },
      {
        label: "Pendentes",
        key: "pendente",
        count: statusCounts.pendente,
        color: "bg-amber-500",
        textColor: "text-amber-700",
      },
      {
        label: "Recusadas",
        key: "rejeitado",
        count: statusCounts.rejeitado,
        color: "bg-rose-500",
        textColor: "text-rose-700",
      },
    ].map((s) => {
      const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
      return { ...s, percentage: pct };
    });

    return { total, porMes, porStatus };
  }, [trocas, getMonthFromSwap]);

  // Custom couple swap states
  const [solicitanteSubMembro, setSolicitanteSubMembro] = useState<
    "ambos" | "marido" | "esposa"
  >("ambos");
  const [destinatarioSubMembro, setDestinatarioSubMembro] = useState<
    "ambos" | "marido" | "esposa"
  >("ambos");
  const [segundoDestinatario, setSegundoDestinatario] = useState<any | null>(
    null,
  );
  const [substituirPorDoisIndividuais, setSubstituirPorDoisIndividuais] =
    useState<boolean>(false);
  const [escolhendoSegundoIndiv, setEscolhendoSegundoIndiv] =
    useState<boolean>(false);

  const getSwapSolicitanteDisplay = useCallback(
    (t: any) => {
      if (!t) return "";
      const min = allMinisters.find((m: any) => m.id === t.solicitanteId);
      if (min && min.tipo === "casal") {
        if (t.solicitanteSubMembro === "marido") {
          return min.nomeExibicao || min.nome;
        }
        if (t.solicitanteSubMembro === "esposa") {
          return min.nomeExibicaoConjuge || min.nomeConjuge || min.nome;
        }
      }
      return t.solicitanteNome;
    },
    [allMinisters],
  );

  const getSwapDestinatarioDisplay = useCallback(
    (t: any) => {
      if (!t) return "";
      const min = allMinisters.find((m: any) => m.id === t.destinatarioId);
      if (min && min.tipo === "casal") {
        if (t.destinatarioSubMembro === "marido") {
          return min.nomeExibicao || min.nome;
        }
        if (t.destinatarioSubMembro === "esposa") {
          return min.nomeExibicaoConjuge || min.nomeConjuge || min.nome;
        }
      }
      return t.destinatarioNome;
    },
    [allMinisters],
  );

  const isMinisterScheduledOnDayOrWeek = useCallback(
    (candidateMin: any, targetDateStr: string) => {
      if (!escala || !candidateMin) return false;

      // Get candidate's possible names
      const names = [
        candidateMin.nome,
        candidateMin.nomeExibicao,
        candidateMin.nomeConjuge,
        candidateMin.nomeExibicaoConjuge,
      ]
        .filter(Boolean)
        .map((n) =>
          n
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        );

      const targetDate = parseISO(targetDateStr);
      const targetWeek = getWeek(targetDate);
      const targetYear = getYear(targetDate);

      // Scan all slots in escala
      for (const [dateKey, hours] of Object.entries(escala)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
        const slotDate = parseISO(dateKey);

        const isSameD = isSameDay(slotDate, targetDate);
        const isSameW =
          getWeek(slotDate) === targetWeek && getYear(slotDate) === targetYear;

        if (isSameD || isSameW) {
          // If scheduled anywhere on this day or week
          const missas = hours as any;
          for (const missa of Object.values(missas)) {
            const ministros = (missa as any).ministros || [];
            for (const mName of ministros) {
              const normalizedMName = mName
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              if (
                names.some(
                  (name) =>
                    normalizedMName === name || normalizedMName.includes(name),
                )
              ) {
                return true;
              }
            }
          }
        }
      }
      return false;
    },
    [escala],
  );

  const futurePublishedSlots = useMemo(() => {
    const slots: any[] = [];
    if (!escala) return slots;

    // Scan all slots in escala
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    Object.entries(escala).forEach(([dateStr, hours]: [string, any]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (dateStr < todayStr) return;

      Object.entries(hours).forEach(([timeStr, missa]: [string, any]) => {
        const ministros = missa.ministros || [];

        // We only care about other ministers' assignments
        ministros.forEach((mName: string) => {
          if (!mName || typeof mName !== "string") return;
          // Normalize
          const normMName = mName
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          // Find matching minister record from allMinisters to get their ID and telephone if possible
          const matchedMin = allMinisters.find((am: any) => {
            if (!am || !am.nome || typeof am.nome !== "string") return false;
            const amName = am.nome
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const amExib = (am.nomeExibicao || "")
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            return (
              normMName === amName ||
              normMName.includes(amName) ||
              (amExib && (normMName === amExib || normMName.includes(amExib)))
            );
          });

          slots.push({
            date: dateStr,
            time: timeStr,
            missaNome: missa.descricao || missa.nome || "Missa",
            ministerName: mName,
            ministerId: matchedMin ? matchedMin.id : null,
            ministerTelefone: matchedMin ? matchedMin.telefone : null,
            tipo: (() => {
              if (!matchedMin) return "individual";
              if (matchedMin.tipo === "casal") {
                const normMNameLower = mName.toLowerCase();
                const hasCoupleSeparator = normMNameLower.includes(" e ") || normMNameLower.includes(" & ");
                if (!hasCoupleSeparator) {
                  return "individual";
                }
              }
              return matchedMin.tipo;
            })(),
            conjuge1: matchedMin ? (matchedMin.nomeExibicao || matchedMin.nome) : null,
            conjuge2: matchedMin ? (matchedMin.nomeExibicaoConjuge || matchedMin.nomeConjuge) : null,
            originalSlot: missa,
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

  const handleResponderMinistro = async (
    trocaId: string,
    resposta: "aceitar" | "rejeitar",
  ) => {
    try {
      const response = await fetch(
        `/api/trocas/${trocaId}/responder-ministro`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resposta }),
        },
      );
      if (response.ok) {
        onAlert({
          type: "success",
          text:
            resposta === "aceitar"
              ? "Você aceitou a solicitação. Pendente de aprovação da coordenação!"
              : "Você rejeitou o pedido de troca.",
        });
        fetchTrocas();
        setActiveTab("trocas");
      } else {
        const err = await response.json();
        onAlert({
          type: "error",
          text: err.error || "Erro ao responder solicitação.",
        });
      }
    } catch (e) {
      console.error(e);
      onAlert({ type: "error", text: "Erro de conexão." });
    }
  };

  const handleResponderCoordenador = async (
    trocaId: string,
    resposta: "aprovar" | "rejeitar",
  ) => {
    try {
      const response = await fetch(
        `/api/trocas/${trocaId}/responder-coordenador`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resposta }),
        },
      );
      if (response.ok) {
        onAlert({
          type: "success",
          text:
            resposta === "aprovar"
              ? "Troca aprovada com sucesso! A escala foi atualizada."
              : "Troca recusada pela coordenação.",
        });
        fetchTrocas();
        setActiveTab("trocas");
        // Refresh scale view too
        if (typeof fetchData === "function") {
          fetchData(true);
        }
      } else {
        const err = await response.json();
        onAlert({
          type: "error",
          text: err.error || "Erro ao responder solicitação.",
        });
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

  const availableMinisters = useMemo(() => {
    return allMinisters;
  }, [allMinisters]);

  const [quickSwapViewModeB, setQuickSwapViewModeB] = useState<"slots" | "ministers">("slots");
  const [quickSwapSearchB, setQuickSwapSearchB] = useState("");

  const handleQuickSwap = async () => {
    if (!quickSwapSlotA || !quickSwapSlotB) {
      onAlert({ type: "error", text: "Selecione as duas celebrações para trocar." });
      return;
    }

    try {
      setIsSubmittingQuickSwap(true);
      const response = await fetch("/api/trocas/rapida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paroquia: user.paroquia,
          slotA: { 
            date: quickSwapSlotA.date, 
            time: quickSwapSlotA.time,
            ministerName: quickSwapSlotA.ministerName,
            member: quickSwapMemberA,
            tipo: quickSwapSlotA.tipo,
            conjuge1: quickSwapSlotA.conjuge1,
            conjuge2: quickSwapSlotA.conjuge2
          },
          slotB: quickSwapSlotB.isMinister 
            ? { 
                isMinister: true, 
                name: quickSwapSlotB.name,
                member: quickSwapMemberB,
                tipo: quickSwapSlotB.tipo,
                conjuge1: quickSwapSlotB.conjuge1,
                conjuge2: quickSwapSlotB.conjuge2
              }
            : { 
                date: quickSwapSlotB.date, 
                time: quickSwapSlotB.time,
                ministerName: quickSwapSlotB.ministerName,
                member: quickSwapMemberB,
                tipo: quickSwapSlotB.tipo,
                conjuge1: quickSwapSlotB.conjuge1,
                conjuge2: quickSwapSlotB.conjuge2
              },
        }),
      });

      if (response.ok) {
        onAlert({ type: "success", text: "Troca rápida realizada com sucesso!" });
        setShowTrocasRapidasModal(false);
        setQuickSwapSlotA(null);
        setQuickSwapSlotB(null);
        if (typeof fetchData === "function") {
          fetchData(true);
        }
        if (typeof fetchEscalaConferencia === "function") {
          fetchEscalaConferencia(conferenciaMes || Number(mesSelecionado), conferenciaAno || Number(anoSelecionado));
        }
        if (typeof fetchTrocas === "function") {
          fetchTrocas();
        }
      } else {
        const err = await response.json();
        onAlert({ type: "error", text: err.error || "Erro ao realizar troca rápida." });
      }
    } catch (e) {
      console.error(e);
      onAlert({ type: "error", text: "Erro de conexão." });
    } finally {
      setIsSubmittingQuickSwap(false);
    }
  };

  const handleDefinirLider = async (date: string, horario: string, ministerName: string) => {
    try {
      const response = await fetch("/api/escala/lider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paroquia: user.paroquia,
          data: date,
          horario: horario,
          lider: ministerName,
        }),
      });

      if (response.ok) {
        setEscala((prev: any) => {
          if (!prev || !prev[date] || !prev[date][horario]) return prev;
          const slot = prev[date][horario];
          return {
            ...prev,
            [date]: {
              ...prev[date],
              [horario]: Array.isArray(slot)
                ? { ministros: slot, lider: ministerName }
                : { ...slot, lider: ministerName },
            },
          };
        });

        setEscalaConferencia((prev: any) => {
          if (!prev || !prev[date] || !prev[date][horario]) return prev;
          const slot = prev[date][horario];
          return {
            ...prev,
            [date]: {
              ...prev[date],
              [horario]: Array.isArray(slot)
                ? { ministros: slot, lider: ministerName }
                : { ...slot, lider: ministerName },
            },
          };
        });

        if (setEscalaApp) {
          setEscalaApp((prev: any) => {
            if (!prev || !prev[date] || !prev[date][horario]) return prev;
            const slot = prev[date][horario];
            return {
              ...prev,
              [date]: {
                ...prev[date],
                [horario]: Array.isArray(slot)
                  ? { ministros: slot, lider: ministerName }
                  : { ...slot, lider: ministerName },
              },
            };
          });
        }

        onAlert({
          type: "success",
          text: `Líder de Missa definido: ${ministerName} (${date.split("-").reverse().join("/")} às ${horario})`,
        });
      } else {
        const err = await response.json();
        onAlert({ type: "error", text: err.error || "Erro ao definir líder da missa." });
      }
    } catch (err) {
      console.error("Erro ao definir líder da missa:", err);
      onAlert({ type: "error", text: "Erro de conexão ao definir líder da missa." });
    }
  };

  const handleEnviarSolicitacaoTroca = async () => {
    if (!trocaMissaOrigem || !trocaDestinatario) {
      onAlert({
        type: "error",
        text: "Por favor, selecione sua celebração e o ministro substituto/destino.",
      });
      return;
    }

    if (trocaTipo === "direta" && !trocaMissaDestino) {
      onAlert({
        type: "error",
        text: "Por favor, selecione a missa do destinatário para a troca.",
      });
      return;
    }

    if (substituirPorDoisIndividuais) {
      if (!segundoDestinatario) {
        onAlert({
          type: "error",
          text: "Por favor, selecione o segundo ministro substituto.",
        });
        return;
      }
      if (areMinistersOverlapping(trocaDestinatario, segundoDestinatario)) {
        onAlert({
          type: "error",
          text: "Não é possível selecionar o mesmo ministro ou membros do mesmo casal para ambos os slots.",
        });
        return;
      }
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
        missaOrigemMissa:
          trocaMissaOrigem.descricao || trocaMissaOrigem.nome || "Missa",
        tipo: trocaTipo,
        destinatarioId: trocaDestinatario.id,
        destinatarioNome:
          trocaDestinatario.nomeExibicao || trocaDestinatario.nome,
        destinatarioTelefone: trocaDestinatario.telefone,
        missaDestinoData:
          trocaTipo === "direta" ? trocaMissaDestino?.date : undefined,
        missaDestinoHorario:
          trocaTipo === "direta" ? trocaMissaDestino?.time : undefined,
        missaDestinoMissa:
          trocaTipo === "direta"
            ? trocaMissaDestino?.descricao || trocaMissaDestino?.nome
            : undefined,

        // Couple parameters
        solicitanteSubMembro:
          user.tipo === "casal" ? solicitanteSubMembro : "ambos",
        destinatarioSubMembro:
          trocaDestinatario.tipo === "casal" ? destinatarioSubMembro : "ambos",
        segundoDestinatarioId:
          substituirPorDoisIndividuais && segundoDestinatario
            ? segundoDestinatario.id
            : undefined,
        segundoDestinatarioNome:
          substituirPorDoisIndividuais && segundoDestinatario
            ? segundoDestinatario.nomeExibicao || segundoDestinatario.nome
            : undefined,
        segundoDestinatarioTelefone:
          substituirPorDoisIndividuais && segundoDestinatario
            ? segundoDestinatario.telefone
            : undefined,
      };

      const response = await fetch("/api/trocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onAlert({
          type: "success",
          text: "Solicitação de troca enviada com sucesso! O outro ministro receberá um aviso.",
        });
        setShowSolicitarTrocaModal(false);
        setTrocaMissaOrigem(null);
        setTrocaMissaDestino(null);
        setTrocaDestinatario(null);
        setSolicitanteSubMembro("ambos");
        setDestinatarioSubMembro("ambos");
        setSegundoDestinatario(null);
        setSubstituirPorDoisIndividuais(false);
        setEscolhendoSegundoIndiv(false);
        fetchTrocas();
      } else {
        const err = await response.json();
        onAlert({
          type: "error",
          text: err.error || "Erro ao solicitar troca.",
        });
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
      const parishMinisters = allMinisters
        .filter(
          (m) =>
            normalize(m.paroquia) === userParoquia &&
            Number.isInteger(Number(m.id)),
        )
        .sort((a, b) =>
          (a.nome || "").localeCompare(b.nome || "", "pt-BR", {
            sensitivity: "base",
          }),
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
        if (!missas || typeof missas !== 'object') return;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (dateStr >= todayStr) {
          Object.entries(missas).forEach(([time, missa]: [string, any]) => {
            if (!missa || typeof missa !== 'object') return;
            const ministros = Array.isArray(missa.ministros) ? missa.ministros : [];
            const matchedMinister = ministros.find((m: any) => isMinisterMatchingUser(m, user));

            if (matchedMinister) {
              const matchedName = (typeof matchedMinister === 'object' && matchedMinister !== null)
                ? (matchedMinister.nome || '')
                : matchedMinister;

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

      // Lembrete: Mostrar missas de hoje ou de amanhã (1 dia antes da celebração, independente do dia da semana)
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const reminderAssignments = allFoundAssignments.filter((assign) => {
        const [y, m, d] = assign.date.split('-').map(Number);
        const assignDateOnly = new Date(y, m - 1, d);
        const diffInDays = Math.round((assignDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        return diffInDays >= 0 && diffInDays <= 1;
      });

      if (reminderAssignments.length > 0) {
        setWeekendAssignments(reminderAssignments);
        setShowWeekendReminder(true);
      } else {
        setWeekendAssignments([]);
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
            isActualCoord: currentUser.isActualCoord,
          };
          sessionStorage.setItem("user", JSON.stringify(finalUser));
          return finalUser;
        });
        setMessage("Perfil atualizado com sucesso!");
        setTimeout(() => {
          setMessage("");
          setActiveTab("home");
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
  const fetchData = useCallback(async (force = false) => {
    if (!user?.paroquia) return;
    // Throttling: don't fetch data more than once every 3 seconds, unless forced
    const now = Date.now();
    if (!force && (now - lastFetchDataRef.current < 3000)) return;
    lastFetchDataRef.current = now;

    setLoading(true);
    console.log("[CoordenacaoView] Fetching data for paroquia:", user.paroquia);
    try {
      const [
        configRes,
        escalaRes,
        statsRes,
        niverRes,
        ministrosRes,
        msgRes,
        dispRes,
        vagasRes,
        pendingRes,
      ] = await Promise.allSettled([
        fetch(
          `/api/config?paroquia=${encodeURIComponent(user.paroquia)}&t=${now}`,
        ),
        fetch(
          `/api/escala?paroquia=${encodeURIComponent(user.paroquia)}${isActualCoord ? "&preview=true" : ""}&t=${now}`,
        ),
        fetch(
          `/api/stats?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}&t=${now}`,
        ),
        fetch(
          `/api/ministros/aniversariantes?paroquia=${encodeURIComponent(user.paroquia)}&mes=${new Date().getMonth() + 1}&t=${now}`,
        ),
        fetch(
          `/api/admin/ministros?paroquia=${encodeURIComponent(user.paroquia)}&t=${now}`,
        ),
        fetch(
          `/api/mensagens?paroquia=${encodeURIComponent(user.paroquia)}&type=direct&telefone=${encodeURIComponent(user?.telefone || "")}&t=${now}`,
        ),
        fetch(
          `/api/disponibilidade?paroquia=${encodeURIComponent(user.paroquia)}&t=${now}`,
        ),
        fetch(
          `/api/vagas?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesSelecionado}&ano=${anoSelecionado}&t=${now}`,
        ),
        activeTab === "cadastro"
          ? fetch(
              `/api/admin/pending?paroquia=${encodeURIComponent(user.paroquia)}&t=${now}`,
            )
          : Promise.resolve(null),
      ]);

      if (configRes.status === "fulfilled" && configRes.value && configRes.value.ok) {
        const config: any = await safeJson(configRes.value, {});
        if (config) {
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
          const loadedMax =
            config.maxEscalacoes !== undefined
              ? config.maxEscalacoes === 99 || config.maxEscalacoes === "99"
                ? "libre"
                : Number(config.maxEscalacoes)
              : 3;
          setMaxEscalacoes(loadedMax);
          const loadedNovos =
            config.limiteNovos !== undefined
              ? config.limiteNovos === "livre"
                ? "livre"
                : Number(config.limiteNovos)
              : 2;
          setLimiteNovos(loadedNovos);
          const loadedRegra =
            config.regraDisponibilidade !== undefined
              ? config.regraDisponibilidade
              : "regra2";
          setRegraDisponibilidade(loadedRegra);
          setLembreteAutomatico(config.lembreteAutomatico || false);
        }
      }

      if (escalaRes.status === "fulfilled" && escalaRes.value && escalaRes.value.ok) {
        const data = await safeJson(escalaRes.value, null);
        if (data) {
          setEscala(data);
          if (setEscalaApp) setEscalaApp(data);
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value && statsRes.value.ok) {
        const statsData = await safeJson(statsRes.value, null);
        if (statsData) setStats(statsData);
      }

      if (niverRes.status === "fulfilled" && niverRes.value && niverRes.value.ok) {
        const niverData = await safeJson(niverRes.value, []);
        if (niverData) setAniversariantes(niverData);
      }

      if (ministrosRes.status === "fulfilled" && ministrosRes.value && ministrosRes.value.ok) {
        const minData = await safeJson(ministrosRes.value, []);
        if (Array.isArray(minData)) {
          minData.sort((a: any, b: any) =>
            (a.nome || "").localeCompare(b.nome || "", "pt-BR", {
              sensitivity: "base",
            }),
          );
          setAllMinisters(minData);
        }
      }

      if (msgRes.status === "fulfilled" && msgRes.value && msgRes.value.ok) {
        const msgs = await safeJson(msgRes.value, []);
        if (msgs) setDirectMessages(msgs);
      }

      if (dispRes.status === "fulfilled" && dispRes.value && dispRes.value.ok) {
        const dispData = await safeJson(dispRes.value, []);
        if (dispData) setDisponibilidades(dispData);
      }

      if (vagasRes.status === "fulfilled" && vagasRes.value && vagasRes.value.ok) {
        const vagasData = await safeJson(vagasRes.value, {});
        if (vagasData) {
          setVagas(vagasData);
          setOcupacao(vagasData);
        }
      }

      if (pendingRes.status === "fulfilled" && pendingRes.value && (pendingRes.value as any)?.ok) {
        const pUsers = await safeJson(pendingRes.value as any, []);
        if (pUsers) setPendingUsers(pUsers);
      }

      if (setSlotsDisponiveisApp) {
        try {
          const slots = await getExpectedSlots(
            user.paroquia,
            mesSelecionado,
            anoSelecionado,
          );
          setSlotsDisponiveisApp(slots);
        } catch (slotErr) {
          console.warn("Erro ao obter slots esperados:", slotErr);
        }
      }
    } catch (err) {
      console.warn("Aviso ao buscar dados da coordenação:", err);
    } finally {
      setLoading(false);
    }
  }, [
    user?.paroquia,
    user?.role,
    isActualCoord,
    activeTab,
    mesSelecionado,
    anoSelecionado,
  ]);

  useEffect(() => {
    fetchData(true);
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

  const handleToggleLembreteAutomatico = async () => {
    const newState = !lembreteAutomatico;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paroquia: user.paroquia,
          lembreteAutomatico: newState,
        }),
      });
      if (response.ok) {
        setLembreteAutomatico(newState);
        setMessage(
          `Lembrete Automático ${newState ? "ATIVADO" : "DESATIVADO"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao atualizar lembrete automático:", err);
    }
  };

  const handleEnviarLembretesManual = async () => {
    setEnviandoLembretes(true);
    try {
      const response = await fetch(
        "/api/escala/enviar-lembretes-fim-de-semana",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paroquia: user.paroquia }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        onAlert(
          "Lembretes de Fim de Semana",
          `O envio de lembretes foi concluído! ${data.sentCount} novos lembretes foram enviados aos ministros escalados neste final de semana.`,
        );
      } else {
        onAlert(
          "Erro",
          "Não foi possível disparar os lembretes neste momento.",
        );
      }
    } catch (err) {
      console.error("Erro ao enviar lembretes:", err);
      onAlert("Erro", "Erro ao conectar com o servidor.");
    } finally {
      setEnviandoLembretes(false);
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
        `/api/escala/gerar?paroquia=${encodeURIComponent(user.paroquia)}&mes=${mesGerar}&ano=${anoGerar}&keep=${keepExisting ? "true" : "false"}`,
        { method: "POST" },
      );

      let novaEscala: any;
      let warningMsg: string | null = null;
      let warningDet: string | null = null;

      if (response.ok) {
        const resData = await response.json();
        if (response.status === 206 || resData?.warning === "INCOMPLETE_SCHEDULE") {
          novaEscala = resData.escala || resData;
          if (resData.warning === "INCOMPLETE_SCHEDULE" && Array.isArray(resData.details)) {
            warningMsg = "Vagas em Aberto";
            warningDet = resData.details.join("\n");
          }
        } else {
          novaEscala = resData;
        }
      }

      if (novaEscala) {
        setEscala(novaEscala);
        if (setEscalaApp) setEscalaApp(novaEscala);

        // Filtrar escala do mês correspondente para a conferência
        const mesStr = `${anoGerar}-${mesGerar.toString().padStart(2, "0")}`;
        const filtered = Object.keys(novaEscala).reduce(
          (acc: any, k: string) => {
            if (k.startsWith(mesStr)) {
              acc[k] = novaEscala[k];
            }
            return acc;
          },
          {},
        );

        setEscalaConferencia(filtered);
        setConferenciaMes(mesGerar);
        setConferenciaAno(anoGerar);
        setShowConferenciaModal(true);

        if (warningMsg) {
          onAlert(
            `Aviso: ${warningMsg}`,
            `A escala foi gerada, mas algumas missas não possuem ministros suficientes para preencher todas as vagas:\n\n${warningDet}`,
          );
          setMessage(
            "Escala gerada com avisos: Faltam ministros para algumas missas.",
          );
        } else {
          setMessage(
            `Escala de ${monthNames[mesGerar - 1]} / ${anoGerar} gerada com sucesso! Prossiga com a conferência.`,
          );
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
      const response = await fetch(
        `/api/escala?preview=true&paroquia=${encodeURIComponent(user.paroquia)}&t=${Date.now()}`,
      );
      if (response.ok) {
        const fullEscala = await response.json();
        const mesStr = `${ano}-${mes.toString().padStart(2, "0")}`;
        const filtered = Object.keys(fullEscala).reduce(
          (acc: any, k: string) => {
            if (k.startsWith(mesStr)) {
              acc[k] = fullEscala[k];
            }
            return acc;
          },
          {},
        );
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

  const gerarNovamenteEscala = async (
    mes: number,
    ano: number,
    keepExisting: boolean = false,
  ) => {
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
        const filtered = Object.keys(novaEscala).reduce(
          (acc: any, k: string) => {
            if (k.startsWith(mesStr)) {
              acc[k] = novaEscala[k];
            }
            return acc;
          },
          {},
        );
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
          await fetchData(true);
        }
        setShowConferenciaModal(false);
        onAlert(
          "Sucesso",
          `Escala de ${monthNames[mes - 1]} de ${ano} foi APROVADA e PUBLICADA com sucesso para todos os usuários!`,
        );
        setMessage(
          `Escala do mês ${mes}/${ano} aprovada e publicada com sucesso.`,
        );
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
          limiteNovos: limiteNovos === "livre" ? "livre" : Number(limiteNovos),
          regraDisponibilidade,
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
        fetchData(true);
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
        fetchData(true);
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
    const today = getTodayDateStringForLiturgy();
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
    const isCoord = hasCoordAccess(user);

    if (isCoord) {
      // For coordinators, show everything that is pending (even with minister)
      return trocas.filter(
        (t: any) =>
          t.status === "pendente_coordenacao" ||
          t.status === "pendente_destinatario",
      ).length;
    } else {
      return trocas.filter((t: any) => {
        // Needs action as target
        const needsAction =
          t.destinatarioId === user.id && t.status === "pendente_destinatario";

        // Needs acknowledgement from solicitor
        const solUnread =
          t.solicitanteId === user.id &&
          t.confirmadoSolicitante !== true &&
          (t.status === "aprovado" ||
            t.status === "rejeitado_coordenacao" ||
            t.status === "rejeitado_destinatario");

        // Needs acknowledgement from target
        const destUnread =
          t.destinatarioId === user.id &&
          t.confirmadoDestinatario !== true &&
          (t.status === "aprovado" || t.status === "rejeitado_coordenacao");

        return needsAction || solUnread || destUnread;
      }).length;
    }
  }, [trocas, user.id, user.role]);

  const unreadCalendarCount = useMemo(() => {
    if (!customEventsApp || customEventsApp.length === 0) return 0;
    const now = new Date();
    const isCoord = hasCoordAccess(user) || user?.isTesoureiro;

    // Check if user is a leader
    const normalizeStr = (s: string) =>
      s
        ? String(s)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
        : "";
    const currentUserNames = [
      user.nome,
      user.nomeExibicao,
      user.nomeConjuge,
      user.nomeExibicaoConjuge,
      user.nomeExibicaoConjuge || user.nomeConjuge,
      user.nomeExibicao || user.nome,
    ]
      .filter(Boolean)
      .map(normalizeStr);

    const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    const isLider = isLoggedAsConjuge
      ? Boolean(user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin')
      : Boolean(user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');

    const upcoming = customEventsApp.filter((evt: any) => {
      if (!evt.data) return false;

      // Check if it is an admin agenda event - only show to coordination users
      if (evt.criadoPorAdmin && !hasCoordAccess(user)) return false;

      // Check destinatario targeting for non-coordinators
      if (!isCoord && evt.destinatario && evt.destinatario !== "todos") {
        if (!user) return false;

        if (evt.destinatario === "lideres") {
          if (!isLider) return false;
        } else {
          const uId = String(user.id);
          const uName = (user.nome || user.nomeExibicao || "").toLowerCase();

          let matches = false;
          if (
            evt.alvoIds &&
            Array.isArray(evt.alvoIds) &&
            evt.alvoIds.includes(uId)
          ) {
            matches = true;
          } else if (evt.alvoId && String(evt.alvoId) === uId) {
            matches = true;
          } else if (evt.alvoNomes && Array.isArray(evt.alvoNomes)) {
            matches = evt.alvoNomes.some(
              (n: string) =>
                uName.includes(n.toLowerCase()) ||
                n.toLowerCase().includes(uName),
            );
          } else if (evt.alvoNome && uName) {
            matches =
              uName.includes(evt.alvoNome.toLowerCase()) ||
              evt.alvoNome.toLowerCase().includes(uName);
          }
          if (!matches) return false;
        }
      }

      const parts = evt.data.split("-").map(Number);
      if (parts.length !== 3) return false;
      const [y, m, d] = parts;

      let eventHour = 23;
      let eventMin = 59;
      if (
        evt.horario &&
        typeof evt.horario === "string" &&
        evt.horario.includes(":")
      ) {
        const hParts = evt.horario.split(":").map(Number);
        eventHour = hParts[0] || 0;
        eventMin = hParts[1] || 0;
      }

      const evtDateTime = new Date(y, m - 1, d, eventHour, eventMin, 0);
      const expirationTime = new Date(
        evtDateTime.getTime() + 2 * 60 * 60 * 1000,
      );

      if (now.getTime() > expirationTime.getTime()) {
        return false;
      }

      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const evtDayStart = new Date(y, m - 1, d, 0, 0, 0);
      const diffTime = evtDayStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    return upcoming.filter((evt: any) => !readEventIdsApp.includes(evt.id))
      .length;
  }, [customEventsApp, readEventIdsApp, user, escala]);

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
      label: "Gestão da Escala",
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
      id: "financeiro",
      label: "Tesouraria",
      icon: DollarSign,
      type: "ambos",
      scope: "financeiro",
    },
    {
      id: "faltas",
      label: "Faltas",
      icon: UserX,
      type: "coordenacao",
      scope: "faltas",
    },
    {
      id: "lideres",
      label: "Responsável pela Missa",
      icon: Flag,
      type: "coordenacao",
      scope: "lideres",
    },
    {
      id: "testes",
      label: "Testes",
      icon: Database,
      type: "admin",
      scope: "admin",
    },
    {
      id: "aniversariantes",
      label: "Aniversariantes",
      icon: Gift,
      type: "ambos",
      scope: "aniversariantes",
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
      id: "evangelho",
      label: "Evangelho",
      icon: BookOpen,
      type: "ambos",
      scope: "evangelho",
    },
    {
      id: "liturgia",
      label: "Liturgia Diária",
      icon: BookOpen,
      type: "ambos",
      scope: "liturgia",
    },
    {
      id: "oracoes",
      label: "Orações",
      icon: HandHeart,
      type: "ambos",
      scope: "oracoes",
    },
    {
      id: "enfermos",
      label: "Rito de Enfermos",
      icon: Cross,
      type: "ambos",
      scope: "enfermos",
    },
    {
      id: "calendario",
      label: "Calendário Litúrgico",
      icon: CalendarDays,
      badge: unreadCalendarCount,
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
      "isActualCoord:",
      isActualCoord,
    );
    if (tab.id === "aniversariantes" || tab.id === "oracoes") return true;
    if (tab.id === "testes") return user.role === "admin";

    // Tesouraria is restricted to coordinators or users designated as isTesoureiro
    if (tab.id === "financeiro") {
      const isTesoureiro = user?.isTesoureiro === true;
      const isCoord = hasCoordAccess(user);
      return isCoord || isTesoureiro;
    }

    if (isActualCoord) {
      return tab.id !== "testes";
    }
    // Ministro vê apenas as abas de ministro ou ambos, ignorando restritas de coordenador
    return tab.type === "ministro" || tab.type === "ambos";
  });

  return (
    <div
      className={`theme-${activeTab === "home" ? liturgyTheme : "blue"} bg-liturgy-50/50 min-h-screen w-full flex flex-col font-sans relative`}
    >
      <BackgroundLogo paroquia={user?.paroquia} />
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              {activeTab !== "home" && activeTab !== "welcome" && (
                <button
                  onClick={() => setActiveTab("home")}
                  className="mr-1 p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1 shadow-sm border border-slate-200/50"
                  title="Voltar ao início"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider pr-1">
                    Voltar
                  </span>
                </button>
              )}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${user.paroquiaBloqueada ? "bg-red-600" : themeClasses.bg}`}
              >
                <Church className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-[10px] tracking-widest uppercase">
                  {isActualCoord ? "Painel de Gestão" : "Portal do Ministro"}
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setClassicWebMode(!classicWebMode)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all shadow-sm"
              >
                {classicWebMode ? (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span className="sm:inline">Mobile</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-4 h-4" />
                    <span className="sm:inline">Versão Web</span>
                  </>
                )}
              </button>
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
                <span className="sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Fully Responsive, Auto-Wrapping, No Horizontal Scrollbar) */}
        {tabs.length > 0 && (
          <div className={`${classicWebMode ? 'block' : 'hidden'} border-t border-slate-100 bg-slate-50/30`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-start gap-1.5 sm:gap-2">
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
                        !isActualCoord &&
                        !hasException
                      ) {
                        setActiveTab("disponibilidade");
                        return;
                      }
                      setActiveTab(tab.id as any);
                      setViewAsMinister(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all relative ${
                      isActive
                        ? `${themeClasses.light} ${themeClasses.text} border ${themeClasses.border} shadow-sm font-black`
                        : "text-slate-600 hover:bg-slate-100 border border-transparent hover:text-slate-900"
                    }`}
                  >
                    {tab.id === "santo" ? (
                      <img
                        src="/santa_rita_cassia.jpg"
                        alt="Santo"
                        className="w-4 h-4 object-cover object-center rounded-full inline-block"
                        referrerPolicy="no-referrer"
                      />
                    ) : tab.id === "comunhao" ? (
                      <img
                        src="/hostia.jpg"
                        alt="Comunhão"
                        className="w-4 h-4 object-contain rounded-full shadow-2xs inline-block"
                        referrerPolicy="no-referrer"
                      />
                    ) : tab.id === "financeiro" ? (
                      <img
                        src="/tesouraria.jpg"
                        alt="Tesouraria"
                        className="w-4 h-4 object-contain inline-block"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold leading-none">
                      {tab.label}
                    </span>
                    {tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-sm">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
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

      {originalUser && originalUser.id === user.id && !isActualCoord && (
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
                <span className="text-[10px] font-normal opacity-80 mt-0.5">
                  Incluirá apenas os ministros necessários nas missas novas ou
                  vazias
                </span>
              </button>
              <button
                onClick={() => confirmGerarEscala(false)}
                className="w-full bg-red-50 text-red-700 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex flex-col items-center justify-center leading-tight"
              >
                <span>Zerar e Gerar Novamente</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">
                  Apagará todas as missas do mês e gerará tudo do zero
                </span>
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
                  Conferência de Escala: {monthNames[conferenciaMes - 1]} de{" "}
                  {conferenciaAno}
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
                  onClick={() =>
                    gerarNovamenteEscala(conferenciaMes, conferenciaAno, true)
                  }
                  className="px-4 py-3 bg-liturgy-600 hover:bg-liturgy-700 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingConferencia ? "animate-spin" : ""}`}
                  />
                  Preencher Vagas
                </button>
                <button
                  type="button"
                  disabled={loadingConferencia}
                  onClick={() =>
                    gerarNovamenteEscala(conferenciaMes, conferenciaAno, false)
                  }
                  className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingConferencia ? "animate-spin" : ""}`}
                  />
                  Zerar Mês
                </button>
                <button
                  type="button"
                  disabled={loadingConferencia}
                  onClick={() =>
                    publicarEscalaDefinitiva(conferenciaMes, conferenciaAno)
                  }
                  className={`px-6 py-3 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    escalaPublicadaPorMes?.[
                      `${conferenciaAno}-${conferenciaMes.toString().padStart(2, "0")}`
                    ]
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {escalaPublicadaPorMes?.[
                    `${conferenciaAno}-${conferenciaMes.toString().padStart(2, "0")}`
                  ]
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
              ) : !escalaConferencia ||
                Object.keys(escalaConferencia).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-bold mb-1">
                    Nenhuma escala gerada para este período
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Clique em "Gerar Novamente" para criar uma nova combinação
                    com base nas disponibilidades dos ministros.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 pr-2 custom-scrollbar">
                  {(() => {
                    const missasIncompletasModal: Array<{
                      data: string;
                      horario: string;
                      nome: string;
                      headcount: number;
                      limite: number;
                      faltam: number;
                      dataExtenso: string;
                    }> = [];

                    if (escalaConferencia) {
                      Object.entries(escalaConferencia).forEach(([dStr, slotMap]: [string, any]) => {
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return;
                        Object.entries(slotMap || {}).forEach(([hStr, mObj]: [string, any]) => {
                          const mins = Array.isArray(mObj) ? mObj : mObj?.ministros || [];
                          let headcount = 0;
                          mins.forEach((m: any) => {
                            const nameStr = typeof m === "string" ? m : m?.nome || "";
                            if (nameStr.includes(" e ")) headcount += 2;
                            else headcount += 1;
                          });
                          const limite = mObj?.limiteManual !== undefined ? Number(mObj.limiteManual) : 8;
                          if (headcount < limite) {
                            const dObj = new Date(dStr + "T00:00:00");
                            const dataExtenso = format(dObj, "EEEE (dd/MM)", { locale: ptBR });
                            missasIncompletasModal.push({
                              data: dStr,
                              horario: hStr,
                              nome: mObj?.nome || "Missa",
                              headcount,
                              limite,
                              faltam: limite - headcount,
                              dataExtenso,
                            });
                          }
                        });
                      });
                    }

                    return (
                      <>
                        {missasIncompletasModal.length > 0 && (
                          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200/90 rounded-2xl flex items-start gap-3.5 text-red-950 shadow-sm animate-in fade-in">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                <h4 className="text-xs font-black uppercase tracking-wider text-red-900">
                                  Aviso: {missasIncompletasModal.length} {missasIncompletasModal.length === 1 ? "Missa com Vagas em Aberto" : "Missas com Vagas em Aberto"}
                                </h4>
                                <span className="text-[10px] font-black px-2.5 py-0.5 bg-red-200 text-red-800 rounded-full border border-red-300">
                                  Incompleta
                                </span>
                              </div>
                              <p className="text-xs text-red-800">
                                As seguintes missas do mês não atingiram o limite mínimo de ministros por falta de disponibilidade enviada:
                              </p>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {missasIncompletasModal.map((inc, i) => (
                                  <div
                                    key={i}
                                    className="px-3.5 py-2.5 bg-white border border-red-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                                  >
                                    <div className="min-w-0">
                                      <span className="capitalize block truncate text-slate-900 font-extrabold">
                                        {inc.dataExtenso} às <span className="text-red-700">{inc.horario}</span>
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-500 block truncate">{inc.nome}</span>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-1 bg-red-600 text-white rounded-lg shrink-0 border border-red-700 shadow-2xs">
                                      {inc.headcount}/{inc.limite} ({inc.faltam === 1 ? "Falta 1" : `Faltam ${inc.faltam}`})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {Object.keys(escalaConferencia)
                    .filter(
                      (date) =>
                        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                        date.substring(0, 7) >= currentMonthStr,
                    )
                    .sort()
                    .map((data) => (
                      <div key={data} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {format(
                              new Date(data + "T00:00:00"),
                              "EEEE, d 'de' MMMM",
                              { locale: ptBR },
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
                                format(new Date(data + "T00:00:00"), "EEEE", {
                                  locale: ptBR,
                                }).toLowerCase() === "domingo";

                              const minsList = Array.isArray(missa) ? missa : missa?.ministros || [];
                              let cardHeadcount = 0;
                              minsList.forEach((m: any) => {
                                const mName = typeof m === "string" ? m : m?.nome || "";
                                if (mName.includes(" e ")) cardHeadcount += 2;
                                else cardHeadcount += 1;
                              });
                              const cardLimite = missa?.limiteManual !== undefined ? Number(missa.limiteManual) : 8;
                              const isCardIncomplete = cardHeadcount < cardLimite;

                              return (
                                <div
                                  key={horario}
                                  className={`p-5 rounded-2xl border transition-all hover:border-slate-300 bg-white ${
                                    isCardIncomplete
                                      ? "border-red-300 shadow-sm shadow-red-100 bg-red-50/20"
                                      : isDomingo
                                        ? "border-red-100 shadow-sm shadow-red-50"
                                        : "border-slate-200"
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <span
                                        className={`text-base font-black leading-none block ${
                                          isDomingo
                                            ? "text-red-600"
                                            : "text-slate-900"
                                        }`}
                                      >
                                        {horario}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                      <span
                                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                          isDomingo
                                            ? "bg-red-50 text-red-700"
                                            : "bg-slate-100 text-slate-500"
                                        }`}
                                      >
                                        {missa.nome || "Missa"}
                                      </span>
                                      <span
                                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                          isCardIncomplete
                                            ? "bg-red-100 text-red-800 border-red-300 font-black animate-pulse"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        }`}
                                      >
                                        {cardHeadcount}/{cardLimite} Vagas {isCardIncomplete ? `(Falta ${cardLimite - cardHeadcount})` : "✓"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {[
                                      ...(Array.isArray(missa)
                                        ? missa
                                        : missa?.ministros || []),
                                    ]
                                      .sort((a: any, b: any) => {
                                        const nameA =
                                          typeof a === "string"
                                            ? a
                                            : a?.nome || "";
                                        const nameB =
                                          typeof b === "string"
                                            ? b
                                            : b?.nome || "";
                                        const isLiderA = isMinisterLeader(nameA, missa.lider);
                                        const isLiderB = isMinisterLeader(nameB, missa.lider);
                                        if (isLiderA && !isLiderB) return -1;
                                        if (!isLiderA && isLiderB) return 1;
                                        return nameA.localeCompare(nameB, "pt-BR", {
                                          sensitivity: "base",
                                        });
                                      })
                                      .map((m: string, idx: number) => {
                                        const ministerName = typeof m === "string" ? m : (m as any)?.nome || "";
                                        const isLider = isMinisterLeader(ministerName, missa.lider);

                                        return (
                                          <div
                                            key={idx}
                                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-all bg-slate-50 border-slate-100/80 text-slate-700`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                              <div className={`w-1.5 h-1.5 rounded-full ${isLider ? "bg-blue-900" : "bg-blue-500"}`}></div>
                                              {renderMinisterWithStar(ministerName, missa.lider, undefined, { className: "text-xs font-bold truncate" })}
                                            </div>

                                            
                                          </div>
                                        );
                                      })}

                                      {cardHeadcount < cardLimite &&
                                        Array.from({ length: Math.max(0, cardLimite - cardHeadcount) }).map((_, missingIdx) => (
                                          <div
                                            key={`aguardando-${missingIdx}`}
                                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border-2 border-red-300 bg-red-100/90 text-red-700 shadow-xs animate-pulse"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 animate-ping" />
                                              <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                                                Aguardando
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-200 text-red-900 border border-red-300 font-extrabold">
                                              À espera de ministro
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
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-8 relative z-10">
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
                    isActualCoord
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
                  classicWebMode={classicWebMode}
                  onToggleClassicWebMode={(val) => {
                    setClassicWebMode(val);
                    localStorage.setItem(
                      "classic_web_mode",
                      val ? "true" : "false",
                    );
                  }}
                />
              )}

              {activeTab === "home" &&
                (!isActualCoord ? (
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
                      isActualCoord
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
                    classicWebMode={classicWebMode}
                    onToggleClassicWebMode={(val) => {
                      setClassicWebMode(val);
                      localStorage.setItem(
                        "classic_web_mode",
                        val ? "true" : "false",
                      );
                    }}
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

                    {/* Welcome Screen - Softened and Delicate (Light Green or Church Background) */}
                    <div
                      className={`p-6 md:p-8 rounded-2xl shadow-sm border ${
                        user.paroquia === "Paróquia Santa Rita de Cássia"
                          ? "border-slate-800/20"
                          : `${themeClasses.light} border-liturgy-100/80`
                      } text-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden group min-h-[140px]`}
                      style={{
                        backgroundColor: user.paroquia === "Paróquia Santa Rita de Cássia" ? "transparent" : undefined,
                      }}
                    >
                      {user.paroquia === "Paróquia Santa Rita de Cássia" ? (
                        <div className="absolute inset-0 z-0">
                          <img
                            src="/church-facade.png?v=1"
                            alt="Paróquia Santa Rita de Cássia"
                            className="w-full h-full object-cover brightness-[0.5] contrast-[1.05]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-900/10" />
                        </div>
                      ) : (
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Church className={`w-32 h-32 ${themeClasses.text}`} />
                        </div>
                      )}
                      
                      <div className="relative z-10 space-y-2 sm:mb-0 mb-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                            user.paroquia === "Paróquia Santa Rita de Cássia"
                              ? "bg-white/10 border-white/20 text-white"
                              : `${themeClasses.light} border-liturgy-200/50 ${themeClasses.text}`
                          }`}
                        >
                          <Activity className="w-3 h-3" />
                          Portal da Coordenação
                        </div>
                        <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
                          user.paroquia === "Paróquia Santa Rita de Cássia" ? "text-white" : "text-slate-950"
                        }`}>
                          Bem-vindo(a), Coordenador(a){" "}
                          {user.isConjugeLogin ? (user.nomeExibicaoConjuge || user.nomeConjuge || "") : (user.nomeExibicao || user.nome || "")}
                          {user.tipo === "casal" &&
                          (user.nomeExibicaoConjuge || user.nomeConjuge) ? (
                            <span className="font-medium italic">
                              {" "}
                              &{" "}
                              {user.isConjugeLogin ? (user.nomeExibicao || user.nome || "") : (user.nomeExibicaoConjuge || user.nomeConjuge || "")}
                            </span>
                          ) : (
                            ""
                          )}
                          !
                        </h2>
                        <p
                          className={`text-xs font-semibold ${
                            user.paroquia === "Paróquia Santa Rita de Cássia" ? "text-slate-300" : `${themeClasses.text}/80`
                          }`}
                        >
                          Liderando com amor na {user.paroquia?.toLowerCase().includes('paróquia') ? '' : 'Paróquia '}{user.paroquia}, {monthNames[new Date().getMonth()]}/{new Date().getFullYear()}.
                        </p>
                        <div className="flex items-center gap-2.5 pt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                            user.paroquia === "Paróquia Santa Rita de Cássia"
                              ? "bg-white/10 text-emerald-300 border border-white/20"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pontualidade: {stats.pontualidade !== undefined ? `${stats.pontualidade}%` : '100%'}
                          </span>
                        </div>
                      </div>

                      {/* Discreet Clock in the bottom-right corner */}
                      <div className={`absolute bottom-3 right-4 z-10 flex items-center gap-1.5 text-[10px] font-bold ${
                        user.paroquia === "Paróquia Santa Rita de Cássia"
                          ? "text-white bg-white/15 border border-white/20 shadow-sm"
                          : `${themeClasses.text} bg-white/80 border ${themeClasses.border || "border-slate-200"} shadow-sm`
                      } px-2.5 py-1 rounded-lg backdrop-blur-xs`}>
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>
                          {liveDateTime.weekday}, {liveDateTime.date}
                        </span>
                      </div>
                    </div>

                      {/* Dashboard content continues directly below */}

                      <div className="grid grid-cols-1 gap-8">
                        {/* Section for Upcoming Weekend/Future Schedules for Coordinators */}
                      {showWeekendReminder && weekendAssignments.length > 0 ? (
                        <div
                          className={`p-4 md:p-5 ${themeClasses.light} border ${themeClasses.border} rounded-2xl shadow-sm relative overflow-hidden group`}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Calendar
                              className={`w-32 h-32 ${themeClasses.text}`}
                            />
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
                                  Seus Próximos Agendamentos (Você está
                                  escalado!)
                                </h3>
                                <p
                                  className={`text-[10px] ${themeClasses.text}/85 font-bold uppercase mt-1`}
                                >
                                  Fique atento à sua atuação na escala
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2.5 mt-4">
                              {weekendAssignments.map((assign, idx) => {
                                const dateObj = new Date(
                                  assign.date + "T00:00:00",
                                );
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
                                          Horário:{" "}
                                          {assign.time || assign.horario}
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
                          <Calendar
                            className={`w-8 h-8 ${themeClasses.text} opacity-20 mb-2`}
                          />
                          <p
                            className={`font-bold text-xs ${themeClasses.text}/70 uppercase tracking-widest`}
                          >
                            Nenhum agendamento pessoal na escala para os
                            próximos dias.
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

                      {/* Serviços e Atalhos for Coordinators */}
                      {!classicWebMode && (
                        <div className="mt-6 border-t border-slate-200/60 pt-6">
                          <div className="text-center sm:text-left mb-6 flex items-center justify-between">
                            <div>
                              <h3
                                className={`text-xs font-black ${themeClasses.text} uppercase tracking-widest`}
                              >
                                Serviços e Atalhos (Gestão)
                              </h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                Acesse rapidamente todas as ferramentas da
                                coordenação
                              </p>
                            </div>
                          </div>

                          <div className={`grid ${classicWebMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'} gap-2 sm:gap-3`}>
                            {[
                              {
                                id: "aniversariantes",
                                label: "Aniversariantes",
                                subtitle: "Aniversariantes do mês",
                                icon: Gift,
                                badge: 0,
                              },
                              {
                                id: "calendario",
                                label: "Calendário Litúrgico",
                                subtitle: "Liturgia",
                                icon: CalendarDays,
                                badge: unreadCalendarCount,
                              },
                              {
                                id: "comunhao",
                                label: "Comunhão",
                                subtitle: "Reg. comunhão",
                                icon: Heart,
                                badge: 0,
                              },
                              {
                                id: "disponibilidade",
                                label: "Disponibilidades",
                                subtitle: "Gerir datas",
                                icon: LayoutDashboard,
                                badge: 0,
                              },
                              {
                                id: "escala",
                                label: "Escalas",
                                subtitle: "Consultar escala",
                                icon: Calendar,
                                badge: 0,
                              },
                              {
                                id: "estoque",
                                label: "Estoque",
                                subtitle: "Itens e estoque",
                                icon: Package,
                                badge: stats.lowStockCount,
                              },
                              {
                                id: "mensagem",
                                label: "Mensagens",
                                subtitle: "Falar com ministros",
                                icon: MessageSquare,
                                badge: unreadCount,
                              },
                              {
                                id: "ministros",
                                label: "Ministros",
                                subtitle: "Gerir equipe",
                                icon: Users,
                                badge: stats.pendingApprovals,
                              },
                              {
                                id: "missas",
                                label: "Missas",
                                subtitle: "Gerir missas",
                                icon: Church,
                                badge: 0,
                              },
                              {
                                id: "editar",
                                label: "Perfil",
                                subtitle: "Editar dados",
                                icon: Settings,
                                badge: 0,
                              },
                              {
                                id: "relatorios",
                                label: "Gestão da Escala",
                                subtitle: "Históricos e Gestão",
                                icon: Clipboard,
                                badge: 0,
                              },
                              {
                                id: "enfermos",
                                label: "Rito de Enfermos",
                                subtitle: "Roteiro de visita",
                                icon: Cross,
                                badge: 0,
                              },
                              {
                                id: "evangelho",
                                label: "Evangelho",
                                subtitle: "Vatican News",
                                icon: BookOpen,
                                badge: 0,
                              },
                              {
                                id: "liturgia",
                                label: "Liturgia Diária",
                                subtitle: "Canção Nova",
                                icon: BookOpen,
                                badge: 0,
                              },
                              {
                                id: "oracoes",
                                label: "Orações",
                                subtitle: "Preces e orações",
                                icon: HandHeart,
                                badge: 0,
                              },
                              {
                                id: "trocas",
                                label: "Trocas",
                                subtitle: "Troca de Missas",
                                icon: RefreshCw,
                                badge: trocasBadgeCount,
                              },
                              {
                                id: "financeiro",
                                label: "Tesouraria",
                                subtitle: "Financeiro",
                                icon: DollarSign,
                                badge: 0,
                              },
                              {
                                id: "faltas",
                                label: "Faltas",
                                subtitle: "Ranking e ausências",
                                icon: UserX,
                                badge: 0,
                              },
                              {
                                id: "lideres",
                                label: "Responsável pela Missa",
                                subtitle: "Relatórios",
                                icon: Flag,
                                badge: 0,
                              },
                              ...((user?.paroquia === "Paróquia Santa Rita de Cássia" || user?.paroquia?.toLowerCase().includes("santa rita")) ? [{
                                id: "santo",
                                label: "Santos",
                                subtitle: "História",
                                icon: Sparkles,
                                badge: 0,
                              }] : []),
                              {
                                id: "versao_web",
                                label: classicWebMode ? "Modo Moderno" : "Versão Web",
                                subtitle: classicWebMode ? "Usar grades compactas" : "Modo Clássico",
                                icon: classicWebMode ? LayoutDashboard : Monitor,
                                badge: 0,
                              },
                            ]
                              .sort((a, b) =>
                                a.label.localeCompare(b.label, "pt-BR", {
                                  sensitivity: "base",
                                }),
                              )
                              .map((item) => {
                              const IconComp = item.icon;
                              const isNiverHoje = item.id === "aniversariantes" && anyBirthdayToday.length > 0;
                              const isEscalado = item.id === "escala" && Array.isArray(weekendAssignments) && weekendAssignments.length > 0;

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    if (item.id === "versao_web") {
                                      const newVal = !classicWebMode;
                                      setClassicWebMode(newVal);
                                      localStorage.setItem("classic_web_mode", String(newVal));
                                    } else {
                                      setActiveTab(item.id as any);
                                    }
                                  }}
                                  className={`group flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square ${
                                    isNiverHoje
                                      ? "bg-red-500/10 backdrop-blur-md border-red-300/70 ring-2 ring-red-500/20 shadow-[0_4px_16px_rgba(239,68,68,0.1),inset_0_1px_1px_rgba(255,255,255,0.7)]"
                                      : isEscalado
                                        ? "bg-red-500/15 backdrop-blur-md border-red-400/80 ring-2 ring-red-500/25 shadow-[0_4px_16px_rgba(239,68,68,0.15),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:bg-red-500/25"
                                        : item.id === "versao_web"
                                          ? "bg-white/40 backdrop-blur-md border-slate-200/70 hover:bg-white/60 hover:border-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                          : liturgyTheme === "purple"
                                            ? "bg-purple-900/[0.04] backdrop-blur-md border-purple-300/40 hover:bg-purple-900/[0.08] hover:border-purple-400/60 shadow-[0_4px_16px_rgba(147,51,234,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                            : liturgyTheme === "rose"
                                              ? "bg-rose-900/[0.04] backdrop-blur-md border-rose-300/40 hover:bg-rose-900/[0.08] hover:border-rose-400/60 shadow-[0_4px_16px_rgba(244,63,94,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                              : liturgyTheme === "white"
                                                ? "bg-white/40 backdrop-blur-md border-slate-200/70 hover:bg-white/60 hover:border-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                                : liturgyTheme === "emerald"
                                                  ? "bg-emerald-900/[0.04] backdrop-blur-md border-emerald-300/40 hover:bg-emerald-900/[0.08] hover:border-emerald-400/60 shadow-[0_4px_16px_rgba(16,185,129,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                                  : "bg-blue-900/[0.04] backdrop-blur-md border-blue-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                  }`}
                                >
                                  {isNiverHoje ? (
                                    <div className="absolute top-2 right-2 flex h-3 w-3 z-10">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                    </div>
                                  ) : isEscalado ? (
                                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm z-10">
                                      {weekendAssignments && weekendAssignments.length > 0 ? weekendAssignments.length : "✓"}
                                    </div>
                                  ) : item.badge > 0 ? (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse shadow-sm z-10">
                                      {item.badge}
                                    </div>
                                  ) : null}
                                  <div
                                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden ${
                                      isNiverHoje
                                        ? "bg-gradient-to-b from-red-500/20 to-red-500/5 border-red-300/70 text-red-600 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8),0_3px_8px_rgba(239,68,68,0.12)] animate-bounce"
                                        : isEscalado
                                          ? "bg-gradient-to-b from-red-500/25 to-red-500/10 border-red-400/80 text-red-600 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8),0_3px_8px_rgba(239,68,68,0.15)]"
                                          : item.id === "versao_web"
                                            ? "bg-gradient-to-b from-white/80 to-white/30 border-white/80 text-slate-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)]"
                                            : item.id === "santo"
                                              ? "bg-transparent border-transparent shadow-none"
                                              : item.id === "comunhao"
                                                ? "bg-gradient-to-b from-amber-500/15 to-transparent border-amber-300/40 text-amber-600 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8),0_2px_6px_rgba(245,158,11,0.08)]"
                                                : item.id === "financeiro"
                                                  ? "bg-gradient-to-b from-amber-500/15 to-transparent border-amber-300/40 text-amber-600 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8),0_2px_6px_rgba(245,158,11,0.08)]"
                                                  : liturgyTheme === "purple"
                                                  ? "bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-purple-200/60 text-purple-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(147,51,234,0.08)]"
                                                  : liturgyTheme === "rose"
                                                    ? "bg-gradient-to-b from-rose-500/20 to-rose-500/5 border-rose-200/60 text-rose-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(244,63,94,0.08)]"
                                                    : liturgyTheme === "white"
                                                      ? "bg-gradient-to-b from-white/90 to-white/40 border-white text-slate-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),0_2px_6px_rgba(0,0,0,0.04)]"
                                                      : liturgyTheme === "emerald"
                                                        ? "bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border-emerald-200/60 text-emerald-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(16,185,129,0.08)]"
                                                        : "bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]"
                                    }`}
                                  >
                                    {item.id === "santo" ? (
                                      <img
                                        src="/santa_rita_cassia.jpg"
                                        alt="Santos"
                                        className="w-full h-full object-cover object-center rounded-2xl transform scale-110 shadow-sm"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "comunhao" ? (
                                      <img
                                        src="/hostia.jpg"
                                        alt="Comunhão"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "financeiro" ? (
                                      <img
                                        src="/tesouraria.jpg"
                                        alt="Tesouraria"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "missas" ? (
                                      <img
                                        src="/missas_3d.jpg"
                                        alt="Missas"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "liturgia" ? (
                                      <img
                                        src="/biblia_3d.jpg"
                                        alt="Liturgia Diária"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "evangelho" ? (
                                      <img
                                        src="/evangelho_3d.jpg"
                                        alt="Evangelho"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "oracoes" ? (
                                      <img
                                        src="/oracoes_3d.jpg"
                                        alt="Orações"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "escala" ? (
                                      <img
                                        src="/escala_3d.jpg"
                                        alt="Escalas"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "ministros" ? (
                                      <img
                                        src="/ministros_3d.jpg?v=2"
                                        alt="Ministros"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "calendario" ? (
                                      <img
                                        src="/calendario_3d.jpg"
                                        alt="Calendário Litúrgico"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "enfermos" ? (
                                      <img
                                        src="/enfermos_3d.jpg"
                                        alt="Rito de Enfermos"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "mensagem" ? (
                                      <img
                                        src="/mensagem_3d.jpg"
                                        alt="Mensagens"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "estoque" ? (
                                      <img
                                        src="/estoque_3d.jpg"
                                        alt="Estoque"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "trocas" ? (
                                      <img
                                        src="/trocas_3d.jpg"
                                        alt="Trocas"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "aniversariantes" ? (
                                      <img
                                        src="/aniversariantes_3d.jpg"
                                        alt="Aniversariantes"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "lideres" ? (
                                      <img
                                        src="/lideres_3d.jpg"
                                        alt="Responsável pela Missa"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "relatorios" ? (
                                      <img
                                        src="/relatorios_3d.jpg"
                                        alt="Gestão da Escala"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "disponibilidade" ? (
                                      <img
                                        src="/disponibilidade_3d.jpg"
                                        alt="Disponibilidades"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "faltas" ? (
                                      <img
                                        src="/faltas_3d.jpg"
                                        alt="Faltas"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "editar" ? (
                                      <img
                                        src="/editar_3d.jpg"
                                        alt="Perfil"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "como_usar" ? (
                                      <img
                                        src="/como_usar_3d.jpg"
                                        alt="Como Usar"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : item.id === "versao_web" ? (
                                      <img
                                        src="/versao_web_3d.jpg"
                                        alt="Versão Web"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <IconComp className={`w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 ${isEscalado ? "text-red-600" : ""} drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105`} strokeWidth={2.2} />
                                    )}
                                  </div>
                                  {isNiverHoje ? (
                                    <>
                                      <span className="text-[10px] sm:text-[11px] font-black leading-tight tracking-tight text-red-700 line-clamp-1 px-1">
                                        Hoje: {anyBirthdayToday.map(a => a.nome.split(' ')[0]).join(' & ')} 🎂
                                      </span>
                                      <span className="text-[8px] sm:text-[9px] text-red-500 font-black mt-1 leading-none uppercase tracking-wider bg-red-100/50 px-1 py-0.5 rounded border border-red-200/40">
                                        Parabéns!
                                      </span>
                                    </>
                                  ) : isEscalado ? (
                                    <>
                                      <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-red-950 line-clamp-2 text-center px-0.5">
                                        {item.label}
                                      </span>
                                      <span className="text-[8px] sm:text-[9px] text-red-600 font-black mt-1 leading-none uppercase tracking-wider bg-red-100/80 px-1.5 py-0.5 rounded border border-red-200/60 block">
                                        Escalado
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                                        {item.label}
                                      </span>
                                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-0.5 leading-none block">
                                        {item.subtitle}
                                      </span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                        fetchData(true);
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
                      onUpdate={fetchData}
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

              {activeTab === "financeiro" && (hasCoordAccess(user) || user?.isTesoureiro) && (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900">
                        Tesouraria do Ministério
                      </h3>
                    </div>
                    <div className="p-6">
                      <FinanceiroView
                        user={user}
                        onAlert={(title, msg) => {
                          // Display visual alert modal in app with fallback
                          if (typeof title === "object" && title !== null) {
                            alert(JSON.stringify(title));
                          } else {
                            // Standard alert modal function inside App.tsx
                            onAlert?.(title, msg);
                          }
                        }}
                        onCustomConfirm={onCustomConfirm}
                      />
                    </div>
                  </div>
                )}

              {activeTab === "faltas" && hasCoordAccess(user) && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <CoordenacaoFaltasView
                      user={user}
                      isTab={true}
                      onAlert={onAlert}
                      onCustomConfirm={onCustomConfirm}
                    />
                  </div>
                </div>
              )}

              {activeTab === "lideres" && hasCoordAccess(user) && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <CoordenacaoLideresView
                      user={user}
                      isTab={true}
                      onAlert={onAlert}
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

              {activeTab === "evangelho" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-${liturgyTheme === "white" ? "slate" : liturgyTheme === "emerald" ? "emerald" : liturgyTheme === "purple" ? "purple" : "rose"}-600 shadow-md`}
                      >
                        <BookOpen className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Evangelho e Liturgia
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {(() => {
                            const now = new Date();
                            const isSaturdayAfternoon =
                              now.getDay() === 6 && now.getHours() >= 17;
                            return isSaturdayAfternoon && vigilGospel
                              ? `${vigilGospel.ref} (Vigília)`
                              : dailyGospel.ref;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Font Scale Adjuster */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200/60 shadow-sm">
                        <button
                          onClick={() =>
                            setFontScale((prev) => Math.max(0.7, prev - 0.15))
                          }
                          className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700 shadow-sm cursor-pointer"
                          title="Diminuir texto"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-4 bg-slate-200" />
                        <button
                          onClick={() =>
                            setFontScale((prev) => Math.min(2.5, prev + 0.15))
                          }
                          className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700 shadow-sm cursor-pointer"
                          title="Aumentar texto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => setActiveTab("home")}
                        className="text-xs font-bold text-liturgy-600 hover:text-liturgy-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/50 shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Voltar
                      </button>
                    </div>
                  </div>

                  {/* Vatican News Readings Tabs Bar */}
                  {dailyGospel.liturgia && dailyGospel.liturgia.length > 0 && (
                    <div className="w-full bg-slate-50 border-b border-slate-200 overflow-x-auto">
                      <div className="flex">
                        {dailyGospel.liturgia.map((tab) => {
                          const isActive = activeGospelTabId === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveGospelTabId(tab.id)}
                              className={`flex flex-col items-start px-6 py-3.5 min-w-[130px] text-left border-b-2 transition-all cursor-pointer ${
                                isActive
                                  ? 'border-blue-600 bg-white shadow-sm font-bold text-blue-700'
                                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                              }`}
                            >
                              <span className="text-xs uppercase tracking-wider">{tab.titulo}</span>
                              {tab.referencia && (
                                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
                                  {tab.referencia}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-10 bg-[#fdfcf9] overflow-y-auto">
                    <div
                      className="max-w-prose mx-auto"
                      style={{ fontSize: `${fontScale}rem`, lineHeight: 1.6 }}
                    >
                      <div className="space-y-6">
                        {(() => {
                          const now = new Date();
                          const isSaturdayAfternoon =
                            now.getDay() === 6 && now.getHours() >= 17;

                          // Check if active tab is in liturgia array
                          const selectedTab = dailyGospel.liturgia?.find(t => t.id === activeGospelTabId);

                          if (selectedTab) {
                            if (selectedTab.id === 'tab-papa' || selectedTab.titulo.toLowerCase().includes('papa')) {
                              return (
                                <div>
                                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
                                      <Church className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-slate-800 text-lg">O Pensamento do Papa</h3>
                                      <p className="text-xs text-slate-500">Vatican News • Reflexão Pastoral</p>
                                    </div>
                                  </div>
                                  {selectedTab.paragrafos.map((paragraph, i) => {
                                    const cleanParagraph = paragraph.trim();
                                    if (!cleanParagraph) return null;
                                    return (
                                      <p key={i} className="font-serif text-slate-700 leading-[1.8] italic mb-6">
                                        {cleanParagraph}
                                      </p>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return selectedTab.paragrafos.map((paragraph, i) => {
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
                          }

                          const text =
                            isSaturdayAfternoon && vigilGospel
                              ? vigilGospel.text
                              : dailyGospel.text;

                          if (!text || text.includes("Carregando")) {
                            return (
                              <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                                Aguarde, carregando...
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

                      {(() => {
                        const selectedTab = dailyGospel.liturgia?.find(t => t.id === activeGospelTabId);
                        const isLeitura = activeGospelTabId === 'tab-1leitura' || activeGospelTabId === 'tab-2leitura' || (selectedTab && selectedTab.titulo.toLowerCase().includes('leitura'));
                        const isEvangelho = activeGospelTabId === 'tab-evangelho' || (selectedTab && selectedTab.id === 'tab-evangelho') || (!selectedTab && !dailyGospel.liturgia?.length);

                        if (isLeitura) {
                          return (
                            <div className="mt-12 pt-6 border-t border-slate-200 text-center">
                              <span className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Palavra do Senhor
                              </span>
                              <h4 className="font-display text-xl text-slate-900 italic">
                                Graças a Deus
                              </h4>
                            </div>
                          );
                        }
                        if (isEvangelho) {
                          return (
                            <div className="mt-12 pt-6 border-t border-slate-200 text-center">
                              <span className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                Palavra da Salvação
                              </span>
                              <h4 className="font-display text-xl text-slate-900 italic">
                                Glória a vós, Senhor
                              </h4>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {(() => {
                        const now = new Date();
                        const isSaturdayAfternoon =
                          now.getDay() === 6 && now.getHours() >= 17;
                        const papasText =
                          isSaturdayAfternoon && vigilGospel
                            ? vigilGospel.papasText
                            : dailyGospel.papasText;

                        const hasPapaTab = dailyGospel.liturgia?.some(t => t.id === 'tab-papa' || t.titulo.toLowerCase().includes('papa'));

                        // Only show bottom card if papasText exists, there is NO Papa tab in liturgia tabs, and active tab is Evangelho or none
                        if (papasText && !hasPapaTab && (activeGospelTabId === 'tab-evangelho' || !activeGospelTabId)) {
                          return (
                            <div className="mt-12 pt-10 border-t-2 border-double border-slate-100">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-full bg-liturgy-50">
                                    <Church className="w-5 h-5 text-liturgy-500" />
                                  </div>
                                  <h3 className="font-display text-xl text-slate-800 tracking-tight font-bold">
                                    O Pensamento do Papa
                                  </h3>
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

                    {/* Footer actions with Vatican News and Amém button */}
                    <div className="mt-12 pt-8 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-center gap-5">
                      {(() => {
                        const now = new Date();
                        const isSaturdayAfternoon =
                          now.getDay() === 6 && now.getHours() >= 17;
                        const vaticanUrl =
                          (isSaturdayAfternoon && vigilGospel
                            ? vigilGospel.vaticanUrl
                            : dailyGospel.vaticanUrl) || "https://www.vaticannews.va/pt/palavra-do-dia.html";
                        if (vaticanUrl)
                          return (
                            <a
                              href={vaticanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2.5 cursor-pointer"
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
                        onClick={() => setActiveTab("home")}
                        className="w-full py-4 bg-liturgy-600 hover:bg-liturgy-700 text-black font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-liturgy-100 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-black" />
                        Amém
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "liturgia" && (
                <LiturgiaDiariaView voltar={() => setActiveTab("home")} />
              )}

              {activeTab === "oracoes" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-600 shadow-md">
                        <HandHeart className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Orações</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Preces e Meditações</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedPrayer) {
                          setSelectedPrayer(null);
                        } else {
                          setActiveTab("home");
                        }
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/50 shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      {selectedPrayer ? "Voltar à lista" : "Voltar ao início"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {selectedPrayer ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto py-8"
                      >
                        <div className="text-center mb-10">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <HandHeart className="w-8 h-8" />
                          </div>
                          <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedPrayer.title}</h2>
                          {selectedPrayer.subtitle && (
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedPrayer.subtitle}</p>
                          )}
                        </div>
                        
                        <div className="bg-slate-50/50 rounded-[32px] p-8 sm:p-12 border border-slate-100 shadow-inner">
                          <div className="prose prose-slate prose-lg mx-auto">
                            {selectedPrayer.content.split('\n').map((line, i) => (
                              <p key={i} className="text-slate-700 leading-relaxed font-serif text-lg text-center whitespace-pre-wrap">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-12 text-center">
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-6">Que esta oração ilumine o seu dia</p>
                          <button
                            onClick={() => setSelectedPrayer(null)}
                            className="inline-flex items-center gap-2.5 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200 group"
                          >
                            <Heart className="w-4 h-4 fill-current group-hover:animate-pulse" />
                            Amém
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Grade Oração do MECE */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-2.5 h-5 rounded-full bg-blue-600" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Oração do MECE</h4>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                            {prayers
                              .filter((p) => p.category === "mece")
                              .map((prayer) => (
                                <motion.button
                                  key={prayer.id}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedPrayer(prayer)}
                                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all aspect-square gap-1.5 sm:gap-2 group text-center cursor-pointer"
                                >
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors">
                                    <HandHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2 px-1">
                                      {prayer.title}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                                      MECE
                                    </span>
                                  </div>
                                </motion.button>
                              ))}
                          </div>
                        </div>

                        {/* Outras Orações */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-2.5 h-5 rounded-full bg-slate-400" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Orações Gerais</h4>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                            {[...prayers]
                              .filter((p) => p.category !== "mece")
                              .sort((a, b) => a.title.localeCompare(b.title))
                              .map((prayer) => (
                                <motion.button
                                  key={prayer.id}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedPrayer(prayer)}
                                  className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all aspect-square gap-1.5 sm:gap-2 group text-center cursor-pointer"
                                >
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors">
                                    <HandHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2 px-1">
                                      {prayer.title}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                                      {prayer.category === "mariana"
                                        ? "Maria"
                                        : prayer.category === "espirito-santo"
                                        ? "Espírito"
                                        : "Básica"}
                                    </span>
                                  </div>
                                </motion.button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "santo" && (
                <SantosView onBack={() => setActiveTab("home")} />
              )}

              {activeTab === "aniversariantes" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-600 shadow-md">
                        <Gift className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Aniversariantes de {monthNames[new Date().getMonth()]}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Lista de comemorações
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("home")}
                      className="text-xs font-bold text-slate-600 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/50 shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Voltar
                    </button>
                  </div>
                  <div className="p-6">
                    {aniversariantes.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <p className="text-slate-500 font-medium text-xs">
                          Nenhum aniversariante encontrado para{" "}
                          {monthNames[new Date().getMonth()]}.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {[...aniversariantes]
                          .sort((a, b) => parseInt(a.dia) - parseInt(b.dia))
                          .map((niver, i) => {
                            const now = new Date();
                            const currentRealMonth = now.getMonth() + 1;
                            const isToday = parseInt(niver.dia) === now.getDate();

                            return (
                              <div
                                key={i}
                                className={`relative p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                                  isToday
                                    ? "bg-red-50 border-red-300 shadow-md ring-4 ring-red-500/10 scale-[1.03]"
                                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                                }`}
                              >
                                {/* Day Circle */}
                                <div
                                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black text-xs shrink-0 border shadow-sm ${
                                    isToday
                                      ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20 scale-110"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <span className="text-[9px] leading-none opacity-85 uppercase font-black">
                                    Dia
                                  </span>
                                  <span className="text-lg leading-none mt-1 font-black">
                                    {niver.dia}
                                  </span>
                                </div>

                                {/* Details */}
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-black truncate leading-snug ${isToday ? "text-red-700 text-sm font-black tracking-tight" : "text-slate-800"}`}>
                                    {niver.nome} {isToday && "🎂"}
                                  </p>
                                  <p className={`text-[9px] font-bold uppercase tracking-wider leading-none mt-1 ${isToday ? "text-red-500" : "text-slate-400"}`}>
                                    {niver.tipo} • {niver.dia}/{currentRealMonth} {isToday && "• PARABÉNS!"}
                                  </p>
                                </div>

                                {/* Red Dot / Bolinha Vermelha on the specific card if it's today */}
                                {isToday && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                    <span className="flex h-2.5 w-2.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span
                                        className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"
                                        title="Aniversariante de Hoje!"
                                      ></span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "enfermos" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-slate-600 shadow-md">
                        <Cross className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Visita e Comunhão dos Enfermos
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Roteiro Litúrgico Oficial
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Font Scale Adjuster */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200/60 shadow-sm">
                        <button
                          onClick={() =>
                            setFontScale((prev) => Math.max(0.7, prev - 0.15))
                          }
                          className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700 shadow-sm cursor-pointer"
                          title="Diminuir texto"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-4 bg-slate-200" />
                        <button
                          onClick={() =>
                            setFontScale((prev) => Math.min(2.5, prev + 0.15))
                          }
                          className="p-1 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-700 shadow-sm cursor-pointer"
                          title="Aumentar texto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => setActiveTab("home")}
                        className="text-xs font-bold text-slate-600 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/50 shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Voltar
                      </button>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 bg-[#fdfcf9] overflow-y-auto max-h-[80vh]">
                    <div className="max-w-prose mx-auto">
                      {/* Personalization Option */}
                      <div className="mb-8 p-5 bg-amber-50/80 border border-amber-200/50 rounded-2xl font-sans text-sm shadow-sm">
                        <label className="block font-bold text-amber-900 mb-1.5 text-xs uppercase tracking-wider">
                          Deseja personalizar as orações? Digite o nome do
                          enfermo/idoso:
                        </label>
                        <input
                          type="text"
                          value={enfermoPatientName}
                          onChange={(e) =>
                            setEnfermoPatientName(toTitleCase(e.target.value))
                          }
                          placeholder="Ex: Maria, José..."
                          className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none font-sans"
                        />
                        {enfermoPatientName && (
                          <p className="text-xs text-amber-700 mt-2 italic">
                            O nome <strong>"{enfermoPatientName}"</strong>{" "}
                            substituirá o "N." nas orações abaixo.
                          </p>
                        )}
                      </div>

                      {/* Liturgy Text Content */}
                      <div
                        className="space-y-8 text-slate-800 leading-relaxed font-serif"
                        style={{ fontSize: `${fontScale}rem` }}
                      >
                        {/* Preparação */}
                        <div className="p-4 bg-amber-100/40 rounded-xl border border-amber-200/30 text-amber-900 text-xs italic font-sans text-center">
                          (Sobre uma mesinha ou outro lugar convenientemente
                          coloque uma toalha limpa, uma vela, uma flor para que
                          o Ministro coloque aí o Santíssimo Sacramento)
                        </div>

                        {/* 1. Ritos Iniciais */}
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                          <h3 className="text-sm font-extrabold text-amber-900 border-b border-amber-200/40 pb-1.5 mb-4 uppercase tracking-wider text-center font-sans">
                            Ritos Iniciais
                          </h3>
                          <div className="space-y-3">
                            <p>
                              <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                Ministro
                              </span>{" "}
                              Em nome do Pai † e do Filho, e do Espírito Santo.
                            </p>
                            <p className="font-bold text-amber-950">
                              <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                Amém
                              </span>{" "}
                              Amém.
                            </p>
                            <p>
                              <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                Ministro
                              </span>{" "}
                              A paz que vem do Senhor esteja nesta casa.
                            </p>
                            <p className="font-bold text-amber-950">
                              <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                Resposta
                              </span>{" "}
                              E com todos os que nela moram!
                            </p>
                          </div>
                        </div>

                        {/* 2. Momento Penitencial */}
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                          <h3 className="text-sm font-extrabold text-amber-900 border-b border-amber-200/40 pb-1.5 mb-4 uppercase tracking-wider text-center font-sans">
                            Momento Penitencial
                          </h3>
                          <div className="space-y-4">
                            <p>
                              <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                Ministro
                              </span>{" "}
                              Peçamos perdão ao Senhor, de nossos pecados para
                              que, purificados em sua misericórdia, celebremos
                              com dignidade este momento.
                            </p>
                            <div className="space-y-3 pl-3 border-l-2 border-amber-200">
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Tende compaixão de nós, Senhor.
                              </p>
                              <p className="font-bold text-amber-950">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Porque somos pecadores.
                              </p>
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Manifestai, Senhor, a vossa misericórdia.
                              </p>
                              <p className="font-bold text-amber-950">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                E dai-nos a vossa salvação.
                              </p>
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                O Senhor, Deus da vida e da paz, perdoe nossas
                                ofensas e nos dê a paz.
                              </p>
                              <p className="font-bold text-amber-950">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-amber-100">
                              <p className="text-[10px] text-amber-700 font-sans font-bold uppercase tracking-widest mb-1.5">
                                Oração:
                              </p>
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Manifestai, Senhor, nosso Deus, vossa bondade
                                para com este(a) nosso(a) irmão(ã){" "}
                                <strong className="text-amber-950 font-black decoration-amber-500 underline decoration-2">
                                  {enfermoPatientName || "N."}
                                </strong>
                                , concedendo-lhe a graça da saúde e da paz, para
                                que vos sirva com alegria e generosidade, e a
                                todos edifique com seu testemunho de fé. Por
                                Cristo, nosso Senhor.
                              </p>
                              <p className="font-bold text-amber-950 mt-1.5">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Palavra de Deus */}
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                          <h3 className="text-sm font-extrabold text-amber-900 border-b border-amber-200/40 pb-1.5 mb-4 uppercase tracking-wider text-center font-sans">
                            Palavra de Deus
                          </h3>
                          <div className="space-y-4">
                            <p className="italic text-slate-700 text-sm font-sans">
                              (Proclama-se o Evangelho do dia ou escolhe-se uma
                              dentre estas leituras:)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-sans text-amber-900 font-bold">
                              <div className="p-2 bg-amber-50 border border-amber-200/30 rounded-lg text-center">
                                Jo 6,54-59
                              </div>
                              <div className="p-2 bg-amber-50 border border-amber-200/30 rounded-lg text-center">
                                Jo 14,6
                              </div>
                              <div className="p-2 bg-amber-50 border border-amber-200/30 rounded-lg text-center">
                                Jo 14,27
                              </div>
                              <div className="p-2 bg-amber-50 border border-amber-200/30 rounded-lg text-center">
                                Jo 15,4-5
                              </div>
                              <div className="p-2 bg-amber-50 border border-amber-200/30 rounded-lg text-center col-span-2 sm:col-span-1">
                                1Cor 11,26
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. Pai-Nosso e Comunhão */}
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                          <h3 className="text-sm font-extrabold text-amber-900 border-b border-amber-200/40 pb-1.5 mb-4 uppercase tracking-wider text-center font-sans">
                            Pai-Nosso e Comunhão
                          </h3>
                          <div className="space-y-5">
                            <div>
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Depois de ouvirmos a Palavra de vida e de
                                salvação, rezemos com muita confiança a oração
                                que o Senhor nos ensinou:
                              </p>
                              <p className="font-bold text-amber-950 mt-3 pl-3 border-l-2 border-amber-200">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Pai Nosso, que estais nos céus, santificado seja
                                o vosso nome; venha a nós o vosso reino, seja
                                feita a vossa vontade, assim na terra como no
                                céu. O pão nosso de cada dia nos dai hoje;
                                perdoai-nos as nossas ofensas, assim como nós
                                perdoamos a quem nos tem ofendido; e não nos
                                deixeis cair em tentação, mas livrai-nos do mal.
                                Amém.
                              </p>
                            </div>

                            <div className="pt-4 border-t border-amber-100">
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Somos felizes porque podemos participar da Ceia
                                do Senhor. Eis o Cordeiro de Deus que tira o
                                pecado do mundo.
                              </p>
                              <p className="font-bold text-amber-950 mt-2 pl-3 border-l-2 border-amber-200">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Senhor, eu não sou digno(a) de que entreis em
                                minha morada, mas dizei uma palavra e serei
                                salvo(a).
                              </p>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/20 text-center font-sans text-xs italic text-amber-900">
                              (O Ministro apresenta o Ss. Sacramento e diz)
                            </div>

                            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200/20">
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                O Corpo de Cristo!
                              </p>
                              <p className="font-bold text-amber-950 pl-3 border-l-2 border-amber-200">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>
                            </div>

                            <p className="text-xs text-amber-700 italic font-sans text-center">
                              (Se for oportuno, faz-se um instante de silêncio,
                              após a comunhão)
                            </p>

                            <div className="pt-4 border-t border-amber-100">
                              <p className="text-[10px] text-amber-700 font-sans font-bold uppercase tracking-widest mb-1.5">
                                Oração:
                              </p>
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Ó Deus, que este alimento sagrado fortifique e
                                conserve na paz este(a) nosso(a) irmão(ã){" "}
                                <strong className="text-amber-950 font-black decoration-amber-500 underline decoration-2">
                                  {enfermoPatientName || "N."}
                                </strong>
                                , e fazei que persevere na sinceridade de vosso
                                amor e de vossa misericórdia. Por Cristo, nosso
                                Senhor.
                              </p>
                              <p className="font-bold text-amber-950 mt-1.5">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 5. Invocação da Bênção */}
                        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-xs">
                          <h3 className="text-sm font-extrabold text-amber-900 border-b border-amber-200/40 pb-1.5 mb-4 uppercase tracking-wider text-center font-sans">
                            Invocação da Bênção
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Deus Pai nos abençoe.
                              </p>
                              <p className="font-bold text-amber-950 pl-4">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>

                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Deus Filho nos conceda a saúde e a paz.
                              </p>
                              <p className="font-bold text-amber-950 pl-4">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>

                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Deus Espírito Santo nos ilumine.
                              </p>
                              <p className="font-bold text-amber-950 pl-4">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>

                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Em nome do Pai † e do Filho e do Espírito Santo.
                              </p>
                              <p className="font-bold text-amber-950 pl-4">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>

                              <p>
                                <span className="font-sans font-black text-[10px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Ministro
                                </span>{" "}
                                Permaneçamos firmes na fé e na paz do Senhor.
                              </p>
                              <p className="font-bold text-amber-950 pl-4">
                                <span className="font-sans font-black text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded mr-2 uppercase tracking-wider">
                                  Todos
                                </span>{" "}
                                Amém.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer actions with Vatican News and Amém button */}
                      <div className="mt-12 pt-8 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-center gap-5 pb-8">
                        <button
                          onClick={() => setActiveTab("home")}
                          className="w-full sm:w-auto px-12 py-3.5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 fill-current animate-pulse text-blue-100" />
                            Amém / Concluir
                          </span>
                        </button>
                      </div>
                    </div>
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
                      escala={escala}
                      myAssignments={myAssignments}
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
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                            {monthNames[mesSelecionado - 1]} / {anoSelecionado}
                          </span>
                        </div>
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
                                    sucesso! Veja abaixo as datas e missas que você selecionou.
                                  </p>
                                  <SubmittedSlotsConsultation
                                    submittedList={initialSlotsSelecionados}
                                    allSlots={slotsDisponiveisApp || []}
                                    mes={mesSelecionado}
                                    ano={anoSelecionado}
                                    user={user}
                                  />
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
                                        <div
                                          className={`grid ${activeDays.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : activeDays.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 sm:gap-8" : activeDays.length === 3 ? "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6 sm:gap-8" : activeDays.length === 4 ? "grid-cols-1 md:grid-cols-4 max-w-6xl mx-auto gap-6 sm:gap-8" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8"}`}
                                        >
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

                                                              const getPeso = (
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
                                                                  modo === "ela"
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
                                                                user.tipo ===
                                                                "casal"
                                                                  ? isSelected
                                                                    ? getPeso(
                                                                        selection.modo as any,
                                                                      )
                                                                    : 2
                                                                  : 1;
                                                              const disponivel =
                                                                servCount -
                                                                  pesoInicial +
                                                                  pesoParaCheck <=
                                                                lim;
                                                              const isFull = false;
                                                              const nomeMinistro =
                                                                user?.nomeExibicao ||
                                                                user?.nome ||
                                                                "";
                                                              const isUserScheduled =
                                                                escalaApp &&
                                                                slot?.data &&
                                                                slot?.horario &&
                                                                escalaApp[
                                                                  slot.data
                                                                ] &&
                                                                escalaApp[
                                                                  slot.data
                                                                ][
                                                                  slot.horario
                                                                ] &&
                                                                (
                                                                  (
                                                                    escalaApp[
                                                                      slot.data
                                                                    ][
                                                                      slot
                                                                        .horario
                                                                    ] as any
                                                                  ).ministros ||
                                                                  []
                                                                ).includes(
                                                                  nomeMinistro,
                                                                );
                                                              const isDisabled =
                                                                isFull ||
                                                                isUserScheduled;

                                                              return (
                                                                <div
                                                                  key={slot.id}
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
                                                                      disabled={
                                                                        isDisabled
                                                                      }
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
                                                                        /{lim}{" "}
                                                                        VAGAS
                                                                      </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                      <div
                                                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-white" : isDisabled ? "bg-slate-300" : "bg-blue-500"}`}
                                                                      ></div>
                                                                      <span
                                                                        className={`text-xs font-semibold truncate ${isSelected ? "text-white/90" : "text-slate-600"}`}
                                                                      >
                                                                        {
                                                                          slot.nome
                                                                        }
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
                                                                          Ambos
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
                                      if (slotsDoDia.length === 0) return null;

                                      return (
                                        <div
                                          key={data}
                                          className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm"
                                        >
                                          <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100 font-bold text-emerald-900 capitalize text-xs">
                                            {slotsPorDiaMap[data].diaFormatado}
                                          </div>
                                          <div className="p-3 space-y-2">
                                            {slotsDoDia.map((slot: any) => {
                                              const selection =
                                                slotsSelecionados.find(
                                                  (s: any) => s.id === slot.id,
                                                );
                                              const isSelected = !!selection;
                                              const initialSelection =
                                                initialSlotsSelecionados.find(
                                                  (s: any) => s.id === slot.id,
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
                                              const lim = getLimiteVagas(slot);

                                              const getPeso = (modo) => {
                                                if (modo === "casal") return 2;
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
                                                          {ocupadosProjetados}/
                                                          {lim}
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
                                                                ).split(" ")[0]
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
                                      : isActualCoord
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {subTab === null ? (
                        <div className="flex items-center gap-2">
                          <BarChart className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">
                            Gestão da Escala:
                          </h3>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSubTab(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 rounded-xl text-xs font-black transition-all border border-slate-200 shadow-sm cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                            <span>Voltar ao Painel</span>
                          </button>
                          <div className="h-4 w-px bg-slate-200" />
                          <div className="flex items-center gap-2">
                            {subTab === "registradas" && (
                              <Clipboard className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "faltantes" && (
                              <UserX className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "monitoramento" && (
                              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                            )}
                            {subTab === "gestao" && (
                              <Calendar className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "gerar_escala" && (
                              <Zap className="w-5 h-5 text-amber-500" />
                            )}
                            {subTab === "editar_disponibilidade" && (
                              <Edit className="w-5 h-5 text-blue-600" />
                            )}
                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs">
                              {subTab === "registradas" &&
                                "Disponibilidades Registradas"}
                              {subTab === "faltantes" &&
                                "Ministros Pendentes de Envio"}
                              {subTab === "monitoramento" &&
                                "Monitoramento (Ao Vivo)"}
                              {subTab === "gestao" && "Gestão de Escala (Regras e Horários)"}
                              {subTab === "gerar_escala" && "Gerar Escala (Geração e Exportação)"}
                              {subTab === "editar_disponibilidade" &&
                                "Editar Disponibilidade"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {subTab === null && (
                      <div className="space-y-4 mt-6">
                        {/* Sub-tabs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                          {/* Option 1: Disponibilidades Registradas */}
                          <button
                            onClick={() => setSubTab("registradas")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/disp_registradas_3d.jpg"
                                alt="Disponibilidades Registradas"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Disponibilidades Registradas
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-blue-600 font-black mt-1 leading-none uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/60 block">
                              {filteredDisponibilidades.length} Registros
                            </span>
                          </button>

                          {/* Option 2: Ministros Pendentes de Envio */}
                          <button
                            onClick={() => setSubTab("faltantes")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/ministros_pendentes_3d.jpg"
                                alt="Ministros Pendentes"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Ministros Pendentes de Envio
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-600 font-black mt-1 leading-none uppercase tracking-wider bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/60 block">
                              Pendências
                            </span>
                          </button>

                          {/* Option 3: Monitoramento (Ao Vivo) */}
                          <button
                            onClick={() => setSubTab("monitoramento")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/monitoramento_ao_vivo_3d.jpg"
                                alt="Monitoramento ao Vivo"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Monitoramento (Ao Vivo)
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-emerald-600 font-black mt-1 leading-none uppercase tracking-wider bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/60 block">
                              Tempo Real
                            </span>
                          </button>

                          {/* Option 4: Gestão de Escala */}
                          <button
                            onClick={() => setSubTab("gestao")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/gestao_regras_3d.jpg"
                                alt="Gestão de Regras"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Gestão de Escala
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-blue-600 font-black mt-1 leading-none uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/60 block">
                              Configurar Regras
                            </span>
                          </button>

                          {/* Option 5: Gerar Escala */}
                          <button
                            onClick={() => setSubTab("gerar_escala")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/gerar_escala_3d.jpg"
                                alt="Gerar Escala"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Gerar Escala
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-amber-600 font-black mt-1 leading-none uppercase tracking-wider bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/60 block">
                              Geração e PDF
                            </span>
                          </button>

                          {/* Option 6: Editar Disponibilidade */}
                          <button
                            onClick={() => setSubTab("editar_disponibilidade")}
                            className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          >
                            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                              <img
                                src="/editar_disp_3d.jpg"
                                alt="Editar Disponibilidade"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                              Editar Disponibilidade
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-blue-600 font-black mt-1 leading-none uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/60 block">
                              Preencher / Alterar
                            </span>
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            Selecione uma opção acima para acessar os dados e ferramentas
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
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

                        // If no month is selected yet, default to active month (até dia 19 = mês atual; a partir do dia 20 = próximo mês)
                        if (!targetMonth) {
                          const today = new Date();
                          const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
                          targetMonth = targetDate.getMonth() + 1;
                          targetYear = targetDate.getFullYear();
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
                                        .sort((a, b) =>
                                          a.localeCompare(b, "pt-BR", {
                                            sensitivity: "base",
                                          }),
                                        )
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
                          const normalizeString = (s: string) =>
                            s
                              .trim()
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/&/g, " e ")
                              .replace(/\s+/g, " ")
                              .trim();

                          // Build map similar to slotsPorDiaMap
                          const slotsPorDiaMapMonitoramento: Record<
                            string,
                            { diaFormatado: string; slots: any[] }
                          > = {};

                          // First populate with slotsDisponiveisApp
                          (slotsDisponiveisApp || []).forEach((slot) => {
                            const dateStr = slot.data;
                            if (!dateStr) return;

                            const vKey = `${slot.data}-${slot.horario}-${normalizeString(slot.nome)}`;
                            let dataVal = vagas[vKey];

                            if (!dataVal) {
                              const prefix = `${slot.data}-${slot.horario}-`;
                              const matchingKey = Object.keys(vagas).find((k) =>
                                k.startsWith(prefix),
                              );
                              if (matchingKey) dataVal = vagas[matchingKey];
                            }

                            if (!dataVal) {
                              dataVal = {
                                total: 0,
                                casal: 0,
                                individual: 0,
                                ministros: [],
                              };
                            }

                            if (!slotsPorDiaMapMonitoramento[dateStr]) {
                              slotsPorDiaMapMonitoramento[dateStr] = {
                                diaFormatado:
                                  slot.diaFormatado ||
                                  format(
                                    new Date(dateStr + "T00:00:00"),
                                    "EEEE, dd 'de' MMMM",
                                    { locale: ptBR },
                                  ),
                                slots: [],
                              };
                            }

                            if (
                              !slotsPorDiaMapMonitoramento[dateStr].slots.some(
                                (s: any) => s.key === vKey,
                              )
                            ) {
                              slotsPorDiaMapMonitoramento[dateStr].slots.push({
                                key: vKey,
                                slot,
                                data: dataVal,
                                horario: slot.horario,
                                nome: slot.nome,
                                id: slot.id,
                              });
                            }
                          });

                          // Then populate from vagas entries not already mapped, only if they correspond to an active slot
                          Object.entries(vagas)
                            .filter(([key]) => {
                              const dateStr = key
                                .split("-")
                                .slice(0, 3)
                                .join("-");
                              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
                                return false;

                              const parts = key.split("-");
                              const time = parts[3];
                              const name = parts.slice(4).join("-") || "";
                              const normalizedName = normalizeString(name);

                              const hasMatchingActiveSlot = (
                                slotsDisponiveisApp || []
                              ).some((s) => {
                                return (
                                  s.data === dateStr &&
                                  s.horario === time &&
                                  normalizeString(s.nome) === normalizedName
                                );
                              });

                              return hasMatchingActiveSlot;
                            })
                            .forEach(([key, dataVal]) => {
                              const parts = key.split("-");
                              const dateStr = parts.slice(0, 3).join("-");
                              const time = parts[3];
                              const name = parts.slice(4).join("-") || "";

                              if (!slotsPorDiaMapMonitoramento[dateStr]) {
                                slotsPorDiaMapMonitoramento[dateStr] = {
                                  diaFormatado: format(
                                    new Date(dateStr + "T00:00:00"),
                                    "EEEE, dd 'de' MMMM",
                                    { locale: ptBR },
                                  ),
                                  slots: [],
                                };
                              }

                              if (
                                !slotsPorDiaMapMonitoramento[
                                  dateStr
                                ].slots.some((s: any) => s.key === key)
                              ) {
                                slotsPorDiaMapMonitoramento[dateStr].slots.push(
                                  {
                                    key,
                                    slot: null,
                                    data: dataVal,
                                    horario: time,
                                    nome: name,
                                    id: key,
                                  },
                                );
                              }
                            });

                          // Sort slots chronologically inside each day
                          Object.keys(slotsPorDiaMapMonitoramento).forEach(
                            (dateStr) => {
                              slotsPorDiaMapMonitoramento[dateStr].slots.sort(
                                (a, b) => {
                                  const tCompare = a.horario.localeCompare(
                                    b.horario,
                                  );
                                  if (tCompare !== 0) return tCompare;
                                  return a.nome.localeCompare(b.nome);
                                },
                              );
                            },
                          );

                          // Group Weekdays (Mon-Fri)
                          const diasSemana = Object.keys(
                            slotsPorDiaMapMonitoramento,
                          )
                            .filter((dataStr) => {
                              const dateObj = new Date(dataStr + "T00:00:00");
                              const dayOfWeek = dateObj.getDay();
                              return dayOfWeek > 0 && dayOfWeek < 6;
                            })
                            .sort();

                          const dayOfWeekMap: Record<number, string[]> = [
                            1, 2, 3, 4, 5,
                          ].reduce((acc: any, dow) => {
                            acc[dow] = diasSemana
                              .filter((dataStr) => {
                                return (
                                  new Date(dataStr + "T00:00:00").getDay() ===
                                  dow
                                );
                              })
                              .sort();
                            return acc;
                          }, {});

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

                          // Group Weekends (Sat-Sun)
                          const diasFimDeSemana = Object.keys(
                            slotsPorDiaMapMonitoramento,
                          )
                            .filter((dataStr) => {
                              const dateObj = new Date(dataStr + "T00:00:00");
                              const dayOfWeek = dateObj.getDay();
                              return dayOfWeek === 0 || dayOfWeek === 6;
                            })
                            .sort();

                          const weekends: any[] = [];
                          let currentWeekend: {
                            sabado: string | null;
                            domingo: string | null;
                          } = {
                            sabado: null,
                            domingo: null,
                          };

                          diasFimDeSemana.forEach((dataStr) => {
                            const dateObj = new Date(dataStr + "T00:00:00");
                            const day = dateObj.getDay();

                            if (day === 6) {
                              if (currentWeekend.sabado) {
                                weekends.push(currentWeekend);
                                currentWeekend = {
                                  sabado: dataStr,
                                  domingo: null,
                                };
                              } else {
                                currentWeekend.sabado = dataStr;
                              }
                            } else if (day === 0) {
                              currentWeekend.domingo = dataStr;
                              weekends.push(currentWeekend);
                              currentWeekend = {
                                sabado: null,
                                domingo: null,
                              };
                            }
                          });
                          if (currentWeekend.sabado || currentWeekend.domingo) {
                            weekends.push(currentWeekend);
                          }

                          // Helper to render inline slot card
                          const renderMonitoramentoSlot = (
                            { key, slot, data: dataVal, horario, nome }: any,
                            isWeekend = false,
                          ) => {
                            const countVal =
                              typeof dataVal === "object"
                                ? dataVal.total || 0
                                : dataVal;
                            const discount = getIncompatibilityDiscountForList(
                              dataVal.ministros || [],
                              allMinisters,
                            );
                            const adjustedCountVal = Math.max(
                              0,
                              countVal - discount,
                            );
                            const numCasais =
                              typeof dataVal === "object"
                                ? dataVal.casal || 0
                                : 0;
                            const numIndiv =
                              typeof dataVal === "object"
                                ? dataVal.individual || 0
                                : typeof dataVal === "number"
                                  ? dataVal
                                  : 0;
                            const customLimit =
                              slot && slot.limiteManual ? slot.limiteManual : 8;

                            const isLeitor = key.includes("leitor");

                            let badgeStyle =
                              "bg-slate-100 text-slate-500 border border-slate-200";
                            if (adjustedCountVal < customLimit) {
                              badgeStyle =
                                "bg-red-100 text-red-700 border border-red-200/60 font-black";
                            } else if (adjustedCountVal === customLimit) {
                              badgeStyle =
                                "bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-black";
                            } else if (adjustedCountVal > customLimit) {
                              badgeStyle =
                                "bg-blue-100 text-blue-700 border border-blue-200/60 font-black";
                            }

                            return (
                              <div
                                key={key}
                                className="relative flex flex-col p-4 rounded-2xl border w-full transition-all duration-200 bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xl font-extrabold leading-none tracking-tight text-slate-800">
                                        {horario}
                                      </span>
                                      <span className="hidden text-xs font-semibold text-slate-500 truncate max-w-[150px]">
                                        - {nome}
                                      </span>
                                      {isLeitor && (
                                        <span className="hidden text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Leitor
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none ${badgeStyle}`}
                                  >
                                    {adjustedCountVal}/{customLimit} VAGAS
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 overflow-hidden mb-2">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500"></div>
                                  <span className="text-xs font-semibold truncate text-slate-600">
                                    {nome}
                                  </span>
                                  {isLeitor && (
                                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      Leitor
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-1">
                                  {/* Avatars */}
                                  {(() => {
                                    const avatarItems = [
                                      ...Array(numCasais).fill({
                                        type: "casal",
                                      }),
                                      ...Array(numIndiv).fill({
                                        type: "individual",
                                      }),
                                    ];
                                    const maxVisibleAvatars = 4;
                                    const visibleAvatars = avatarItems.slice(
                                      0,
                                      maxVisibleAvatars,
                                    );
                                    const remainingCount =
                                      avatarItems.length - maxVisibleAvatars;

                                    return (
                                      <div className="flex -space-x-1.5 items-center flex-wrap">
                                        {visibleAvatars.map((item, idx) =>
                                          item.type === "casal" ? (
                                            <div
                                              key={`c-${idx}`}
                                              className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-inner shrink-0"
                                              title="Casal"
                                            >
                                              <Users className="w-3 h-3 text-white" />
                                            </div>
                                          ) : (
                                            <div
                                              key={`i-${idx}`}
                                              className="w-6 h-6 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-inner shrink-0"
                                              title="Individual"
                                            >
                                              <User className="w-3 h-3 text-white" />
                                            </div>
                                          ),
                                        )}
                                        {remainingCount > 0 && (
                                          <div
                                            className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-inner shrink-0 z-10 text-[9px] font-black text-slate-500"
                                            title={`${remainingCount} mais`}
                                          >
                                            +{remainingCount}
                                          </div>
                                        )}
                                        {adjustedCountVal === 0 && (
                                          <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center shrink-0 select-none">
                                            <span className="text-[10px] font-bold text-slate-300">
                                              0
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-1000 ${adjustedCountVal >= customLimit ? "bg-blue-600" : "bg-blue-400"}`}
                                    style={{
                                      width: `${Math.min((adjustedCountVal / customLimit) * 100, 100)}%`,
                                    }}
                                  ></div>
                                </div>

                                {/* Ministers List */}
                                {dataVal.ministros &&
                                  dataVal.ministros.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5 max-h-24 overflow-y-auto pr-1 thin-scrollbar">
                                      {[...dataVal.ministros]
                                        .sort((a: any, b: any) => {
                                          const nameA =
                                            typeof a === "string"
                                              ? a
                                              : a?.nome || "";
                                          const nameB =
                                            typeof b === "string"
                                              ? b
                                              : b?.nome || "";
                                          const isLiderA = isMinisterLeader(nameA, dataVal.lider);
                                          const isLiderB = isMinisterLeader(nameB, dataVal.lider);
                                          if (isLiderA && !isLiderB) return -1;
                                          if (!isLiderA && isLiderB) return 1;
                                          return nameA.localeCompare(
                                            nameB,
                                            "pt-BR",
                                            { sensitivity: "base" },
                                          );
                                        })
                                        .map(
                                        (m: any, mIdx: number) => {
                                          const ministerName = typeof m === "string" ? m : m?.nome || "";
                                          const isLider = isMinisterLeader(ministerName, dataVal.lider);

                                          return (
                                            <div
                                              key={mIdx}
                                              className={`flex items-center justify-between gap-2 p-1 rounded`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                <div
                                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLider ? "bg-blue-900" : m.tipo === "casal" ? "bg-rose-400" : "bg-sky-400"}`}
                                                ></div>
                                                {renderMinisterWithStar(ministerName, dataVal.lider, undefined, { className: `text-[10px] font-bold truncate capitalize ${isLider ? "text-blue-950 font-black" : "text-slate-700"}`, lowercase: true })}
                                              </div>
                                              
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          };

                          const renderDayCard = (dataStr: string) => {
                            const slotsDoDia =
                              slotsPorDiaMapMonitoramento[dataStr]?.slots || [];
                            if (slotsDoDia.length === 0) return null;

                            return (
                              <div
                                key={dataStr}
                                className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm"
                              >
                                <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 font-bold text-blue-900 capitalize text-xs">
                                  {
                                    slotsPorDiaMapMonitoramento[dataStr]
                                      .diaFormatado
                                  }
                                </div>
                                <div className="p-3 space-y-3">
                                  {slotsDoDia.map((slotObj: any) =>
                                    renderMonitoramentoSlot(slotObj, false),
                                  )}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="space-y-10">
                              {/* DIARIAS */}
                              {activeDays.length > 0 && (
                                <div className="overflow-hidden">
                                  <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                                      <CalendarDays className="w-6 h-6 text-white" />
                                    </div>
                                    Missas Diárias • Monitoramento
                                  </h2>
                                  <div
                                    className={`grid ${activeDays.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : activeDays.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 sm:gap-8" : activeDays.length === 3 ? "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6 sm:gap-8" : activeDays.length === 4 ? "grid-cols-1 md:grid-cols-4 max-w-6xl mx-auto gap-6 sm:gap-8" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8"}`}
                                  >
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
                                              {days.map((dataStr, idx) => (
                                                <div
                                                  key={dataStr}
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
                                                        slotsPorDiaMapMonitoramento[
                                                          dataStr
                                                        ].diaFormatado
                                                      }
                                                    </h3>
                                                  </div>
                                                  <div className="space-y-3">
                                                    {slotsPorDiaMapMonitoramento[
                                                      dataStr
                                                    ].slots.map((slotObj) =>
                                                      renderMonitoramentoSlot(
                                                        slotObj,
                                                      ),
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
                              )}

                              {/* WEEKENDS */}
                              {weekends.length > 0 && (
                                <div className="space-y-4">
                                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                    Missas de Fim de Semana • Monitoramento
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
                              )}
                            </div>
                          );
                        })()
                      )}
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
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Limite de Escalação Mensal por Ministro
                              </h4>
                              <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                                Escolha quantas vezes cada ministro ou casal de
                                ministros pode ser escalado no mês durante a
                                geração automática da escala.
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
                                    {opt === "libre"
                                      ? "Liberado (Livre)"
                                      : `${opt} ${opt === 1 ? "vez" : "vezes"}`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 mt-8 pt-6">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Limite de Ministros Novos por Missa
                              </h4>
                              <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                                Escolha quantos ministros novos (casal ou
                                individual) podem ser escalados em cada missa no
                                máximo durante a geração automática da escala.
                              </p>
                              <div className="flex flex-wrap gap-2 animate-fade-in">
                                {["livre", 1, 2, 3].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setLimiteNovos(opt as any)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                                      limiteNovos === opt
                                        ? "bg-slate-900 text-white border-transparent shadow-sm scale-[1.02]"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {opt === "livre"
                                      ? "Liberado (Livre)"
                                      : `Limite ${opt} por missa`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 mt-8 pt-6">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Regra de Disponibilidade dos Ministros
                              </h4>
                              <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
                                Defina qual o critério ou limite de seleção que
                                os ministros devem seguir ao enviar suas
                                disponibilidades mensais no painel deles.
                              </p>
                              <div className="flex flex-wrap gap-2 animate-fade-in">
                                {[
                                  {
                                    value: "livre",
                                    label: "Disponibilidade Livre",
                                  },
                                  {
                                    value: "regra2",
                                    label: "Limite de 2 datas não sequenciais",
                                  },
                                  {
                                    value: "regra3",
                                    label: "Limite de 3 datas não sequenciais",
                                  },
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      setRegraDisponibilidade(opt.value as any)
                                    }
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                                      regraDisponibilidade === opt.value
                                        ? "bg-slate-900 text-white border-transparent shadow-sm scale-[1.02]"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 mt-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          </div>
                        </div>

                        {/* Botões de Ação do Agendamento */}
                        <div className="flex items-center justify-end gap-3 mt-2 mb-8 mr-1">
                          <button
                            type="button"
                            onClick={handleResetAgendamento}
                            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-sm rounded-xl transition-colors border border-slate-200 hover:border-slate-300 bg-white shadow-sm"
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

                        {/* Scale Reminders & Notifications for Coordinators */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 relative group">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Bell className="w-32 h-32 text-blue-600" />
                          </div>
                          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900">
                              Gestão de Escala
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Automatic Reminder Section */}
                              <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex flex-col justify-between gap-4">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                      Lembrete Automático
                                    </h4>
                                    <button
                                      onClick={handleToggleLembreteAutomatico}
                                      disabled={loading}
                                      className={`relative inline-flex h-5 w-10 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${lembreteAutomatico ? "bg-blue-600" : "bg-slate-300"}`}
                                    >
                                      <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${lembreteAutomatico ? "translate-x-5" : "translate-x-0.5"}`}
                                      />
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                                    Quando ativado, os ministros receberão
                                    notificações <strong>24 horas antes</strong> e{" "}
                                    <strong>3 horas antes</strong> de cada missa
                                    na escala publicada.
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full ${lembreteAutomatico ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`}
                                  />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Status:{" "}
                                    {lembreteAutomatico
                                      ? "Ativado"
                                      : "Desativado"}
                                  </span>
                                </div>
                              </div>

                              {/* Manual Weekend Reminder Section */}
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Disparo de Fim de Semana
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                                    Dispare lembretes instantâneos neste momento
                                    para todos os ministros escalados na{" "}
                                    <strong>
                                      Sexta-feira, Sábado e Domingo
                                    </strong>{" "}
                                    desta semana.
                                  </p>
                                </div>
                                <div>
                                  <button
                                    onClick={handleEnviarLembretesManual}
                                    disabled={enviandoLembretes}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-98 disabled:opacity-50"
                                  >
                                    <Bell
                                      className={`w-4 h-4 ${enviandoLembretes ? "animate-spin" : "animate-bounce"}`}
                                    />
                                    {enviandoLembretes
                                      ? "Disparando..."
                                      : "Disparar Lembretes de FDS"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {subTab === "gerar_escala" && (
                    <div className="p-6 space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                            <span>Coordenação</span>
                            <span>•</span>
                            <span>Ações de Escala</span>
                          </div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Geração e Publicação da Escala
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Abra o envio de disponibilidade, calcule as distribuições com motor inteligente, confira as missas e exporte o PDF.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {/* 1. Abrir/Fechar Disponibilidade */}
                        <button
                          onClick={handleToggleDisponibilidade}
                          className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                        >
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                            <img
                              src="/abrir_disp_3d.jpg"
                              alt="Abrir/Fechar Disponibilidade"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                            {disponibilidadeAberta ? "Fechar Disponibilidade" : "Abrir Disponibilidade"}
                          </span>
                          <span className={`text-[8px] sm:text-[9px] font-black mt-1 leading-none uppercase tracking-wider px-1.5 py-0.5 rounded border block ${disponibilidadeAberta ? "bg-emerald-100/70 text-emerald-700 border-emerald-200/60" : "bg-slate-100/80 text-slate-500 border-slate-200/60"}`}>
                            {manualOverride !== undefined ? "Modo Manual" : "Automático"}
                          </span>
                        </button>

                        {/* 2. Gerar Escala */}
                        <button
                          onClick={handleGerarEscala}
                          className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                        >
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-200/60 text-amber-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(245,158,11,0.08)]">
                            <img
                              src="/gerar_escala_3d.jpg"
                              alt="Gerar Escala"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                            Gerar Escala
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-amber-600 font-black mt-1 leading-none uppercase tracking-wider bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200/60 block">
                            Cálculo Inteligente
                          </span>
                        </button>

                        {/* 3. Visualizar Escala (conferência) */}
                        <button
                          onClick={handleAbrirConferencia}
                          className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                        >
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]">
                            <img
                              src="/conferencia_3d.jpg"
                              alt="Visualizar Escala (Conferência)"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-blue-700 line-clamp-2 text-center px-0.5">
                            Visualizar Escala
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-blue-600 font-black mt-1 leading-none uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/60 block">
                            Conferência
                          </span>
                        </button>

                        {/* 4. Baixar PDF */}
                        <button
                          onClick={handleDownloadPDF}
                          className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                        >
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-red-500/20 to-red-500/5 border-red-200/60 text-red-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(239,68,68,0.08)]">
                            <img
                              src="/download_pdf_3d.jpg"
                              alt="Baixar PDF"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                            Baixar PDF
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-red-600 font-black mt-1 leading-none uppercase tracking-wider bg-red-100/70 px-1.5 py-0.5 rounded border border-red-200/60 block">
                            Exportar
                          </span>
                        </button>

                        {/* 5. Panorama */}
                        <button
                          onClick={() => setShowPanoramaModal(true)}
                          className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square bg-blue-900/[0.04] backdrop-blur-md border-red-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                        >
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-purple-200/60 text-purple-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(147,51,234,0.08)]">
                            <img
                              src="/panorama_3d.jpg"
                              alt="Panorama"
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 text-center px-0.5">
                            Panorama
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-purple-600 font-black mt-1 leading-none uppercase tracking-wider bg-purple-100/70 px-1.5 py-0.5 rounded border border-purple-200/60 block">
                            Visão Geral
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
{subTab === "editar_disponibilidade" && (
                    <EditarDisponibilidadeView
                      user={user}
                      ministros={allMinisters}
                      disponibilidades={disponibilidades}
                      slotsDisponiveisApp={slotsDisponiveisApp}
                      mesSelecionado={mesSelecionado}
                      anoSelecionado={anoSelecionado}
                      onRefreshDisponibilidades={() => fetchData(true)}
                      onAlert={(msg) => onAlert && onAlert("Aviso", msg)}
                    />
                  )}
                </div>
              )}
              {activeTab === "escala" && (
                <>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isActualCoord && (
                          <button
                            onClick={() => setActiveTab("relatorios")}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                            title="Voltar para Gestão da Escala"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        <h3 className="font-bold text-slate-900">
                          {isActualCoord ? "Gerenciamento de Escala" : "Escala de Ministros"}
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

                                            const minsListCoord = Array.isArray(missa) ? missa : missa?.ministros || [];
                                            let cardHeadcountCoord = 0;
                                            minsListCoord.forEach((m: any) => {
                                              const mName = typeof m === "string" ? m : m?.nome || "";
                                              if (mName.includes(" e ")) cardHeadcountCoord += 2;
                                              else cardHeadcountCoord += 1;
                                            });
                                            const cardLimiteCoord = missa?.limiteManual !== undefined ? Number(missa.limiteManual) : 8;
                                            const missingCountCoord = Math.max(0, cardLimiteCoord - cardHeadcountCoord);
                                            return (
                                              <div
                                                key={horario}
                                                className={`p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all ${isDomingo ? "bg-red-50 border-red-100" : "bg-white border-slate-100"}`}
                                              >
                                                <div className="flex justify-between items-center mb-3">
                                                  <div>
                                                    <span
                                                      className={`text-sm font-black block ${isDomingo ? "text-red-600" : "text-liturgy-600"}`}
                                                    >
                                                      {horario}
                                                    </span>

                                                  </div>
                                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                    <span
                                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isDomingo ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400"}`}
                                                    >
                                                      {missa.nome || "Missa"}
                                                    </span>
                                                    {missingCountCoord > 0 && (
                                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                                        {cardHeadcountCoord}/{cardLimiteCoord} Vagas (Falta {missingCountCoord})
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  {[
                                                    ...(Array.isArray(missa)
                                                      ? missa
                                                      : missa?.ministros || []),
                                                  ]
                                                    .sort((a, b) => {
                                                      const nameA =
                                                        typeof a === "string"
                                                          ? a
                                                          : a?.nome || "";
                                                      const nameB =
                                                        typeof b === "string"
                                                          ? b
                                                          : b?.nome || "";
                                                      const isLiderA = isMinisterLeader(nameA, missa.lider);
                                                      const isLiderB = isMinisterLeader(nameB, missa.lider);
                                                      if (isLiderA && !isLiderB) return -1;
                                                      if (!isLiderA && isLiderB) return 1;
                                                      return nameA.localeCompare(
                                                        nameB,
                                                        "pt-BR",
                                                        { sensitivity: "base" },
                                                      );
                                                    })
                                                    .map((m, idx) => {
                                                    const ministerName =
                                                      typeof m === "string"
                                                        ? m
                                                        : m?.nome || "";
                                                    const normalizedM =
                                                      normalize(ministerName);
                                                    const isMe = isMinisterMatchingUser(m, user);
                                                    const isLider = isMinisterLeader(ministerName, missa.lider);

                                                    return (
                                                      <div
                                                        key={idx}
                                                        className={`text-xs font-bold flex items-center justify-between gap-2 p-1.5 rounded-lg transition-all ${
                                                          isMe
                                                            ? "text-liturgy-700 bg-liturgy-50 border border-liturgy-100"
                                                            : isDomingo
                                                            ? "text-red-800 bg-red-50/30"
                                                            : "text-slate-700 bg-slate-50/50"
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                          <div
                                                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                              isLider
                                                                ? "bg-blue-900"
                                                                : isMe
                                                                ? "bg-liturgy-600 animate-pulse"
                                                                : isDomingo
                                                                ? "bg-red-400"
                                                                : "bg-liturgy-400"
                                                            }`}
                                                          ></div>
                                                          {renderMinisterWithStar(ministerName, missa.lider, undefined, { className: "truncate" })}
                                                        </div>

                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                          {isMe && (
                                                            <Check className="w-3 h-3 text-liturgy-600" />
                                                          )}

                                                          
                                                        </div>
                                                      </div>
                                                    );
                                                  })}

                                                  {missingCountCoord > 0 &&
                                                    Array.from({ length: missingCountCoord }).map((_, missingIdx) => (
                                                      <div
                                                        key={`aguardando-${missingIdx}`}
                                                        className="text-xs font-black flex items-center justify-between gap-2 p-2 rounded-xl border-2 border-red-300 bg-red-100/90 text-red-700 shadow-xs animate-pulse"
                                                      >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0 animate-ping" />
                                                          <span className="truncate uppercase font-black text-red-700">Aguardando</span>
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-200 text-red-900 border border-red-300 font-extrabold">
                                                          À espera
                                                        </span>
                                                      </div>
                                                    ))}
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
                        Gerencie solicitações de trocas de celebrações e
                        acompanhe confirmações.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isActualCoord && (
                        <button
                          onClick={() => {
                            setQuickSwapSlotA(null);
                            setQuickSwapSlotB(null);
                            setShowTrocasRapidasModal(true);
                          }}
                          className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-200"
                        >
                          <Zap className="w-4 h-4" />
                          TROCAS RÁPIDAS
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTrocaMissaOrigem(null);
                          setTrocaMissaDestino(null);
                          setTrocaDestinatario(null);
                          setTrocaTipo("direta");
                          setShowSolicitarTrocaModal(true);
                        }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200"
                      >
                        <Plus className="w-4 h-4" />
                        NOVA SOLICITAÇÃO
                      </button>
                    </div>
                  </div>

                  {/* Solicitações Ativas Section */}
                  {(() => {
                    const uniqueSwapsMap = new Map();
                    trocas.forEach((t: any) => {
                      if (t) {
                        const key = `${t.solicitanteId || ""}_${t.missaOrigemData || ""}_${t.missaOrigemHorario || ""}_${t.destinatarioId || ""}_${t.tipo || ""}`;
                        uniqueSwapsMap.set(key, t);
                      }
                    });
                    const uniqueSwaps = Array.from(uniqueSwapsMap.values());

                    // Filter for active ones (requiring attention or in progress)
                    const pendingMyAction = uniqueSwaps.filter((t: any) => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                      const isSwapInPast = t.missaOrigemData && (t.missaOrigemData < todayStr || (t.missaOrigemData === todayStr && t.missaOrigemHorario && t.missaOrigemHorario < currentTimeStr));
                      if (isSwapInPast) return false;

                      if (!isActualCoord && user?.id) {
                        if (
                          t.solicitanteId !== user.id &&
                          t.destinatarioId !== user.id
                        ) {
                          return false;
                        }
                      }

                      if (isActualCoord) {
                        return (
                          t.status === "pendente_coordenacao" ||
                          t.status === "pendente_destinatario"
                        );
                      } else {
                        const activeRequest =
                          t.status === "pendente_destinatario" ||
                          t.status === "pendente_coordenacao";
                        const isSolicitant = t.solicitanteId === user?.id;
                        const isDest = t.destinatarioId === user?.id;
                        
                        const solUnread =
                          isSolicitant &&
                          t.confirmadoSolicitante !== true &&
                          (t.status === "aprovado" ||
                            t.status === "rejeitado_coordenacao" ||
                            t.status === "rejeitado_destinatario");
                        const destUnread =
                          isDest &&
                          t.confirmadoDestinatario !== true &&
                          (t.status === "aprovado" ||
                            t.status === "rejeitado_coordenacao");

                        return activeRequest || solUnread || destUnread;
                      }
                    });

                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                          <h4 className="font-bold text-amber-900 text-sm">
                            Solicitações Ativas ({pendingMyAction.length})
                          </h4>
                        </div>
                        {pendingMyAction.length === 0 ? (
                          <div className="text-center py-6 bg-white/60 rounded-2xl border border-dashed border-amber-200">
                            <p className="text-amber-800 font-medium text-xs">
                              Nenhuma solicitação ativa pendente no momento.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pendingMyAction.map((t: any) => {
                              const oData = t.missaOrigemData
                                ? t.missaOrigemData
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "";
                              const dData = t.missaDestinoData
                                ? t.missaDestinoData
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "";

                              const isSolicitant = t.solicitanteId === user?.id;
                              const isDest = t.destinatarioId === user?.id;

                              const coordActionNeeded =
                                isActualCoord &&
                                (t.status === "pendente_coordenacao" ||
                                  t.status === "pendente_destinatario");
                              const destActionNeeded =
                                !isActualCoord &&
                                isDest &&
                                t.status === "pendente_destinatario";
                              const solActionNeeded = false;
                              const ackActionNeeded =
                                !isActualCoord &&
                                !destActionNeeded &&
                                ((isSolicitant &&
                                  t.confirmadoSolicitante !== true &&
                                  (t.status === "aprovado" ||
                                    t.status === "rejeitado_coordenacao" ||
                                    t.status === "rejeitado_destinatario")) ||
                                  (isDest &&
                                    t.confirmadoDestinatario !== true &&
                                    (t.status === "aprovado" ||
                                      t.status === "rejeitado_coordenacao")));

                              return (
                                <div
                                  key={t.id}
                                  className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                >
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapSolicitanteDisplay(t)}
                                      </span>
                                      <span className="text-slate-400 text-xs">
                                        ➔
                                      </span>
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapDestinatarioDisplay(t)}
                                        {t.segundoDestinatarioNome
                                          ? ` e ${t.segundoDestinatarioNome}`
                                          : ""}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${t.tipo === "direta" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}
                                      >
                                        {t.tipo === "direta"
                                          ? "Troca Direta"
                                          : "Substituição"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                      Origem:{" "}
                                      <strong>
                                        {oData} às {t.missaOrigemHorario}
                                      </strong>{" "}
                                      ({t.missaOrigemMissa})
                                    </p>
                                    {t.tipo === "direta" && (
                                      <p className="text-xs text-slate-600">
                                        Destino sugerido:{" "}
                                        <strong>
                                          {dData} às {t.missaDestinoHorario}
                                        </strong>{" "}
                                        ({t.missaDestinoMissa})
                                      </p>
                                    )}

                                    {destActionNeeded && (
                                      <p className="text-xs text-blue-800 font-medium bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-1">
                                        {t.tipo === "direta"
                                          ? `Em troca, ele propõe assumir a sua celebração de ${dData} às ${t.missaDestinoHorario}.`
                                          : `Ele solicita que você atue como padrinho substituto para esta data.`}
                                      </p>
                                    )}

                                    {ackActionNeeded && (
                                      <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                        <p className="font-bold text-slate-800">
                                          Resultado do Pedido:
                                        </p>
                                        {t.status === "aprovado" ? (
                                          <span className="text-emerald-700 font-medium">
                                            Aprovado pela Coordenação! (Escala
                                            Atualizada)
                                          </span>
                                        ) : t.status ===
                                          "rejeitado_coordenacao" ? (
                                          <span className="text-red-700 font-medium">
                                            Recusado pela Coordenação.
                                          </span>
                                        ) : (
                                          <span className="text-red-700 font-medium">
                                            Recusado pelo ministro convidado.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                    {t.status === "pendente_destinatario" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-mono uppercase tracking-wider">
                                        Aguardando Ministro
                                      </span>
                                    ) : t.status === "pendente_coordenacao" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 font-mono uppercase tracking-wider">
                                        Pendente Coordenação
                                      </span>
                                    ) : t.status === "aprovado" ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono uppercase tracking-wider">
                                        Aprovado
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 font-mono uppercase tracking-wider">
                                        Recusado
                                      </span>
                                    )}

                                    <div className="flex gap-2 mt-1 w-full justify-end">
                                      {coordActionNeeded && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleResponderCoordenador(
                                                t.id,
                                                "rejeitar",
                                              )
                                            }
                                            className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 flex items-center gap-1 active:scale-95 bg-white"
                                          >
                                            <X className="w-3.5 h-3.5" />{" "}
                                            Recusar
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleResponderCoordenador(
                                                t.id,
                                                "aprovar",
                                              )
                                            }
                                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                          >
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            {t.status ===
                                            "pendente_destinatario"
                                              ? "Aprovar / Forçar"
                                              : "Aprovar"}
                                          </button>
                                        </>
                                      )}

                                      {destActionNeeded && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleResponderMinistro(
                                                t.id,
                                                "rejeitar",
                                              )
                                            }
                                            className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 flex items-center gap-1 active:scale-95 bg-white"
                                          >
                                            <X className="w-3.5 h-3.5" />{" "}
                                            Rejeitar
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleResponderMinistro(
                                                t.id,
                                                "aceitar",
                                              )
                                            }
                                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                          >
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            Aceitar Troca
                                          </button>
                                        </>
                                      )}

                                      {ackActionNeeded && (
                                        <button
                                          onClick={() =>
                                            handleConfirmarLeitura(t.id)
                                          }
                                          className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1 font-mono uppercase tracking-wider text-center"
                                        >
                                          Amém / Entendido
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Swaps History list */}
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Navigation bar */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
                        Histórico de Solicitações
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        {user?.paroquia
                          ? user.paroquia.replace("paroquia ", "").toUpperCase()
                          : ""}
                      </span>
                    </div>

                    <div className="p-6">
                      {(() => {
                        // Filter swaps to display (all relevant to user / parish) and deduplicate them
                        const uniqueSwapsMap = new Map();
                        trocas.forEach((t: any) => {
                          if (t) {
                            const key = `${t.solicitanteId || ""}_${t.missaOrigemData || ""}_${t.missaOrigemHorario || ""}_${t.destinatarioId || ""}_${t.tipo || ""}`;
                            uniqueSwapsMap.set(key, t);
                          }
                        });
                        const uniqueSwaps = Array.from(uniqueSwapsMap.values());

                        const displayedSwaps = uniqueSwaps.filter((t: any) => {
                          if (!isActualCoord && user?.id) {
                            if (
                              t.solicitanteId !== user.id &&
                              t.destinatarioId !== user.id
                            ) {
                              return false;
                            }
                          }

                          // To completely avoid duplication, the History section only displays completed/finalized swaps
                          // that do NOT require active confirmation or attention anymore
                          const isPending =
                            t.status === "pendente_coordenacao" ||
                            t.status === "pendente_destinatario";

                          const isSolicitant = t.solicitanteId === user?.id;
                          const isDest = t.destinatarioId === user?.id;
                          const hasUnreadOutcome =
                            !isActualCoord &&
                            ((isSolicitant &&
                              t.confirmadoSolicitante !== true &&
                              (t.status === "aprovado" ||
                                t.status === "rejeitado_coordenacao" ||
                                t.status === "rejeitado_destinatario")) ||
                              (isDest &&
                                t.confirmadoDestinatario !== true &&
                                (t.status === "aprovado" ||
                                  t.status === "rejeitado_coordenacao")));

                          const now = new Date();
                          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                          const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                          const isSwapInPast = t.missaOrigemData && (t.missaOrigemData < todayStr || (t.missaOrigemData === todayStr && t.missaOrigemHorario && t.missaOrigemHorario < currentTimeStr));

                          const isActive = (isPending || hasUnreadOutcome) && !isSwapInPast;
                          return !isActive;
                        });

                        if (displayedSwaps.length === 0) {
                          return (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-500 font-medium text-xs">
                                Nenhuma solicitação encontrada.
                              </p>
                            </div>
                          );
                        }

                        // Sort swaps: place those requiring immediate action of the current user at the top
                        const sortedSwaps = [...displayedSwaps].sort(
                          (a: any, b: any) => {
                            const isSolicitantA = a.solicitanteId === user?.id;
                            const isDestA = a.destinatarioId === user?.id;
                            const coordActionNeededA =
                              isActualCoord &&
                              (a.status === "pendente_coordenacao" ||
                                a.status === "pendente_destinatario");
                            const destActionNeededA =
                              !isActualCoord &&
                              isDestA &&
                              a.status === "pendente_destinatario";
                            const ackActionNeededA =
                              !isActualCoord &&
                              ((isSolicitantA &&
                                a.confirmadoSolicitante !== true &&
                                (a.status === "aprovado" ||
                                  a.status === "rejeitado_coordenacao" ||
                                  a.status === "rejeitado_destinatario")) ||
                                (isDestA &&
                                  a.confirmadoDestinatario !== true &&
                                  (a.status === "aprovado" ||
                                    a.status === "rejeitado_coordenacao")));
                            const actionNeededA =
                              coordActionNeededA ||
                              destActionNeededA ||
                              ackActionNeededA;

                            const isSolicitantB = b.solicitanteId === user?.id;
                            const isDestB = b.destinatarioId === user?.id;
                            const coordActionNeededB =
                              isActualCoord &&
                              (b.status === "pendente_coordenacao" ||
                                b.status === "pendente_destinatario");
                            const destActionNeededB =
                              !isActualCoord &&
                              isDestB &&
                              b.status === "pendente_destinatario";
                            const ackActionNeededB =
                              !isActualCoord &&
                              ((isSolicitantB &&
                                b.confirmadoSolicitante !== true &&
                                (b.status === "aprovado" ||
                                  b.status === "rejeitado_coordenacao" ||
                                  b.status === "rejeitado_destinatario")) ||
                                (isDestB &&
                                  b.confirmadoDestinatario !== true &&
                                  (b.status === "aprovado" ||
                                    b.status === "rejeitado_coordenacao")));
                            const actionNeededB =
                              coordActionNeededB ||
                              destActionNeededB ||
                              ackActionNeededB;

                            if (actionNeededA && !actionNeededB) return -1;
                            if (!actionNeededA && actionNeededB) return 1;

                            const dateA = a.missaOrigemData
                              ? new Date(a.missaOrigemData).getTime()
                              : 0;
                            const dateB = b.missaOrigemData
                              ? new Date(b.missaOrigemData).getTime()
                              : 0;
                            return dateB - dateA;
                          },
                        );

                        return (
                          <div className="space-y-4">
                            {sortedSwaps.map((t: any) => {
                              const oData = t.missaOrigemData
                                ? t.missaOrigemData
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "";
                              const dData = t.missaDestinoData
                                ? t.missaDestinoData
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "";

                              const isSolicitant = t.solicitanteId === user?.id;
                              const isDest = t.destinatarioId === user?.id;

                              const coordActionNeeded =
                                isActualCoord &&
                                (t.status === "pendente_coordenacao" ||
                                  t.status === "pendente_destinatario");
                              const destActionNeeded =
                                !isActualCoord &&
                                isDest &&
                                t.status === "pendente_destinatario";
                              const ackActionNeeded =
                                !isActualCoord &&
                                ((isSolicitant &&
                                  t.confirmadoSolicitante !== true &&
                                  (t.status === "aprovado" ||
                                    t.status === "rejeitado_coordenacao" ||
                                    t.status === "rejeitado_destinatario")) ||
                                  (isDest &&
                                    t.confirmadoDestinatario !== true &&
                                    (t.status === "aprovado" ||
                                      t.status === "rejeitado_coordenacao")));

                              const actionNeeded =
                                coordActionNeeded ||
                                destActionNeeded ||
                                ackActionNeeded;

                              return (
                                <div
                                  key={t.id}
                                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                    actionNeeded
                                      ? "bg-amber-50/40 border-amber-300 shadow-sm"
                                      : "bg-slate-50 border-slate-200 hover:border-blue-300"
                                  }`}
                                >
                                  <div className="space-y-1 w-full sm:w-auto">
                                    {actionNeeded && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 uppercase tracking-widest font-mono mb-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                        Sua Ação é Necessária
                                      </span>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapSolicitanteDisplay(t)}
                                      </span>
                                      <span className="text-slate-400 text-xs">
                                        ➔
                                      </span>
                                      <span className="text-xs font-bold text-slate-900">
                                        {getSwapDestinatarioDisplay(t)}
                                        {t.segundoDestinatarioNome
                                          ? ` e ${t.segundoDestinatarioNome}`
                                          : ""}
                                      </span>
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono ${t.tipo === "direta" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}
                                      >
                                        {t.tipo === "direta"
                                          ? "Troca Direta"
                                          : "Substituição"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                      Origem:{" "}
                                      <strong>
                                        {oData} às {t.missaOrigemHorario}
                                      </strong>{" "}
                                      ({t.missaOrigemMissa})
                                    </p>
                                    {t.tipo === "direta" && (
                                      <p className="text-xs text-slate-600">
                                        Destino sugerido:{" "}
                                        <strong>
                                          {dData} às {t.missaDestinoHorario}
                                        </strong>{" "}
                                        ({t.missaDestinoMissa})
                                      </p>
                                    )}

                                    {/* Inline action guidance */}
                                    {destActionNeeded && (
                                      <p className="text-xs text-blue-800 font-medium bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-1">
                                        {t.tipo === "direta"
                                          ? `Em troca, ele propõe assumir a sua celebração de ${dData} às ${t.missaDestinoHorario}.`
                                          : `Ele solicita que você atue como padrinho substituto para esta data.`}
                                      </p>
                                    )}

                                    {ackActionNeeded && (
                                      <div className="text-xs text-slate-700 bg-white/60 p-2 rounded-lg border border-slate-100 mt-1">
                                        <p className="font-bold text-slate-800">
                                          Resultado do Pedido:
                                        </p>
                                        {t.status === "aprovado" ? (
                                          <span className="text-emerald-700 font-medium">
                                            Aprovado pela Coordenação! (Escala
                                            Atualizada)
                                          </span>
                                        ) : t.status ===
                                          "rejeitado_coordenacao" ? (
                                          <span className="text-red-700 font-medium">
                                            Recusado pela Coordenação.
                                          </span>
                                        ) : (
                                          <span className="text-red-700 font-medium">
                                            Recusado pelo ministro convidado.
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Solicitado em:{" "}
                                      {(() => {
                                        try {
                                          if (!t.dataSolicitacao)
                                            return "Padrão";
                                          const parsedDate = new Date(
                                            t.dataSolicitacao,
                                          );
                                          if (isNaN(parsedDate.getTime()))
                                            return "Padrão";
                                          return parsedDate.toLocaleDateString(
                                            "pt-BR",
                                          );
                                        } catch (err) {
                                          return "Padrão";
                                        }
                                      })()}
                                    </p>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                    {(() => {
                                      const now = new Date();
                                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                                      const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                                      const isSwapInPast = t.missaOrigemData && (t.missaOrigemData < todayStr || (t.missaOrigemData === todayStr && t.missaOrigemHorario && t.missaOrigemHorario < currentTimeStr));

                                      if (isSwapInPast && (t.status === "pendente_destinatario" || t.status === "pendente_coordenacao")) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                            <X className="w-3.5 h-3.5" />
                                            Expirado
                                          </span>
                                        );
                                      }

                                      if (t.status === "pendente_destinatario") {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                            Aguardando Ministro
                                          </span>
                                        );
                                      } else if (t.status === "pendente_coordenacao") {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                            Pendente Coordenação
                                          </span>
                                        );
                                      } else if (t.status === "aprovado") {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            Aprovado
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                            <X className="w-3.5 h-3.5 text-red-600" />
                                            Recusado
                                          </span>
                                        );
                                      }
                                    })()}

                                    {/* Action Buttons inside list item */}
                                    {actionNeeded && (
                                      <div className="flex gap-2 mt-2 w-full justify-end">
                                        {/* Coordinator Actions */}
                                        {coordActionNeeded && (
                                          <>
                                            <button
                                              onClick={() =>
                                                handleResponderCoordenador(
                                                  t.id,
                                                  "rejeitar",
                                                )
                                              }
                                              className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 flex items-center gap-1 active:scale-95"
                                            >
                                              <X className="w-3.5 h-3.5" />{" "}
                                              Recusar
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleResponderCoordenador(
                                                  t.id,
                                                  "aprovar",
                                                )
                                              }
                                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                            >
                                              <Check className="w-3.5 h-3.5" />{" "}
                                              {t.status ===
                                              "pendente_destinatario"
                                                ? "Aprovar / Forçar"
                                                : "Aprovar"}
                                            </button>
                                          </>
                                        )}

                                        {/* Target Minister Actions */}
                                        {destActionNeeded && (
                                          <>
                                            <button
                                              onClick={() =>
                                                handleResponderMinistro(
                                                  t.id,
                                                  "rejeitar",
                                                )
                                              }
                                              className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 flex items-center gap-1 active:scale-95"
                                            >
                                              <X className="w-3.5 h-3.5" />{" "}
                                              Rejeitar
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleResponderMinistro(
                                                  t.id,
                                                  "aceitar",
                                                )
                                              }
                                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                            >
                                              <Check className="w-3.5 h-3.5" />{" "}
                                              Aceitar Troca
                                            </button>
                                          </>
                                        )}

                                        {/* Acknowledge Outcomes Action */}
                                        {ackActionNeeded && (
                                          <button
                                            onClick={() =>
                                              handleConfirmarLeitura(t.id)
                                            }
                                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1 font-mono uppercase tracking-wider text-center"
                                          >
                                            Amém / Entendido
                                          </button>
                                        )}
                                      </div>
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
                                  {formatMessageDateDisplay(msg.data)}
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
                                  {isActualCoord && (
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

                  {isActualCoord ? (
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
          {/* ... existing modal ... */}
        </div>
      )}

      {showTrocasRapidasModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold">Trocas Rápidas (Coordenação)</h3>
                  <p className="text-xs text-amber-100">
                    Selecione dois horários para inverter os ministros imediatamente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrocasRapidasModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slot A */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    CELEBRAÇÃO A
                  </label>
                  {quickSwapSlotA ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl relative group">
                      <p className="text-xs font-bold text-blue-900">
                        {quickSwapSlotA.date.split("-").reverse().join("/")} às {quickSwapSlotA.time}
                      </p>
                      <p className="text-[10px] text-blue-700 mt-1">
                        {quickSwapSlotA.missaNome}
                      </p>
                      <div className="mt-2 pt-2 border-t border-blue-100">
                        <p className="text-[10px] font-bold text-blue-800">
                          Ministros: {quickSwapSlotA.ministerName}
                        </p>
                        {quickSwapSlotA.tipo === "casal" && (
                          <div className="mt-2 flex gap-1">
                            <button
                              onClick={() => setQuickSwapMemberA("both")}
                              className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberA === "both" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"}`}
                            >
                              AMBOS
                            </button>
                            <button
                              onClick={() => setQuickSwapMemberA("c1")}
                              className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberA === "c1" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"}`}
                            >
                              ELE ({quickSwapSlotA.conjuge1?.split(" ")[0]})
                            </button>
                            <button
                              onClick={() => setQuickSwapMemberA("c2")}
                              className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberA === "c2" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"}`}
                            >
                              ELA ({quickSwapSlotA.conjuge2?.split(" ")[0]})
                            </button>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setQuickSwapSlotA(null)}
                        className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400 italic">Selecione o primeiro horário:</p>
                      <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl p-1 bg-slate-50">
                        {futurePublishedSlots.map((slot: any, idx: number) => (
                          <button
                            key={idx}
                            disabled={quickSwapSlotB === slot}
                            onClick={() => {
                              setQuickSwapSlotA(slot);
                              setQuickSwapMemberA("both");
                            }}
                            className="w-full text-left p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm mb-1 disabled:opacity-30"
                          >
                            <p className="text-xs font-bold text-slate-800">
                              {slot.date.split("-").reverse().join("/")} às {slot.time}
                            </p>
                            <p className="text-[10px] text-slate-500">{slot.missaNome}</p>
                            <p className="text-[9px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">
                              {slot.ministerName}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot B */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      CELEBRAÇÃO B / MINISTRO
                    </label>
                    <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => setQuickSwapViewModeB("slots")}
                        className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${quickSwapViewModeB === "slots" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-blue-600"}`}
                      >
                        ESCALADOS
                      </button>
                      <button
                        onClick={() => setQuickSwapViewModeB("ministers")}
                        className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${quickSwapViewModeB === "ministers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-blue-600"}`}
                      >
                        TODOS OS MINISTROS
                      </button>
                    </div>
                  </div>

                  {quickSwapSlotB ? (
                    <div className={`p-4 ${quickSwapSlotB.isMinister ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"} border rounded-2xl relative group`}>
                      {quickSwapSlotB.isMinister ? (
                        <>
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">
                            Ministro Avulso
                          </p>
                          <p className="text-lg font-black text-amber-600 mt-1">
                            {quickSwapSlotB.name}
                          </p>
                            {quickSwapSlotB.isMinister && quickSwapSlotB.tipo === "casal" ? (
                              <div className="mt-4 pt-3 border-t border-amber-200">
                                <p className="text-[10px] font-bold text-amber-800 mb-2">
                                  Qual parte do casal participará?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setQuickSwapMemberB("both")}
                                    className={`flex-1 py-2 text-[9px] font-bold rounded-xl border transition-all ${quickSwapMemberB === "both" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"}`}
                                  >
                                    AMBOS
                                  </button>
                                  <button
                                    onClick={() => setQuickSwapMemberB("c1")}
                                    className={`flex-1 py-2 text-[9px] font-bold rounded-xl border transition-all ${quickSwapMemberB === "c1" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"}`}
                                  >
                                    ELE ({quickSwapSlotB.conjuge1?.split(" ")[0]})
                                  </button>
                                  <button
                                    onClick={() => setQuickSwapMemberB("c2")}
                                    className={`flex-1 py-2 text-[9px] font-bold rounded-xl border transition-all ${quickSwapMemberB === "c2" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"}`}
                                  >
                                    ELA ({quickSwapSlotB.conjuge2?.split(" ")[0]})
                                  </button>
                                </div>
                              </div>
                            ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-emerald-900">
                            {quickSwapSlotB.date.split("-").reverse().join("/")} às {quickSwapSlotB.time}
                          </p>
                          <p className="text-[10px] text-emerald-700 mt-1">
                            {quickSwapSlotB.missaNome}
                          </p>
                          <div className="mt-2 pt-2 border-t border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-800">
                              Ministros: {quickSwapSlotB.ministerName}
                            </p>
                            {quickSwapSlotB.tipo === "casal" && (
                              <div className="mt-2 flex gap-1">
                                <button
                                  onClick={() => setQuickSwapMemberB("both")}
                                  className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberB === "both" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                                >
                                  AMBOS
                                </button>
                                <button
                                  onClick={() => setQuickSwapMemberB("c1")}
                                  className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberB === "c1" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                                >
                                  ELE ({quickSwapSlotB.conjuge1?.split(" ")[0]})
                                </button>
                                <button
                                  onClick={() => setQuickSwapMemberB("c2")}
                                  className={`flex-1 py-1 text-[8px] font-bold rounded border transition-all ${quickSwapMemberB === "c2" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                                >
                                  ELA ({quickSwapSlotB.conjuge2?.split(" ")[0]})
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      <button 
                        onClick={() => setQuickSwapSlotB(null)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quickSwapViewModeB === "slots" ? (
                        <>
                          <p className="text-[11px] text-slate-400 italic">Selecione o segundo horário:</p>
                          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl p-1 bg-slate-50">
                            {futurePublishedSlots.map((slot: any, idx: number) => (
                              <button
                                key={idx}
                                disabled={quickSwapSlotA === slot}
                                onClick={() => {
                                  setQuickSwapSlotB(slot);
                                  setQuickSwapMemberB("both");
                                }}
                                className="w-full text-left p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm mb-1 disabled:opacity-30"
                              >
                                <p className="text-xs font-bold text-slate-800">
                                  {slot.date.split("-").reverse().join("/")} às {slot.time}
                                </p>
                                <p className="text-[10px] text-slate-500">{slot.missaNome}</p>
                                <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">
                                  {slot.ministerName}
                                </p>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar ministro..."
                              value={quickSwapSearchB}
                              onChange={(e) => setQuickSwapSearchB(e.target.value)}
                              className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                          <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-2xl p-1 bg-slate-50">
                            {availableMinisters
                              .filter(m => (m.nomeExibicao || m.nome || "").toLowerCase().includes(quickSwapSearchB.toLowerCase()))
                              .map((m: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setQuickSwapSlotB({ 
                                      isMinister: true, 
                                      name: m.nomeExibicao || m.nome,
                                      id: m.id,
                                      tipo: m.tipo,
                                      conjuge1: m.nomeExibicao || m.nome,
                                      conjuge2: m.nomeExibicaoConjuge || m.nomeConjuge
                                    });
                                    setQuickSwapMemberB("both");
                                  }}
                                  className="w-full text-left p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm mb-1"
                                >
                                  <p className="text-xs font-bold text-slate-800">
                                    {m.nomeExibicao || m.nome}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {m.tipo === "casal" ? "Casal" : "Individual"}
                                  </p>
                                </button>
                              ))}
                            {availableMinisters.length === 0 && (
                              <p className="text-[10px] text-center py-4 text-slate-400 italic">Nenhum ministro encontrado.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {quickSwapSlotA && quickSwapSlotB && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-black text-amber-800 uppercase mb-1">Resultado Final</p>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                      <div className="text-left">
                        <p className="text-[9px] text-slate-400">{quickSwapSlotA.date.split("-").reverse().join("/")} às {quickSwapSlotA.time}</p>
                        <p className="text-xs font-bold text-emerald-600">
                          {quickSwapSlotB.isMinister ? quickSwapSlotB.name : quickSwapSlotB.ministerName}
                        </p>
                      </div>
                      <RefreshCw className={`w-4 h-4 text-amber-500 ${quickSwapSlotB.isMinister ? "animate-pulse" : ""}`} />
                      <div className="text-right">
                        {quickSwapSlotB.isMinister ? (
                          <div className="text-slate-400 text-[10px] italic">
                            (Substituição Direta)
                          </div>
                        ) : (
                          <>
                            <p className="text-[9px] text-slate-400">{quickSwapSlotB.date.split("-").reverse().join("/")} às {quickSwapSlotB.time}</p>
                            <p className="text-xs font-bold text-blue-600">{quickSwapSlotA.ministerName}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTrocasRapidasModal(false)}
                className="flex-1 px-4 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all font-mono"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleQuickSwap}
                disabled={
                  !quickSwapSlotA ||
                  !quickSwapSlotB ||
                  isSubmittingQuickSwap
                }
                className="flex-1 px-4 py-3 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-100 font-mono flex items-center justify-center gap-1"
              >
                {isSubmittingQuickSwap ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    PROCESSANDO...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    EFETUAR TROCA AGORA
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
                    Você não está escalado em nenhuma celebração futura na
                    escala publicada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {myAssignments.map((a: any, idx: number) => {
                      const isSel =
                        trocaMissaOrigem?.date === a.date &&
                        trocaMissaOrigem?.time === a.time;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTrocaMissaOrigem(a);
                            setTrocaMissaDestino(null);
                            setTrocaDestinatario(null);

                            // Auto-detect if it's a couple slot or single slot
                            if (user.tipo === "casal" && a.matchedName) {
                              const normName = a.matchedName.toLowerCase();
                              const isCouple = normName.includes(" e ") || normName.includes(" & ");
                              if (!isCouple) {
                                // Find which spouse matches
                                const husbandExib = (user.nomeExibicao || user.nome).toLowerCase();
                                const wifeExib = (user.nomeExibicaoConjuge || user.nomeConjuge).toLowerCase();
                                const husbandFull = user.nome.toLowerCase();
                                const wifeFull = (user.nomeConjuge || "").toLowerCase();
                                
                                if (normName === husbandExib || husbandFull.includes(normName) || normName.includes(husbandExib)) {
                                  setSolicitanteSubMembro("marido");
                                } else if (normName === wifeExib || wifeFull.includes(normName) || normName.includes(wifeExib)) {
                                  setSolicitanteSubMembro("esposa");
                                } else {
                                  setSolicitanteSubMembro("marido"); // fallback
                                }
                              } else {
                                setSolicitanteSubMembro("ambos");
                              }
                            } else {
                              setSolicitanteSubMembro("ambos");
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center ${isSel ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:bg-slate-50"}`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {a.date.split("-").reverse().join("/")} às{" "}
                              {a.time}
                            </p>
                            <p className="text-xs text-slate-500">
                              {a.descricao || a.nome || "Missa"}
                            </p>
                          </div>
                          {isSel && (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional: Married couple selection details */}
              {trocaMissaOrigem && user.tipo === "casal" && (
                (() => {
                  const isCouple = trocaMissaOrigem.matchedName?.toLowerCase().includes(" e ") || 
                                   trocaMissaOrigem.matchedName?.toLowerCase().includes(" & ");
                  if (!isCouple) {
                    const spouseName = solicitanteSubMembro === "marido" 
                      ? user.nomeExibicao || user.nome 
                      : user.nomeExibicaoConjuge || user.nomeConjuge;
                    return (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        <p className="text-xs text-slate-500 font-bold">
                          ℹ️ Apenas <span className="text-blue-600">{spouseName}</span> está escalado(a) nesta celebração individualmente.
                        </p>
                      </div>
                    );
                  }
                  return (
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
                  );
                })()
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
                        setTrocaTipo("direta");
                        setTrocaDestinatario(null);
                        setTrocaMissaDestino(null);
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all ${trocaTipo === "direta" ? "border-blue-600 bg-blue-50/20 font-bold text-blue-850" : "border-slate-250 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <p className="text-xs font-black">Troca Direta</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">
                        Troco com outra missa escalada
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrocaTipo("substituto");
                        setTrocaDestinatario(null);
                        setTrocaMissaDestino(null);
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all ${trocaTipo === "substituto" ? "border-blue-600 bg-blue-50/20 font-bold text-blue-850" : "border-slate-250 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <p className="text-xs font-black">Substituição</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">
                        Apenas indico um ministro livre
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Selecionar Ministro / Celebração Destino */}
              {trocaMissaOrigem && (
                <div className="space-y-4 pt-2 border-t border-slate-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      3.{" "}
                      {trocaTipo === "direta"
                        ? "Selecione quem quer propor trocar"
                        : "Selecione ministro livre da escala"}
                    </label>
                  </div>

                  {/* Two individuals option for couple replacement */}
                  {user.tipo === "casal" &&
                    solicitanteSubMembro === "ambos" &&
                    trocaTipo === "substituto" && (
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
                        <label
                          htmlFor="swap-two-individuals-checkbox"
                          className="text-xs font-bold text-slate-700 cursor-pointer select-none"
                        >
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
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">
                            Ministro 1
                          </span>
                          <span className="text-xs truncate block">
                            {trocaDestinatario
                              ? trocaDestinatario.nomeExibicao ||
                                trocaDestinatario.nome
                              : "Selecionar..."}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEscolhendoSegundoIndiv(true)}
                          className={`p-3 rounded-xl border text-left transition-all ${escolhendoSegundoIndiv ? "border-blue-600 bg-white shadow-sm font-extrabold text-blue-700" : "border-slate-200 text-slate-500 bg-slate-50 hover:bg-white/50"}`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">
                            Ministro 2
                          </span>
                          <span className="text-xs truncate block">
                            {segundoDestinatario
                              ? segundoDestinatario.nomeExibicao ||
                                segundoDestinatario.nome
                              : "Selecionar..."}
                          </span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center italic">
                        {!escolhendoSegundoIndiv
                          ? "Clique em um ministro abaixo para preencher o slot 1"
                          : "Clique em um ministro abaixo para preencher o slot 2"}
                      </p>
                    </div>
                  )}
                  {trocaDestinatario?.tipo === "casal" &&
                    !substituirPorDoisIndividuais && (
                      <div className="bg-amber-50/20 p-3.5 rounded-2xl border border-amber-200/60 space-y-2">
                        <span className="block text-[10px] font-black text-amber-850 uppercase tracking-wider">
                          ❓ Quem do casal convidado atuará na troca?
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={
                              !!(
                                trocaDestinatario?.afastado ||
                                trocaDestinatario?.afastadoConjuge
                              )
                            }
                            onClick={() => setDestinatarioSubMembro("ambos")}
                            className={`py-1.5 px-0.5 text-[9px] rounded-lg border text-center transition-all font-bold ${
                              trocaDestinatario?.afastado ||
                              trocaDestinatario?.afastadoConjuge
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
                            👨{" "}
                            {trocaDestinatario?.nomeExibicao ||
                              trocaDestinatario?.nome}{" "}
                            {trocaDestinatario?.afastado ? "(Afastado)" : ""}
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
                            👩{" "}
                            {trocaDestinatario?.nomeExibicaoConjuge ||
                              trocaDestinatario?.nomeConjuge}{" "}
                            {trocaDestinatario?.afastadoConjuge
                              ? "(Afastada)"
                              : ""}
                          </button>
                        </div>
                      </div>
                    )}

                  {trocaMissaOrigem && trocaMissaOrigem.lider && (
                    (() => {
                      const isLiderOrigem = isMinisterLiderForUser(trocaMissaOrigem.lider, user, trocaMissaOrigem.ministros);
                      if (!isLiderOrigem) return null;
                      return (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 text-xs space-y-1">
                          <span className="font-extrabold flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-800">
                            ⚠️ Você é o responsável por esta celebração
                          </span>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            Como você é o responsável por esta missa, por favor, prefira trocar com outro ministro habilitado como responsável (identificados com a etiqueta <strong className="inline-flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Responsável</strong> na lista) para manter a celebração bem assistida.
                          </p>
                        </div>
                      );
                    })()
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
                  {trocaTipo === "direta" ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        const filtered = futurePublishedSlots.filter(
                          (slot: any) => {
                            const normalSearch = trocaBuscaTerm.toLowerCase();
                            return (
                              slot.ministerName
                                .toLowerCase()
                                .includes(normalSearch) ||
                              slot.missaNome
                                .toLowerCase()
                                .includes(normalSearch) ||
                              slot.date.includes(normalSearch)
                            );
                          },
                        );

                        if (filtered.length === 0) {
                          return (
                            <p className="text-[11px] text-slate-400 text-center py-4">
                              Nenhuma outra escala de outro ministro disponível
                              para troca direta.
                            </p>
                          );
                        }

                        return filtered.map((slot: any, sIdx: number) => {
                          const isSelSlot =
                            trocaMissaDestino?.date === slot.date &&
                            trocaMissaDestino?.time === slot.time &&
                            (trocaDestinatario?.nome === slot.ministerName ||
                              trocaDestinatario?.name === slot.ministerName);
                          const slotDateStr = slot.date
                            .split("-")
                            .reverse()
                            .join("/");

                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                setTrocaMissaDestino({
                                  date: slot.date,
                                  time: slot.time,
                                  descricao: slot.missaNome,
                                });
                                setTrocaDestinatario({
                                  id: slot.ministerId,
                                  nome: slot.ministerName,
                                  telefone: slot.ministerTelefone,
                                });
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${isSelSlot ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-850">
                                  {slot.ministerName}
                                </span>
                                {isSelSlot && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
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
                        const normalizedCurrentParish = currentParish
                          .trim()
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "");

                        const filtered = allMinisters.filter((m: any) => {
                          // Match parish
                          const mParoquia = m.paroquia || "";
                          const normalizedMParoquia = mParoquia
                            .trim()
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "");
                          if (normalizedMParoquia !== normalizedCurrentParish)
                            return false;

                          // Exclude oneself
                          if (m.id === user.id) return false;

                          // Filter out away (inactive) ministers so they do not appear
                          const isFullyAway =
                            m.tipo === "casal"
                              ? !!m.afastado || !!m.afastadoConjuge
                              : !!m.afastado;
                          if (isFullyAway) {
                            console.log("DEBUG_MINISTER", m);
                            return false;
                          }

                          // Search term
                          const searchNormal = trocaBuscaTerm.toLowerCase();
                          return (
                            m.nome.toLowerCase().includes(searchNormal) ||
                            (m.nomeExibicao || "")
                              .toLowerCase()
                              .includes(searchNormal) ||
                            (m.nomeConjuge || "")
                              .toLowerCase()
                              .includes(searchNormal) ||
                            (m.nomeExibicaoConjuge || "")
                              .toLowerCase()
                              .includes(searchNormal)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <p className="text-[11px] text-slate-400 text-center py-4">
                              Nenhum ministro cadastrado nesta paróquia.
                            </p>
                          );
                        }

                        return filtered.map((m: any) => {
                          // CHECK INCOMPATIBILITY CONSTRAINT AND DEVIATIONS
                          const isFullyAway =
                            m.tipo === "casal"
                              ? !!m.afastado || !!m.afastadoConjuge
                              : !!m.afastado;
                          const isConflict = isMinisterScheduledOnDayOrWeek(
                            m,
                            trocaMissaOrigem.date,
                          );
                          const isSel = substituirPorDoisIndividuais
                            ? areMinistersOverlapping(trocaDestinatario, m) ||
                              areMinistersOverlapping(segundoDestinatario, m)
                            : areMinistersOverlapping(trocaDestinatario, m);
                          const isAlreadySelectedInOtherSlot =
                            substituirPorDoisIndividuais &&
                            ((!escolhendoSegundoIndiv &&
                              areMinistersOverlapping(segundoDestinatario, m)) ||
                              (escolhendoSegundoIndiv &&
                                areMinistersOverlapping(trocaDestinatario, m)));
                          const isDisabled =
                            isConflict ||
                            isAlreadySelectedInOtherSlot ||
                            isFullyAway;

                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (substituirPorDoisIndividuais) {
                                  if (!escolhendoSegundoIndiv) {
                                    setTrocaDestinatario(m);
                                    if (areMinistersOverlapping(m, segundoDestinatario)) {
                                      setSegundoDestinatario(null);
                                    }
                                    if (m.tipo === "casal") {
                                      if (m.afastado && !m.afastadoConjuge)
                                        setDestinatarioSubMembro("esposa");
                                      else if (!m.afastado && m.afastadoConjuge)
                                        setDestinatarioSubMembro("marido");
                                      else setDestinatarioSubMembro("ambos");
                                    } else {
                                      setDestinatarioSubMembro("ambos");
                                    }
                                    setEscolhendoSegundoIndiv(true);
                                  } else {
                                    if (!areMinistersOverlapping(m, trocaDestinatario)) {
                                      setSegundoDestinatario(m);
                                    }
                                  }
                                } else {
                                  setTrocaDestinatario(m);
                                  if (m.tipo === "casal") {
                                    if (m.afastado && !m.afastadoConjuge)
                                      setDestinatarioSubMembro("esposa");
                                    else if (!m.afastado && m.afastadoConjuge)
                                      setDestinatarioSubMembro("marido");
                                    else setDestinatarioSubMembro("ambos");
                                  } else {
                                    setDestinatarioSubMembro("ambos");
                                  }
                                  setTrocaMissaDestino(null);
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${isDisabled ? "bg-slate-100 opacity-60 cursor-not-allowed border-slate-200" : isSel ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"}`}
                            >
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  <span>
                                    {m.tipo === "casal"
                                      ? `${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`
                                      : m.nomeExibicao || m.nome}
                                  </span>
                                  {m.tipo === "casal" &&
                                    (m.afastado || m.afastadoConjuge) && (
                                      <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                                        Partical. Afastado
                                      </span>
                                    )}
                                  {(m.isLider || m.isLiderConjuge) && (
                                    <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase inline-flex items-center gap-0.5 select-none shrink-0 font-sans">
                                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Responsável
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {m.tipo === "casal"
                                    ? "Casal"
                                    : m.funcao || "Ministro"}
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
                disabled={
                  !trocaMissaOrigem ||
                  !trocaDestinatario ||
                  (trocaTipo === "direta" && !trocaMissaDestino) ||
                  isSubmittingTroca
                }
                className="flex-1 px-4 py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 font-mono flex items-center justify-center gap-1"
              >
                {isSubmittingTroca ? "ENVIANDO..." : "SOLICITAR TROCA"}
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

  // States para Agenda do Administrador
  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [agendaTitulo, setAgendaTitulo] = useState("");
  const [agendaData, setAgendaData] = useState("");
  const [agendaHorario, setAgendaHorario] = useState("");
  const [agendaTipo, setAgendaTipo] = useState("reuniao_paroquia");
  const [agendaParoquia, setAgendaParoquia] = useState("todas");
  const [agendaDescricao, setAgendaDescricao] = useState("");
  const [submittingAgenda, setSubmittingAgenda] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/eventos");
      if (res.ok) {
        const data = await res.json();
        setCustomEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar eventos em AdminView:", err);
    }
  };

  const handleCreateAgendaEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitulo.trim() || !agendaData) {
      onAlert("Erro", "Título e Data são obrigatórios.");
      return;
    }
    try {
      setSubmittingAgenda(true);
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: agendaTitulo.trim(),
          data: agendaData,
          horario: agendaHorario || undefined,
          tipo: agendaTipo,
          descricao: agendaDescricao.trim() || undefined,
          paroquia: agendaParoquia,
          criadoPor: "Administrador do Sistema",
          criadoPorAdmin: true,
          destinatario: "todos",
        }),
      });
      if (res.ok) {
        onAlert("Sucesso", "Compromisso agendado com sucesso na Agenda Geral!");
        setAgendaTitulo("");
        setAgendaData("");
        setAgendaHorario("");
        setAgendaTipo("reuniao_paroquia");
        setAgendaParoquia("todas");
        setAgendaDescricao("");
        await fetchEvents();
      } else {
        const errData = await res.json();
        onAlert("Erro", errData.error || "Não foi possível agendar o compromisso.");
      }
    } catch (err) {
      console.error("Erro ao criar compromisso de agenda:", err);
      onAlert("Erro", "Erro ao conectar com o servidor.");
    } finally {
      setSubmittingAgenda(false);
    }
  };

  const handleDeleteAgendaEvent = async (eventId: string) => {
    if (!window.confirm("Deseja realmente remover este compromisso da Agenda?")) return;
    try {
      const res = await fetch(`/api/eventos/${eventId}?isAdmin=true`, { method: "DELETE" });
      if (res.ok) {
        onAlert("Sucesso", "Compromisso removido com sucesso.");
        await fetchEvents();
      } else {
        const errData = await res.json();
        onAlert("Erro", errData.error || "Não foi possível remover o compromisso.");
      }
    } catch (err) {
      console.error("Erro ao deletar compromisso de agenda:", err);
      onAlert("Erro", "Erro ao conectar com o servidor.");
    }
  };

  const [coordinatorEnabled, setCoordinatorEnabled] = useState(false);
  const [modoManutencao, setModoManutencao] = useState(false);
  const [lembreteAutomatico, setLembreteAutomatico] = useState(false);
  const [enviandoLembretes, setEnviandoLembretes] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [ministros, setMinistros] = useState([]);
  const [paroquias, setParoquias] = useState([]);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showPassForm, setShowPassForm] = useState(false);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
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
    return Array.from(
      new Set(paroquias.map((p: any) => p.estado).filter(Boolean)),
    ).sort();
  }, [paroquias]);

  const uniqueCoordinatorCities = useMemo(() => {
    if (!Array.isArray(paroquias)) return [];
    return Array.from(
      new Set(
        paroquias
          .filter(
            (p: any) => !coordFilterEstado || p.estado === coordFilterEstado,
          )
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
      const now = Date.now();
      const paroquiaQuery = user.paroquia
        ? `?paroquia=${encodeURIComponent(user.paroquia)}`
        : "";
      const tParam = paroquiaQuery ? `&t=${now}` : `?t=${now}`;
      const responses = await Promise.all([
        fetch(`/api/config${paroquiaQuery}${tParam}`),
        fetch(`/api/admin/pending${paroquiaQuery}${tParam}`),
        fetch(`/api/admin/coordinators${paroquiaQuery}${tParam}`),
        fetch(`/api/admin/ministros${paroquiaQuery}${tParam}`),
        fetch(`/api/paroquias?t=${now}`),
        fetch(`/api/eventos?t=${now}`),
      ]);

      const [
        configRes,
        pendingRes,
        coordinatorsRes,
        ministrosRes,
        paroquiasRes,
        eventosRes,
      ] = responses;

      const safeJson = async (res, defaultVal) => {
        if (!res.ok) return defaultVal;
        try {
          const text = await res.text();
          return JSON.parse(text);
        } catch (e) {
          console.error("Erro ao processar JSON:", e);
          return defaultVal;
        }
      };

      const configData = await safeJson(configRes, {
        coordinatorEnabled: false,
      });
      const pendingData = await safeJson(pendingRes, []);
      const coordinatorsData = await safeJson(coordinatorsRes, []);
      const ministrosData = await safeJson(ministrosRes, []);
      const paroquiasData = await safeJson(paroquiasRes, []);
      const eventosData = await safeJson(eventosRes, []);

      setCoordinatorEnabled(configData.coordinatorEnabled);
      setModoManutencao(configData.modoManutencao || false);
      setLembreteAutomatico(configData.lembreteAutomatico || false);
      setPendingUsers(Array.isArray(pendingData) ? pendingData : []);
      setCoordinators(Array.isArray(coordinatorsData) ? coordinatorsData : []);
      setMinistros(Array.isArray(ministrosData) ? ministrosData : []);
      setParoquias(Array.isArray(paroquiasData) ? paroquiasData : []);
      setCustomEvents(Array.isArray(eventosData) ? eventosData : []);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[DEBUG AdminView] fetchData triggered");
    fetchData();
  }, []);

  useEffect(() => {
    console.log("[DEBUG AdminView] Paroquias state updated:", paroquias);
  }, [paroquias]);

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

    if (
      coordinatorFormData.senha &&
      !isComplexPassword(coordinatorFormData.senha)
    ) {
      onAlert(
        "A senha do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.",
      );
      return;
    }

    if (
      coordinatorFormData.tipo === "casal" &&
      coordinatorFormData.senhaConjuge &&
      !isComplexPassword(coordinatorFormData.senhaConjuge)
    ) {
      onAlert(
        "A senha do cônjuge do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.",
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/coordinators/${editingCoordinator.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coordinatorFormData),
        },
      );

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

  const handleToggleManutencao = async () => {
    const newState = !modoManutencao;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modoManutencao: newState }),
      });
      if (response.ok) {
        setModoManutencao(newState);
        setMessage(
          `Modo de Manutenção se encontra ${newState ? "ATIVADO" : "DESATIVADO"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err) {
      console.error("Erro ao atualizar modo de manutenção:", err);
    }
  };

  const handleToggleLembreteAutomatico = async () => {
    const newState = !lembreteAutomatico;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paroquia: user.paroquia,
          lembreteAutomatico: newState,
        }),
      });
      if (response.ok) {
        setLembreteAutomatico(newState);
        setMessage(
          `Lembrete Automático ${newState ? "ATIVADO" : "DESATIVADO"} com sucesso.`,
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Erro ao atualizar lembrete automático:", err);
    }
  };

  const handleEnviarLembretesManual = async () => {
    setEnviandoLembretes(true);
    try {
      const response = await fetch(
        "/api/escala/enviar-lembretes-fim-de-semana",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paroquia: user.paroquia }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        onAlert(
          "Lembretes de Fim de Semana",
          `O envio de lembretes foi concluído! ${data.sentCount} novos lembretes foram enviados aos ministros escalados neste final de semana.`,
        );
      } else {
        onAlert(
          "Erro",
          "Não foi possível disparar os lembretes neste momento.",
        );
      }
    } catch (err) {
      console.error("Erro ao enviar lembretes:", err);
      onAlert("Erro", "Erro ao conectar com o servidor.");
    } finally {
      setEnviandoLembretes(false);
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
          (role === "coordenacao" || role === "coordenador" || role === "vice_coordenacao" || role?.toLowerCase().includes("coordena")) &&
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

  const AdminIgrejasReadOnlyView = ({
    coordinators,
    ministros,
  }: {
    coordinators: any[];
    ministros: any[];
  }) => {
    const [paroquias, setParoquias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCidade, setFilterCidade] = useState("");
    const [filterEstado, setFilterEstado] = useState("");

    // Modal states for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedParoquia, setSelectedParoquia] = useState<any | null>(null);
    const [formData, setFormData] = useState({
      nome: "",
      coordenador: "",
      telefoneCoordenador: "",
      cidade: "",
      estado: "",
      status: "ativo" as "ativo" | "testes" | "bloqueado",
      cnpj: "",
      padre: "",
      email: "",
      telefone1: "",
      endereco: "",
      bairro: "",
      numero: "",
      cep: "",
      site: "",
    });

    // Modal state for viewing ministers of a parish
    const [selectedParoquiaForMinisters, setSelectedParoquiaForMinisters] = useState<any | null>(null);

    const fetchLocalParoquias = () => {
      setLoading(true);
      fetch("/api/paroquias")
        .then((res) => {
          if (!res.ok) throw new Error("Erro na rede");
          return res.json();
        })
        .then((data) => {
          setParoquias(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          const isNet = err instanceof Error && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("network") || err.message.includes("Failed to fetch") || err.message.includes("rede") || err.message.includes("HTTP"));
          if (isNet) {
            console.warn("Aviso de conexão ao buscar paróquias (local):", err instanceof Error ? err.message : err);
          } else {
            console.error("Erro ao buscar paróquias:", err);
            setError("Erro ao carregar lista de paróquias.");
          }
          setLoading(false);
        });
    };

    useEffect(() => {
      fetchLocalParoquias();
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

    const handleAddClick = () => {
      setSelectedParoquia(null);
      setModalMode("create");
      setFormData({
        nome: "",
        coordenador: "",
        telefoneCoordenador: "",
        cidade: "",
        estado: "",
        status: "ativo",
        cnpj: "",
        padre: "",
        email: "",
        telefone1: "",
        endereco: "",
        bairro: "",
        numero: "",
        cep: "",
        site: "",
      });
      setError("");
      setIsModalOpen(true);
    };

    const handleEditClick = (p: any) => {
      setSelectedParoquia(p);
      setModalMode("edit");
      setFormData({
        nome: p.nome || "",
        coordenador: p.coordenador || "",
        telefoneCoordenador: p.telefoneCoordenador || "",
        cidade: p.cidade || "",
        estado: p.estado || "",
        status: p.status || "ativo",
        cnpj: p.cnpj || "",
        padre: p.padre || "",
        email: p.email || "",
        telefone1: p.telefone1 || "",
        endereco: p.endereco || "",
        bairro: p.bairro || "",
        numero: p.numero || "",
        cep: p.cep || "",
        site: p.site || "",
      });
      setError("");
      setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.nome.trim()) {
        setError("O nome da paróquia é obrigatório.");
        return;
      }

      try {
        const url =
          modalMode === "edit"
            ? `/api/paroquias/${selectedParoquia.id}`
            : "/api/paroquias";
        const method = modalMode === "edit" ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Erro ao salvar paróquia");

        setSuccessMessage(
          modalMode === "edit"
            ? "Paróquia atualizada com sucesso!"
            : "Paróquia cadastrada com sucesso!",
        );
        setIsModalOpen(false);
        fetchLocalParoquias();
        if (typeof fetchData === "function") {
          fetchData(true);
        }
        setTimeout(() => setSuccessMessage(""), 4000);
      } catch (err: any) {
        console.error("Erro ao salvar paróquia:", err);
        setError("Erro ao salvar os dados da paróquia.");
      }
    };

    const handleDeleteClick = (id: string, name: string) => {
      onCustomConfirm(
        `Deseja realmente excluir a paróquia "${name}"? Esta ação não pode ser desfeita e pode afetar os usuários vinculados.`,
        async () => {
          try {
            const response = await fetch(`/api/paroquias/${id}`, {
              method: "DELETE",
            });
            if (!response.ok) throw new Error("Erro ao excluir paróquia");

            setSuccessMessage("Paróquia excluída com sucesso.");
            fetchLocalParoquias();
            if (typeof fetchData === "function") {
              fetchData(true);
            }
            setTimeout(() => setSuccessMessage(""), 4000);
          } catch (err) {
            console.error("Erro ao excluir paróquia:", err);
            setError("Erro ao excluir a paróquia.");
          }
        },
      );
    };

    // Find ministers for modal display
    const ministersOfSelectedParoquia = useMemo(() => {
      if (!selectedParoquiaForMinisters) return [];
      return ministros.filter(
        (m) =>
          m.paroquia?.toLowerCase().trim() ===
          selectedParoquiaForMinisters.nome?.toLowerCase().trim()
      );
    }, [selectedParoquiaForMinisters, ministros]);

    return (
      <div className="space-y-6">
        {successMessage && (
          <div
            id="success-banner"
            className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div
            id="error-banner"
            className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header Row of Parish Management */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Church className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Gerenciamento de Paróquias
            </h1>
          </div>
          <button
            id="btn-adicionar-paroquia"
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl transition-all shadow-sm border border-slate-200"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Nova Paróquia</span>
          </button>
        </div>

        {/* Filter Area in Single Box layout */}
        <div
          id="filter-paroquias-container"
          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-sm text-slate-700"
        >
          <div className="flex items-center gap-2 font-bold text-slate-600 shrink-0">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Filtrar por Localidade:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <select
              id="select-pesquisa-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[150px]"
            >
              <option value="">Todos os Estados</option>
              {uniqueEstados.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <select
              id="select-pesquisa-cidade"
              value={filterCidade}
              onChange={(e) => setFilterCidade(e.target.value)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[180px]"
            >
              <option value="">Todas as Cidades</option>
              {uniqueCidades.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {(filterCidade || filterEstado || searchTerm) && (
              <button
                id="btn-limpar-filtros"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCidade("");
                  setFilterEstado("");
                }}
                className="text-xs font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-wider"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="input-pesquisa-nome"
              type="text"
              placeholder="Pesquisar por nome ou sacerdote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* List/Grid of Parishes */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 text-sm mt-3 font-medium">
              Carregando paróquias...
            </p>
          </div>
        ) : filteredParoquias.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-medium">
              Nenhuma paróquia encontrada para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div
            id="grid-paroquias-cadastradas"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredParoquias.map((p) => {
              return (
                <div
                  key={p.id}
                  id={`card-paroquia-${p.id}`}
                  className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-4">
                    {/* Header line inside Card */}
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-blue-50/80 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
                        <Church className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.nome}
                        </h3>
                        {p.cnpj && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            CNPJ: {p.cnpj}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Core details with specific Lucide icons */}
                    <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed text-xs">
                          <span className="font-bold text-slate-400">Sacerdote:</span>{" "}
                          <span className="text-slate-700 font-semibold">{p.padre || "Não cadastrado"}</span>
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed text-xs">
                          <span className="font-bold text-slate-400">Coordenador:</span>{" "}
                          <span className="text-slate-700 font-semibold">
                            {p.coordenador || "Não cadastrado"}
                            {p.telefoneCoordenador ? ` (${p.telefoneCoordenador})` : ""}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed text-xs">
                          <span className="font-bold text-slate-400">Endereço:</span>{" "}
                          <span className="text-slate-700 font-semibold">
                            {[
                              p.endereco,
                              p.numero,
                              p.bairro,
                              p.cidade,
                              p.estado ? p.estado.toUpperCase() : "",
                              p.cep,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Não cadastrado"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Secondary Detail contacts below the main details */}
                    <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      {p.email && (
                        <p>
                          <span className="font-bold text-slate-400">E-mail:</span>{" "}
                          <span className="text-slate-600 font-medium">{p.email}</span>
                        </p>
                      )}
                      {p.site && (
                        <p>
                          <span className="font-bold text-slate-400">Site:</span>{" "}
                          <a
                            href={p.site.startsWith("http") ? p.site : `https://${p.site}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {p.site}
                          </a>
                        </p>
                      )}
                      {p.telefone1 && (
                        <p>
                          <span className="font-bold text-slate-400">Contato:</span>{" "}
                          <span className="text-slate-600 font-medium">{p.telefone1}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions footer block */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      id={`btn-ver-ministros-${p.id}`}
                      onClick={() => setSelectedParoquiaForMinisters(p)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Ver Ministros</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-editar-${p.id}`}
                        onClick={() => handleEditClick(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                        title="Editar Paróquia"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-excluir-${p.id}`}
                        onClick={() => handleDeleteClick(p.id, p.nome)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                        title="Excluir Paróquia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal form for Add/Edit Parish */}
        {isModalOpen && (
          <div
            id="modal-paroquia-overlay"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in"
          >
            <div
              id="modal-paroquia-container"
              className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <Church className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {modalMode === "edit" ? "Editar Paróquia" : "Cadastrar Paróquia"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {modalMode === "edit"
                        ? "Preencha os campos abaixo para atualizar as informações."
                        : "Adicione uma nova paróquia ao sistema de administração."}
                    </p>
                  </div>
                </div>
                <button
                  id="btn-fechar-modal"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form
                id="form-cadastro-paroquia"
                onSubmit={handleFormSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {/* Basic details */}
                <div className="space-y-1">
                  <label
                    htmlFor="modal-input-nome"
                    className="text-xs font-bold text-slate-700"
                  >
                    Nome da Paróquia *
                  </label>
                  <input
                    id="modal-input-nome"
                    type="text"
                    required
                    placeholder="Ex: Paróquia São José"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Coordinator details */}
                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Responsável / Coordenador
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="modal-input-coordenador"
                        className="text-xs font-bold text-slate-600"
                      >
                        Nome do Coordenador (ou Casal)
                      </label>
                      <input
                        id="modal-input-coordenador"
                        type="text"
                        placeholder="Ex: João e Maria"
                        value={formData.coordenador}
                        onChange={(e) =>
                          setFormData({ ...formData, coordenador: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="modal-input-telefone-coordenador"
                        className="text-xs font-bold text-slate-600"
                      >
                        Telefone do Coordenador
                      </label>
                      <input
                        id="modal-input-telefone-coordenador"
                        type="text"
                        placeholder="Ex: (14) 99786-5806"
                        value={formData.telefoneCoordenador}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telefoneCoordenador: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Localization and Address */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label
                      htmlFor="modal-input-cidade"
                      className="text-xs font-bold text-slate-700"
                    >
                      Cidade
                    </label>
                    <input
                      id="modal-input-cidade"
                      type="text"
                      placeholder="Ex: Bauru"
                      value={formData.cidade}
                      onChange={(e) =>
                        setFormData({ ...formData, cidade: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label
                      htmlFor="modal-input-estado"
                      className="text-xs font-bold text-slate-700"
                    >
                      Estado (UF)
                    </label>
                    <input
                      id="modal-input-estado"
                      type="text"
                      maxLength={2}
                      placeholder="Ex: SP"
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estado: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label
                      htmlFor="modal-input-cep"
                      className="text-xs font-bold text-slate-700"
                    >
                      CEP
                    </label>
                    <input
                      id="modal-input-cep"
                      type="text"
                      placeholder="Ex: 17000-000"
                      value={formData.cep}
                      onChange={(e) =>
                        setFormData({ ...formData, cep: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label
                      htmlFor="modal-input-endereco"
                      className="text-xs font-bold text-slate-700"
                    >
                      Endereço
                    </label>
                    <input
                      id="modal-input-endereco"
                      type="text"
                      placeholder="Rua, Avenida..."
                      value={formData.endereco}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="modal-input-numero"
                      className="text-xs font-bold text-slate-700"
                    >
                      Número
                    </label>
                    <input
                      id="modal-input-numero"
                      type="text"
                      placeholder="Nº"
                      value={formData.numero}
                      onChange={(e) =>
                        setFormData({ ...formData, numero: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Other fields including the new 'site' field */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="modal-input-padre"
                      className="text-xs font-bold text-slate-700"
                    >
                      Padre / Pároco
                    </label>
                    <input
                      id="modal-input-padre"
                      type="text"
                      placeholder="Ex: Pe. Francisco"
                      value={formData.padre}
                      onChange={(e) =>
                        setFormData({ ...formData, padre: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="modal-input-cnpj"
                      className="text-xs font-bold text-slate-700"
                    >
                      CNPJ da Paróquia
                    </label>
                    <input
                      id="modal-input-cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) =>
                        setFormData({ ...formData, cnpj: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="modal-input-email"
                      className="text-xs font-bold text-slate-700"
                    >
                      E-mail de Contato
                    </label>
                    <input
                      id="modal-input-email"
                      type="email"
                      placeholder="Ex: paroquia@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="modal-input-site"
                      className="text-xs font-bold text-slate-700"
                    >
                      Site da Paróquia
                    </label>
                    <input
                      id="modal-input-site"
                      type="text"
                      placeholder="Ex: www.paroquia.com.br"
                      value={formData.site}
                      onChange={(e) =>
                        setFormData({ ...formData, site: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label
                      htmlFor="modal-input-telefone1"
                      className="text-xs font-bold text-slate-700"
                    >
                      Telefone da Secretaria / Contato
                    </label>
                    <input
                      id="modal-input-telefone1"
                      type="text"
                      placeholder="Ex: (14) 3222-1111"
                      value={formData.telefone1}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone1: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 mt-6">
                  <button
                    id="btn-cancelar-modal"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-salvar-modal"
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{modalMode === "edit" ? "Salvar Alterações" : "Cadastrar"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ministers List Modal */}
        {selectedParoquiaForMinisters && (
          <div
            id="modal-ministers-overlay"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in"
          >
            <div
              id="modal-ministers-container"
              className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Ministros e Coordenadores Cadastrados
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {selectedParoquiaForMinisters.nome}
                    </p>
                  </div>
                </div>
                <button
                  id="btn-fechar-ministers-modal"
                  onClick={() => setSelectedParoquiaForMinisters(null)}
                  className="p-1.5 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Table of members */}
              <div className="flex-1 overflow-y-auto p-6">
                {ministersOfSelectedParoquia.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm font-medium">
                      Nenhum ministro ou coordenador desta paróquia está cadastrado no sistema ainda.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                          <th className="px-4 py-3">Nome / Casal</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Contato</th>
                          <th className="px-4 py-3">Função</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ministersOfSelectedParoquia.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-800">
                                {m.nome}
                                {m.tipo === "casal" && m.nomeConjuge ? ` e ${m.nomeConjuge}` : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs capitalize font-medium text-slate-600">
                                {m.tipo === "casal" ? "Casal" : "Individual"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                              {m.telefone}
                            </td>
                            <td className="px-4 py-3.5">
                              {m.role === "admin" ? (
                                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold rounded-full">
                                  Administrador
                                </span>
                              ) : m.role === "coordenacao" ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                                  Coordenador
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-full">
                                  Ministro
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  id="btn-fechar-ministers-footer"
                  onClick={() => setSelectedParoquiaForMinisters(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminContent = () => {
    const renderBackButtonHeader = (title: string) => (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveAdminTab("dashboard")}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all active:scale-95 border border-slate-200/50 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
          Voltar ao Dashboard
        </button>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
    );

    if (activeAdminTab === "dashboard") {
      return (
        <div className="lg:col-span-12 space-y-6">
          {/* Welcome Dashboard Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Greeting / Date */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/95 shadow-2xs flex flex-col justify-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                <span>Olá, Admin</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {/* Pendentes Stat */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/95 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Cadastros Pendentes
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-2xl font-black ${pendingUsers.length > 0 ? "text-red-600" : "text-slate-800"}`}>
                  {pendingUsers.reduce((acc, u) => acc + (u.tipo === "casal" ? 2 : 1), 0)}
                </span>
                {pendingUsers.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[9px] font-black rounded-full uppercase tracking-wider">
                    Pendente
                  </span>
                )}
              </div>
            </div>

            {/* Equipe Stat */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/95 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total da Equipe
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-800">
                  {ministros.reduce((acc, m) => acc + (m.tipo === "casal" ? 2 : 1), 0) + coordinators.reduce((acc, c) => acc + (c.tipo === "casal" ? 2 : 1), 0)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  membros ativos
                </span>
              </div>
            </div>
          </div>

          {/* Quick Welcome Message */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <h2 className="text-xl font-bold text-slate-900">Bem-vindo ao Painel de Administração</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Aqui você tem uma visão unificada e controle total sobre o sistema. Selecione as abas acima para gerenciar Igrejas/Paróquias, Testes de Sistema, Coroinhas (Fidelis), Configurações ou a Coordenação Ativa do sistema.
            </p>
          </div>
        </div>
      );
    }
    if (activeAdminTab === "testes") {
      return (
        <div className="lg:col-span-12">
          {renderBackButtonHeader("Testes de Sistema")}
          <AdminParoquiasView
            user={user}
            onCustomConfirm={onCustomConfirm}
          />
        </div>
      );
    }
    if (activeAdminTab === "fidelis") {
      return (
        <div className="lg:col-span-12">
          {renderBackButtonHeader("Fidelis / Coroinhas")}
          <AdminFidelisView
            user={user}
            onCustomConfirm={onCustomConfirm}
          />
        </div>
      );
    }
    if (activeAdminTab === "igrejas") {
      return (
        <div className="lg:col-span-12">
          {renderBackButtonHeader("Igrejas / Paróquias")}
          <AdminIgrejasReadOnlyView
            coordinators={coordinators}
            ministros={ministros}
          />
        </div>
      );
    }
    if (activeAdminTab === "configuracoes") {
      return (
        <div className="lg:col-span-12 space-y-6">
          {renderBackButtonHeader("Configurações do Sistema")}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-liturgy-600" />
                Configurações Gerais do Sistema
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Gerencie acessos, segurança, modos de operação, lembretes e backups de dados em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Acesso Coordenador */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <p className="text-base font-bold text-slate-900">
                    Acesso Coordenador
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Liberar login externo para coordenadores
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${coordinatorEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coordinatorEnabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {/* Modo de Manutenção */}
              <div className={`p-5 rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-4 ${modoManutencao ? "bg-red-50/90 border-red-200 ring-2 ring-red-500/20" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${modoManutencao ? "bg-red-600 text-white shadow-md shadow-red-500/30" : "bg-slate-200 text-slate-600"}`}>
                    {modoManutencao ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-black tracking-tight ${modoManutencao ? "text-red-950" : "text-slate-900"}`}>
                        Modo de Manutenção
                      </p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${modoManutencao ? "bg-red-200 text-red-900 animate-pulse" : "bg-slate-200 text-slate-700"}`}>
                        {modoManutencao ? "Ativo (Bloqueado)" : "Inativo (Normal)"}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 font-medium leading-relaxed ${modoManutencao ? "text-red-800" : "text-slate-500"}`}>
                      Bloquear temporariamente o acesso de todos os ministros e coordenadores por segurança.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleManutencao}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${modoManutencao ? "bg-red-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${modoManutencao ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Lembretes & Notificações */}
              {user.role !== "admin" && (
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Lembretes & Notificações
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Lembrete Automático
                      </p>
                      <p className="text-xs text-slate-500">
                        Enviar avisos 24h e 3h antes de cada missa da escala
                      </p>
                    </div>
                    <button
                      onClick={handleToggleLembreteAutomatico}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${lembreteAutomatico ? "bg-indigo-600" : "bg-slate-300"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${lembreteAutomatico ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-indigo-100">
                    <button
                      onClick={handleEnviarLembretesManual}
                      disabled={enviandoLembretes}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Bell className="w-4 h-4 animate-bounce" />
                      {enviandoLembretes
                        ? "DISPARANDO..."
                        : "DISPARAR LEMBRETES DE FDS"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-normal italic text-center">
                      Dispara mensagens de lembrete agora aos escalados na Sexta, Sábado e Domingo.
                    </p>
                  </div>
                </div>
              )}

              {/* Segurança / Alterar Senha */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-liturgy-600" />
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      Segurança e Senha
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPassForm(!showPassForm)}
                    className="text-xs font-bold text-liturgy-600 hover:underline px-3 py-1 bg-liturgy-50 rounded-lg"
                  >
                    {showPassForm ? "Cancelar" : "Alterar Senha"}
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Atualize sua senha de acesso ao painel de administração de forma segura.
                </p>

                {showPassForm && (
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-3 pt-3 border-t border-slate-200"
                  >
                    <div className="relative">
                      <input
                        type={showNewAdminPassword ? "text" : "password"}
                        maxLength={15}
                        placeholder="Nova senha (8-15 caracteres)"
                        value={newAdminPassword}
                        onChange={(e) =>
                          setNewAdminPassword(e.target.value)
                        }
                        className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-liturgy-500/20 font-mono"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewAdminPassword(!showNewAdminPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewAdminPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-liturgy-600 text-slate-900 py-2.5 rounded-xl text-xs font-bold hover:bg-liturgy-700 transition-colors shadow-sm"
                    >
                      Salvar Nova Senha
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Backup do Sistema */}
            <div className="p-6 bg-slate-50 border-2 border-liturgy-100 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-liturgy-100 rounded-xl text-liturgy-700">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Backup e Restauração do Sistema
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Use estas funções para exportar ou restaurar todos os dados do banco de dados em formato JSON.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={onDownloadBackup}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    BAIXAR JSON
                  </button>

                  <label className="flex items-center gap-2 px-5 py-3 bg-liturgy-600 text-slate-900 rounded-xl text-xs font-black hover:bg-liturgy-700 transition-all cursor-pointer shadow-md active:scale-95 text-center">
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
          </div>
        </div>
      );
    }
    if (activeAdminTab === "coordenacao-ativa") {
      const formatBlockDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
      };

      const filteredParoquias = paroquias.filter((p: any) => {
        const est = p.estado || "";
        const cid = p.cidade || "";
        if (coordFilterEstado && est !== coordFilterEstado) return false;
        if (coordFilterCidade && cid !== coordFilterCidade) return false;
        return true;
      });

      // Find coordinators not associated with any parish in paroquias list
      const unassociatedCoordinators = coordinators.filter((c: any) => {
        if (!c.paroquia) return true;
        const exists = paroquias.some((p: any) => p.nome === c.paroquia);
        return !exists;
      });

      return (
        <div className="lg:col-span-12 space-y-8">
          {renderBackButtonHeader("Coordenação Ativa")}
          {/* Pending Approvals Section */}
          {pendingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xs border border-red-100 overflow-hidden"
            >
              <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
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
                      className="p-4 bg-white rounded-2xl border border-slate-150 shadow-2xs space-y-4"
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
                        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-650 text-[10px] rounded-full font-bold uppercase">
                          {user.tipo || "individual"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleApprove(user.id, "coordenacao")
                            }
                            className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                          >
                            Aprovar Coordenador
                          </button>
                          <button
                            onClick={() =>
                              handleApprove(user.id, "ministro")
                            }
                            className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-black transition-colors shadow-2xs"
                          >
                            Aprovar Ministro
                          </button>
                        </div>
                        <div className="flex justify-end mt-1">
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

          {/* Header & Location Filters Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
            {/* Filters bar */}
            {paroquias.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Filtrar por Região:
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <select
                    value={coordFilterEstado}
                    onChange={(e) => {
                      setCoordFilterEstado(e.target.value);
                      setCoordFilterCidade("");
                    }}
                    className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-700"
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
                    className="w-full sm:w-56 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-slate-700"
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
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Parish and Coordinators Grid */}
          {paroquias.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs">
              <p className="text-slate-400 text-sm italic">
                Nenhuma paróquia cadastrada no sistema.
              </p>
            </div>
          ) : filteredParoquias.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-bold text-sm">
                Nenhuma paróquia encontrada nos filtros.
              </p>
              <button
                onClick={() => {
                  setCoordFilterEstado("");
                  setCoordFilterCidade("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 transition-all shadow-2xs"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParoquias.map((p: any) => {
                const parishCoords = coordinators.filter((c: any) => c.paroquia === p.nome);
                const parishMinisters = ministros.filter((m: any) => m.paroquia === p.nome);
                const coordCount = parishCoords.reduce((acc: number, u: any) => acc + (u.tipo === "casal" ? 2 : 1), 0);
                const ministroCount = parishMinisters.reduce((acc: number, u: any) => acc + (u.tipo === "casal" ? 2 : 1), 0);

                return (
                  <div
                    key={p.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-5 relative group"
                  >
                    <div>
                      {/* Top Row with status badge */}
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
                          <Church className="w-5 h-5" />
                        </div>
                        {p.status === "testes" ? (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black rounded-full uppercase tracking-wider">Modo Teste</span>
                        ) : p.status === "bloqueado" ? (
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[9px] font-black rounded-full uppercase tracking-wider">Bloqueada</span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black rounded-full uppercase tracking-wider">Ativa</span>
                        )}
                      </div>

                      {/* Parish name & blocked state */}
                      <div className="mt-4">
                        <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                          {p.nome}
                        </h3>
                        {p.dataBloqueio && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-750 border border-red-200/60 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <span>Bloqueio em: {formatBlockDate(p.dataBloqueio)}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats block */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">COORDENAÇÃO</span>
                          <span className="text-xl font-black text-slate-800 mt-1">{coordCount}</span>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex flex-col">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MINISTROS</span>
                          <span className="text-xl font-black text-slate-800 mt-1">{ministroCount}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 my-4" />

                      {/* Coordinators section */}
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">COORDENADOR(ES):</p>
                        {parishCoords.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nenhum coordenador cadastrado</p>
                        ) : (
                          <div className="space-y-2.5">
                            {parishCoords.map((coord: any) => (
                              <div
                                key={coord.id}
                                className="p-3 bg-white border border-slate-150 rounded-2xl shadow-2xs flex items-center justify-between gap-3 group/coord hover:border-blue-200 hover:shadow-xs transition-all duration-250"
                              >
                                <div className="space-y-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                                    {coord.nome} {coord.tipo === "casal" && coord.nomeConjuge ? `e ${coord.nomeConjuge}` : ""}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                    <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span className="font-mono">{coord.telefone}</span>
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/coord:opacity-100 transition-opacity shrink-0">
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
                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                                    title="Editar Coordenador"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoordinator(coord.id)}
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                                    title="Excluir Coordenador"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Show Unassociated Coordinators Card if exists */}
              {!coordFilterEstado && !coordFilterCidade && unassociatedCoordinators.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-5 relative group">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-2xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black rounded-full uppercase tracking-wider">
                        Não Associados
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                        Coordenadores Sem Paróquia
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Coordenadores sem paróquia válida associada.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">COORDENADOR(ES):</p>
                      <div className="space-y-2.5">
                        {unassociatedCoordinators.map((coord: any) => (
                          <div
                            key={coord.id}
                            className="p-3 bg-white border border-slate-150 rounded-2xl shadow-2xs flex items-center justify-between gap-3 group/coord hover:border-blue-200 hover:shadow-xs transition-all duration-250"
                          >
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                                {coord.nome} {coord.tipo === "casal" && coord.nomeConjuge ? `e ${coord.nomeConjuge}` : ""}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="font-mono">{coord.telefone}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/coord:opacity-100 transition-opacity shrink-0">
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
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                                title="Editar Coordenador"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoordinator(coord.id)}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-all"
                                title="Excluir Coordenador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeAdminTab === "agenda") {
      const adminEvents = customEvents.filter((e) => e.criadoPorAdmin === true);

      // Sort events by date descending
      const sortedAdminEvents = [...adminEvents].sort((a, b) => {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });

      return (
        <div className="lg:col-span-12 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-350">
          {renderBackButtonHeader("Agenda do Administrador")}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
                <div className="mb-5">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Novo Agendamento
                  </h3>
                  <p className="text-xs text-slate-450 mt-1 leading-normal">
                    Cadastre reuniões, comunicados de paralisação ou atualizações. Apenas usuários do grupo de coordenação visualizarão em seus calendários.
                  </p>
                </div>

                <form onSubmit={handleCreateAgendaEvent} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Título do Compromisso
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Reunião Geral de Alinhamento"
                      value={agendaTitulo}
                      onChange={(e) => setAgendaTitulo(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Data
                      </label>
                      <input
                        type="date"
                        required
                        value={agendaData}
                        onChange={(e) => setAgendaData(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Horário (Opcional)
                      </label>
                      <input
                        type="time"
                        value={agendaHorario}
                        onChange={(e) => setAgendaHorario(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Tipo de Compromisso
                    </label>
                    <select
                      value={agendaTipo}
                      onChange={(e) => setAgendaTipo(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                      <option value="reuniao_paroquia">Reunião com as Paróquias</option>
                      <option value="paralisacao">Paralisação do Sistema</option>
                      <option value="atualizacao">Atualização do Sistema</option>
                      <option value="outros">Outra Informação / Comunicado</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Paróquia Alvo
                    </label>
                    <select
                      value={agendaParoquia}
                      onChange={(e) => setAgendaParoquia(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                      <option value="todas">Todas as Paróquias</option>
                      {Array.isArray(paroquias) &&
                        paroquias.map((p: any) => (
                          <option key={p.id || p.nome} value={p.nome}>
                            {p.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Descrição / Detalhes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descrição detalhada sobre o compromisso ou informações adicionais..."
                      value={agendaDescricao}
                      onChange={(e) => setAgendaDescricao(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAgenda}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submittingAgenda ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Confirmar Agendamento
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs min-h-[400px] flex flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800 tracking-tight">
                        Histórico de Compromissos
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Visualize e gerencie os compromissos agendados por você.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black rounded-full">
                      {sortedAdminEvents.length}
                    </span>
                  </div>

                  {sortedAdminEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="max-w-[280px]">
                        <p className="text-sm font-bold text-slate-700">Nenhum compromisso</p>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">
                          Você ainda não agendou nenhum compromisso para as coordenações. Use o formulário ao lado para começar.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedAdminEvents.map((evt) => {
                        let icon = <Info className="w-4 h-4 text-slate-600" />;
                        let cardColor = "bg-slate-50 border-slate-200";
                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        let typeText = "Comunicado";

                        if (evt.tipo === "reuniao_paroquia") {
                          icon = <Users className="w-4 h-4 text-blue-600" />;
                          cardColor = "bg-blue-50/30 border-blue-100";
                          badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                          typeText = "Reunião";
                        } else if (evt.tipo === "paralisacao") {
                          icon = <AlertCircle className="w-4 h-4 text-red-600" />;
                          cardColor = "bg-red-50/30 border-red-100";
                          badgeColor = "bg-red-50 text-red-700 border-red-100";
                          typeText = "Paralisação";
                        } else if (evt.tipo === "atualizacao") {
                          icon = <RefreshCw className="w-4 h-4 text-violet-600" />;
                          cardColor = "bg-violet-50/30 border-violet-100";
                          badgeColor = "bg-violet-50 text-violet-700 border-violet-100";
                          typeText = "Atualização";
                        }

                        // Format Date
                        let formattedDate = evt.data;
                        if (evt.data && evt.data.includes("-")) {
                          const parts = evt.data.split("-");
                          if (parts.length === 3) {
                            formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                        }

                        return (
                          <div
                            key={evt.id}
                            className={`p-4 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-xs ${cardColor}`}
                          >
                            <div className={`p-2 rounded-xl border shrink-0 bg-white shadow-2xs`}>
                              {icon}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                  {typeText}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {formattedDate} {evt.horario ? `às ${evt.horario}` : ""}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-slate-800 leading-snug truncate">
                                {evt.titulo}
                              </h4>

                              {evt.descricao && (
                                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap mt-1">
                                  {evt.descricao}
                                </p>
                              )}

                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold pt-1">
                                <span className="text-slate-350 font-semibold">Alvo:</span>
                                <span>{evt.paroquia === "todas" ? "Todas as Paróquias" : evt.paroquia}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteAgendaEvent(evt.id)}
                              title="Remover compromisso"
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
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

        {/* Top Navigation Grid (Cards & Icons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {/* Dashboard Card */}
          <button
            onClick={() => setActiveAdminTab("dashboard")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "dashboard"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "dashboard" ? "text-blue-700" : "text-slate-600"
            }`}>
              Dashboard
            </span>
          </button>

          {/* Igrejas / Paróquias Card */}
          <button
            onClick={() => setActiveAdminTab("igrejas")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "igrejas"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "igrejas"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <Church className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "igrejas" ? "text-blue-700" : "text-slate-600"
            }`}>
              Igrejas / Paróquias
            </span>
          </button>

          {/* Coordenação Ativa Card */}
          <button
            onClick={() => setActiveAdminTab("coordenacao-ativa")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "coordenacao-ativa"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "coordenacao-ativa"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "coordenacao-ativa" ? "text-blue-700" : "text-slate-600"
            }`}>
              Coordenação Ativa
            </span>
          </button>

          {/* Testes Card */}
          <button
            onClick={() => setActiveAdminTab("testes")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "testes"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "testes"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "testes" ? "text-blue-700" : "text-slate-600"
            }`}>
              Testes
            </span>
          </button>

          {/* Fidelis (Coroinhas) Card */}
          <button
            onClick={() => setActiveAdminTab("fidelis")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "fidelis"
                ? "bg-white border-2 border-indigo-600 shadow-md shadow-indigo-100"
                : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "fidelis"
                ? "bg-indigo-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
            }`}>
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "fidelis" ? "text-indigo-700" : "text-slate-600"
            }`}>
              Fidelis (Coroinhas)
            </span>
          </button>

          {/* Configurações Card */}
          <button
            onClick={() => setActiveAdminTab("configuracoes")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "configuracoes"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "configuracoes"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "configuracoes" ? "text-blue-700" : "text-slate-600"
            }`}>
              Configurações
            </span>
          </button>

          {/* Agenda Card */}
          <button
            onClick={() => setActiveAdminTab("agenda")}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 min-h-[110px] ${
              activeAdminTab === "agenda"
                ? "bg-white border-2 border-blue-600 shadow-md shadow-blue-100"
                : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 hover:shadow-xs"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${
              activeAdminTab === "agenda"
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className={`text-xs font-black tracking-tight ${
              activeAdminTab === "agenda" ? "text-blue-700" : "text-slate-600"
            }`}>
              Agenda
            </span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {renderAdminContent()}
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
                    Senha de Acesso (Mín. 6 caracteres: maiúsculas, minúsculas e
                    símbolos)
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorFormData.senha}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 30);
                      setCoordinatorFormData({
                        ...coordinatorFormData,
                        senha: val,
                      });
                    }}
                    maxLength={30}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800 font-mono"
                    placeholder="Ex: Min@2026Forte"
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
                        Senha de Acesso Cônjuge (Mín. 6 caracteres: maiúsculas,
                        minúsculas e símbolos)
                      </label>
                      <input
                        type="text"
                        value={coordinatorFormData.senhaConjuge}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 30);
                          setCoordinatorFormData({
                            ...coordinatorFormData,
                            senhaConjuge: val,
                          });
                        }}
                        maxLength={30}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-liturgy-500/20 outline-none text-sm text-slate-800 font-mono"
                        placeholder="Ex: Conj@2026Forte"
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

function LoginView({ onLogin, setView, modoManutencao: initialModoManutencao }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'cadastro'
  const [modoManutencao, setModoManutencao] = useState(!!initialModoManutencao);
  const liturgyTheme = useMemo(() => {
    const today = getTodayDateStringForLiturgy();
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
  const [showLoginSenha, setShowLoginSenha] = useState(false);
  const [showCadSenha, setShowCadSenha] = useState(false);
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
  const [paroquias, setParoquias] = useState(DEFAULT_PAROQUIAS);

  useEffect(() => {
    setModoManutencao(!!initialModoManutencao);
  }, [initialModoManutencao]);

  useEffect(() => {
    const fetchParoquiasAndConfig = async () => {
      try {
        const [resParoquias, resConfig] = await Promise.all([
          fetch("/api/paroquias"),
          fetch(`/api/config?t=${Date.now()}`)
        ]);

        if (resParoquias.ok) {
          let data: any[] = [];
          try {
            const text = await resParoquias.text();
            data = text ? JSON.parse(text) : DEFAULT_PAROQUIAS;
          } catch (parseErr) {
            data = DEFAULT_PAROQUIAS;
          }
          if (Array.isArray(data) && data.length > 0) {
            setParoquias(data);
            setCadParoquia(data[0].nome);
          } else {
            setParoquias(DEFAULT_PAROQUIAS);
          }
        }

        if (resConfig.ok) {
          try {
            const text = await resConfig.text();
            const configData = JSON.parse(text);
            if (configData && typeof configData.modoManutencao === "boolean") {
              setModoManutencao(configData.modoManutencao);
            }
          } catch (e) {
            // Ignore parse error
          }
        }
      } catch (err) {
        const isNet = err instanceof Error && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("network") || err.message.includes("Failed to fetch") || err.message.includes("HTTP"));
        if (isNet) {
          console.warn("Aviso de conexão ao buscar paróquias e configurações (polling):", err instanceof Error ? err.message : err);
        } else {
          console.error("Erro ao buscar paróquias e configurações:", err);
        }
        setParoquias(DEFAULT_PAROQUIAS);
      }
    };

    fetchParoquiasAndConfig();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchParoquiasAndConfig();
      }
    }, 30000);
    return () => clearInterval(interval);
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
        let data: any = {};
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.warn("Could not parse JSON in admin login:", e);
        }
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
      /^\d+$/.test(trimmedSenha) &&
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

      let data: any = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn("Could not parse JSON in user login:", e);
      }

      console.log("Regular user login response:", {
        ok: response.ok,
        data,
        error: data.error,
      });

      if (response.ok) {
        const u = data.user;
        onLogin(u, !!data.reset);
      } else {
        if (response.status === 503) {
          setError("O sistema está temporariamente em manutenção preventiva.");
        } else {
          setError(data.error || "Erro ao realizar login.");
        }
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

    const isCoordenadorReg = cadRole === "coordenacao";
    if (isCoordenadorReg) {
      if (!isComplexPassword(cadSenha)) {
        setError(
          "A senha do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.",
        );
        return;
      }
    } else {
      if (cadSenha.length !== 3) {
        setError("A senha deve ter exatamente 3 números.");
        return;
      }
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
      className={`theme-${liturgyTheme} min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans bg-white`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-blue-900/[0.03] backdrop-blur-md border border-red-300/40 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(135,31,38,0.07)] w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Portal do Mece
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Identifique-se para acessar a escala
          </p>
        </div>

        <div className="flex p-1 bg-red-900/[0.05] rounded-2xl mb-6 border border-red-200/50">
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
            className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${activeTab === "login" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-slate-800"}`}
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
            className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${activeTab === "cadastro" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-800"}`}
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
            className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${activeTab === "suporte" ? "bg-red-500/80 text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-slate-800"}`}
          >
            Suporte
          </button>
        </div>

        {activeTab === "suporte" ? (
          <div className="text-left py-2 px-2 text-slate-700">
            <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">
              Suporte e Informações
            </h2>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-800">
                Este sistema foi desenvolvido para modernizar e simplificar a
                gestão das comunidades paroquiais:
              </p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-slate-900">
                      Organização Litúrgica:
                    </strong>{" "}
                    Centraliza a gestão de escalas de ministros e a coleta de
                    disponibilidades mensais de forma automatizada e intuitiva.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-slate-900">
                      Controle de Trocas:
                    </strong>{" "}
                    Gerencia pedidos de substituição entre ministros com um
                    fluxo de aprovação em tempo real pela coordenação paroquial.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-slate-900">
                      Painel de controle integrado:
                    </strong>{" "}
                    Oferece acesso rápido ao Evangelho do Dia e escalas
                    personalizadas, garantindo total sincronia com o calendário
                    litúrgico.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Contato para adesão ou suporte
                </p>
                <p className="text-sm font-medium text-slate-900 tracking-tight">
                  portaldomece@gmail.com
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-8 text-center uppercase tracking-tighter">
              © 2026 ABF • Todos os direitos reservados
            </p>
          </div>
        ) : activeTab === "login" ? (
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            {modoManutencao && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 font-medium leading-relaxed">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="font-bold">Aviso importante:</span> O sistema
                  está em manutenção preventiva para atualizações. Acesso liberado apenas para o{" "}
                  <strong className="underline">Administrador</strong> e{" "}
                  <strong className="underline">Alexandre Borelli Facchini</strong>.
                </div>
              </div>
            )}

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

            {localNome.trim().toLowerCase() !== "admin" && (
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
                  type={showLoginSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  maxLength={
                    localNome.trim().toLowerCase() === "admin"
                      ? 15
                      : 30
                  }
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  placeholder={
                    localNome.trim().toLowerCase() === "admin"
                      ? "8-15 caracteres"
                      : isCoordenador
                        ? "Mín. 6 carac. (Músc/mínc/símbolos)"
                        : "3 números"
                  }
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginSenha(!showLoginSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showLoginSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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

            <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => setView("privacy")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3" />
                Política de Privacidade
              </button>
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {cadRole === "coordenacao"
                  ? "Criar Senha (Mín. 6 caracteres: maiúsculas, minúsculas e símbolos)"
                  : "Criar Senha (3 números)"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showCadSenha ? "text" : "password"}
                  value={cadSenha}
                  onChange={(e) => setCadSenha(e.target.value)}
                  maxLength={cadRole === "coordenacao" ? 30 : 3}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  placeholder={
                    cadRole === "coordenacao" ? "Ex: Min@2026Forte" : "Ex: 123"
                  }
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCadSenha(!showCadSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCadSenha ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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

  console.log(
    "[DEBUG EscalaView] hasEscala:",
    hasEscala,
    "isCoordenador:",
    isCoordenador,
    "escala keys:",
    escala ? Object.keys(escala).slice(0, 5) : [],
  );
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
            console.log(
              `[DEBUG EscalaView] Month ${month} < ${currentMonthStr}, excluding.`,
            );
            return acc;
          }

          // STRICT FILTER for general viewing: only show published months for ministers.
          // Coordinators should see draft months in the main Dashboard too to verify their work.
          // Fallback to global escalaPublicada if no specific month configuration exists
          const explicitMonthPublic =
            escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined
              ? escalaPublicadaPorMes[month]
              : null;
          const isMonthPublic =
            explicitMonthPublic === true ||
            (explicitMonthPublic === null && escalaPublicadaGlobal === true) ||
            month === currentMonthStr;

          if (!isMonthPublic && !isCoordenador) return acc;

          if (!acc.includes(month)) acc.push(month);
          return acc;
        }, [] as string[])
        .sort()
    : [];

  useEffect(() => {
    // Debug log to help identify why a month might be appearing
    if (hasCoordAccess(user)) {
      console.log(`[DEBUG EscalaView] Months found:`, months);
      console.log(
        `[DEBUG EscalaView] scalePublishedMap:`,
        escalaPublicadaPorMes,
      );
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
        const explicitMonthPublic =
          escalaPublicadaPorMes && escalaPublicadaPorMes[month] !== undefined
            ? escalaPublicadaPorMes[month]
            : null;
        const isMonthPublic =
          explicitMonthPublic === true ||
          (explicitMonthPublic === null && escalaPublicadaGlobal === true) ||
          month === currentMonthStr;

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
          const filtered = Object.keys(escala || {}).reduce(
            (acc: any, k: string) => {
              if (k.startsWith(m2) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
                acc[k] = (escala || {})[k];
              return acc;
            },
            {} as any,
          );
          setDownloadOptionMode({ aberta: true, escala: filtered });
        },
        m2Label.charAt(0).toUpperCase() + m2Label.slice(1),
        undefined,
        m1Label.charAt(0).toUpperCase() + m1Label.slice(1),
        () => {
          const filtered = Object.keys(escala || {}).reduce(
            (acc: any, k: string) => {
              if (k.startsWith(m1) || !/^\d{4}-\d{2}-\d{2}$/.test(k))
                acc[k] = (escala || {})[k];
              return acc;
            },
            {} as any,
          );
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

                              const minsListPublic = Array.isArray(missa) ? missa : missa?.ministros || [];
                              let cardHeadcountPublic = 0;
                              minsListPublic.forEach((m: any) => {
                                const mName = typeof m === "string" ? m : m?.nome || "";
                                if (mName.includes(" e ")) cardHeadcountPublic += 2;
                                else cardHeadcountPublic += 1;
                              });
                              const cardLimitePublic = missa?.limiteManual !== undefined ? Number(missa.limiteManual) : 8;
                              const missingCountPublic = Math.max(0, cardLimitePublic - cardHeadcountPublic);
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
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${isDomingo ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}
                                      >
                                        {missa.nome || "Missa"}
                                      </span>
                                      {missingCountPublic > 0 && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                          {cardHeadcountPublic}/{cardLimitePublic} Vagas (Falta {missingCountPublic})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    {[
                                      ...(Array.isArray(missa)
                                        ? missa
                                        : missa?.ministros || []),
                                    ]
                                      .sort((a, b) => {
                                        const nameA = typeof a === "string" ? a : a?.nome || "";
                                        const nameB = typeof b === "string" ? b : b?.nome || "";
                                        const normalizedA = normalize(nameA);
                                        const normalizedB = normalize(nameB);
                                        const isALider = isMinisterLeader(nameA, missa.lider);
                                        const isBLider = isMinisterLeader(nameB, missa.lider);

                                        if (isALider && !isBLider) return -1;
                                        if (!isALider && isBLider) return 1;

                                        return normalizedA.localeCompare(
                                          normalizedB,
                                          "pt-BR",
                                          { sensitivity: "base" },
                                        );
                                      })
                                      .map((m, idx) => {
                                      const normalizedM = normalize(m);
                                      const isMe = isMinisterMatchingUser(m, user);

                                      const isLider = isMinisterLeader(m, missa.lider);

                                      return (
                                        <div
                                          key={idx}
                                          className={`p-3 rounded-2xl flex items-center gap-3 transition-colors ${isMe ? "bg-liturgy-600 text-black shadow-lg shadow-liturgy-100" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                                        >
                                          <div
                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${isMe ? "bg-black animate-pulse" : isDomingo ? "bg-red-400" : "bg-liturgy-400"}`}
                                          />
                                          <div className="flex flex-col">
                                            {renderMinisterWithStar(m, missa.lider, undefined, { className: `text-xs font-bold ${isMe ? "text-black" : "text-slate-700"}` })}
                                          </div>

                                     {missingCountPublic > 0 &&
                                       Array.from({ length: missingCountPublic }).map((_, missingIdx) => (
                                         <div
                                           key={`aguardando-${missingIdx}`}
                                           className="p-3 rounded-2xl flex items-center justify-between gap-3 bg-red-100/90 border-2 border-red-300 text-red-700 font-black shadow-xs animate-pulse"
                                         >
                                           <div className="flex items-center gap-2.5 min-w-0">
                                             <div className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0 animate-ping" />
                                             <span className="text-xs font-black text-red-700 uppercase tracking-wider">
                                               Aguardando
                                             </span>
                                           </div>
                                           <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-red-200 text-red-900 border border-red-300 font-extrabold">
                                             À espera de ministro
                                           </span>
                                         </div>
                                       ))}
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
  const isCoordenador = useMemo(() => hasCoordAccess(user), [user]);
  const [sessionDropped, setSessionDropped] = useState(false);

  const [modalAviso, setModalAviso] = useState<{
    aberta: boolean;
    titulo: string;
    mensagem: string;
  }>({ aberta: false, titulo: "", mensagem: "" });
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [escala, setEscala] = useState(null);
  const [regraDisponibilidadeGlobal, setRegraDisponibilidadeGlobal] = useState<
    "livre" | "regra2" | "regra3"
  >("regra2");
  const [view, setView] = useState<string>("welcome");
  const [slotsSelecionados, setSlotsSelecionados] = useState<any[]>([]);
  const [initialSlotsSelecionados, setInitialSlotsSelecionados] = useState<any[]>([]);
  const [viewAsUser, setViewAsUser] = useState<any>(null);
  const [viewAsMinister, setViewAsMinister] = useState<boolean>(false);
  const [mesSelecionado, setMesSelecionado] = useState<number>(() => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
    return targetDate.getMonth() + 1;
  });
  const [anoSelecionado, setAnoSelecionado] = useState<number>(() => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
    return targetDate.getFullYear();
  });
  const [disponibilidadeAberta, setDisponibilidadeAberta] = useState<boolean>(true);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [ocupacao, setOcupacao] = useState<any>({});
  const [slotsDisponiveis, setSlotsDisponiveis] = useState<any[]>([]);
  const [showPreAberturaMessage, setShowPreAberturaMessage] = useState<boolean>(false);
  const [mensagemDisponibilidade, setMensagemDisponibilidade] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [birthdayMessage, setBirthdayMessage] = useState<string>("");
  const [modoManutencao, setModoManutencao] = useState<boolean>(false);
  const [activeCoordenacaoTab, setActiveCoordenacaoTab] = useState<string>("dashboard");
  const [escalaPublicada, setEscalaPublicada] = useState<boolean>(false);
  const [escalaPublicadaPorMes, setEscalaPublicadaPorMes] = useState<any>({});
  const [mensagensRecebidas, setMensagensRecebidas] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState<string>("");
  const [tipoCadastro, setTipoCadastro] = useState<string>("individual");
  const [telefone, setTelefone] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [nomeConjuge, setNomeConjuge] = useState<string>("");

  const [modalConfirm, setModalConfirm] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const customConfirm = (tituloOrMsg: string, msgOrConfirm?: any, onConfirmParam?: () => void, onCancelParam?: () => void) => {
    let titulo = "Confirmação";
    let mensagem = tituloOrMsg;
    let onConfirm = () => {};
    let onCancel = onCancelParam;

    if (typeof msgOrConfirm === "function") {
      onConfirm = msgOrConfirm;
    } else if (typeof msgOrConfirm === "string") {
      titulo = tituloOrMsg;
      mensagem = msgOrConfirm;
      if (onConfirmParam) onConfirm = onConfirmParam;
    }

    setModalConfirm({ aberto: true, titulo, mensagem, onConfirm, onCancel });
  };

  const renderModal = () => {
    if (!modalConfirm?.aberto) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{modalConfirm.titulo}</h3>
          <p className="text-sm text-slate-600 mb-6">{modalConfirm.mensagem}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                if (modalConfirm.onCancel) modalConfirm.onCancel();
                setModalConfirm(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                modalConfirm.onConfirm();
                setModalConfirm(null);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const onLogin = (userData: any, isReset?: boolean) => {
    setUser(userData);
    if (isReset) setNeedsPasswordReset(true);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setView(userData?.role === "admin" ? "admin" : "welcome");
    fetchInitialData(userData);
  };

  const getChaveOcupacao = (data: string, horario?: string, nomeMissa?: string) => {
    return `${data}_${horario || ""}_${nomeMissa || ""}`;
  };

  const getLimiteVagas = (slot: any) => {
    return slot && slot.limiteManual !== undefined ? Number(slot.limiteManual) : 6;
  };

  const fetchMensagensRecebidas = async () => {};
  const handleEnviarMensagem = async () => {};
  const handleMarcarComoLida = async (_id: string) => {};
  const handleExcluirMensagem = async (_id: string) => {};

  const fetchInitialData = async (userData) => {
    if (!userData?.telefone) return;

    // Busca dados completos do ministro e disponibilidade
    try {
      // Start of data fetching block
      // 1. Buscar dados do ministro (incluindo aniversário)
      const ministroResponse = await fetch(
        `/api/ministros/${encodeURIComponent(userData.loginPhone || userData.telefone)}`,
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
        `/api/ministros/${encodeURIComponent(user.loginPhone || user.telefone)}`,
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
        
        // Re-calculate role restriction if necessary
        const freshData = data.ministro;
        let finalRole = freshData.role || 'ministro';
        if (['coordenacao', 'vice_coordenacao'].includes(finalRole) && freshData.tipo === 'casal') {
          const acesso = freshData.acessoCoordenacao || 'casal';
          if (acesso === 'ele' && prev.isConjugeLogin) finalRole = 'ministro';
          if (acesso === 'ela' && !prev.isConjugeLogin) finalRole = 'ministro';
        }

        const updated = { ...prev, ...freshData, role: finalRole };
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

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (text.includes("Rate exceeded")) {
          throw new Error(
            "Limite de requisições excedido. Por favor, aguarde alguns instantes.",
          );
        }
        throw new Error("Resposta inválida do servidor.");
      }

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
    if (!user) return;

    let lastActivity = Date.now();
    const INACTIVITY_LIMIT = 5 * 60 * 1000;

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT) {
        handleLogout();
      }
    }, 10000); // Verifica a cada 10 segundos

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      clearInterval(checkInactivity);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Cache ministros for instant leader recognition & asterisks
  useEffect(() => {
    fetchAndCacheMinistros(user?.paroquia);
  }, [user?.paroquia]);

  // Global Real-Time Maintenance Mode Sync
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      try {
        const res = await fetch(`/api/config?t=${Date.now()}`);
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data && typeof data.modoManutencao === "boolean") {
              setModoManutencao(data.modoManutencao);
            }
          } catch (e) {
            // Ignore parse error
          }
        }
      } catch (err) {
        // Ignore network polling error
      }
    };

    fetchGlobalConfig();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchGlobalConfig();
      }
    }, 20000); // Polling a cada 20s quando a aba está visível

    const handleMaintenanceEvent = () => {
      setModoManutencao(true);
    };
    window.addEventListener("maintenance_mode_active", handleMaintenanceEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("maintenance_mode_active", handleMaintenanceEvent);
    };
  }, []);

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

  const fetchVagasInFlightRef = useRef(false);

  const fetchVagas = async () => {
    if (!user || !user.paroquia) {
      return;
    }

    if (fetchVagasInFlightRef.current) {
      return;
    }

    fetchVagasInFlightRef.current = true;
    const targetMes = mesSelecionado;
    const targetAno = anoSelecionado;

    try {
      const response = await fetch(
        `/api/vagas?paroquia=${encodeURIComponent(user.paroquia)}&mes=${targetMes}&ano=${targetAno}`,
      );
      if (response.ok) {
        const data = await safeJson(response, null);
        if (data) {
          setOcupacao(data);
        }
      } else if (response.status === 429) {
        console.warn("[DEBUG] fetchVagas: Limite de requisições atingido (429).");
      } else {
        console.warn("[DEBUG] fetchVagas status:", response.status);
      }
    } catch (error) {
      console.warn("Aviso ao buscar vagas:", error);
    } finally {
      fetchVagasInFlightRef.current = false;
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
        console.warn("Aviso ao verificar exceção:", err);
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) {
        checkException();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [
    user?.telefone,
    user?.excecaoAcessoAte,
    disponibilidadeAberta,
    user?.role,
    viewAsUser,
  ]);

  // Fetch personal availability for the minister in parent App component
  useEffect(() => {
    const isDisp = view === "disponibilidade";
    const targetUser = viewAsUser || user;
    if (isDisp && targetUser?.telefone) {
      const fetchMinisterAvailability = async () => {
        setSlotsSelecionados([]);
        try {
          const response = await fetch(
            `/api/disponibilidade/${encodeURIComponent(targetUser.telefone)}?mes=${mesSelecionado}&ano=${anoSelecionado}`,
          );
          if (response.ok) {
            const data = await response.json();
            const ids = data.map((d: any) => {
              const id = normalizeId(`${d.data}-${d.horario}-${d.nomeMissa}`);
              return { id, modo: d.modo || "individual", data: d.data, horario: d.horario, nomeMissa: d.nomeMissa };
            });
            setInitialSlotsSelecionados(ids);
            setSlotsSelecionados(ids);
          }
        } catch (error) {
          console.warn("Aviso ao buscar disponibilidade do ministro:", error);
        }
      };
      fetchMinisterAvailability();
    }
  }, [view, mesSelecionado, anoSelecionado, user?.telefone, viewAsUser]);

  useEffect(() => {
    const targetUser = viewAsUser || user;
    const shouldFetchVagas = ["disponibilidade", "coordenacao", "welcome"].includes(view);
    if (targetUser?.paroquia && shouldFetchVagas) {
      fetchVagas();

      const targetMes = mesSelecionado;
      const targetAno = anoSelecionado;

      const gerarSlotsAsync = async () => {
        try {
          const slots = await getExpectedSlots(
            targetUser.paroquia,
            targetMes,
            targetAno,
          );
          setSlotsDisponiveis(slots);
        } catch (slotErr) {
          console.warn("Aviso ao gerar slots:", slotErr);
        }
      };

      gerarSlotsAsync();
    }
  }, [viewAsUser, user?.paroquia, view, mesSelecionado, anoSelecionado, activeCoordenacaoTab]);

  const handleSlotChange = (slotId) => {
    const isCoordenador = hasCoordAccess(user);
    const hasException = !!(
      user?.excecaoAcessoAte && new Date(user.excecaoAcessoAte) > new Date()
    );
    const hasSubmitted = (initialSlotsSelecionados || []).length > 0;
    const isLocked =
      !isCoordenador &&
      !hasException &&
      (hasSubmitted || !disponibilidadeAberta);
    if (isLocked) return;

    const target = viewAsUser || user;
    const isUserCasal =
      target?.tipo === "casal" ||
      user?.tipo === "casal" ||
      !!(target?.nomeConjuge && target.nomeConjuge.trim().length > 0) ||
      !!(user?.nomeConjuge && user.nomeConjuge.trim().length > 0);

    setSlotsSelecionados((prev) => {
      const exists = prev.find((s) => s.id === slotId);
      if (exists) {
        return prev.filter((s) => s.id !== slotId);
      } else {
        return [
          ...prev,
          {
            id: slotId,
            modo: isUserCasal ? "casal" : "individual",
          },
        ];
      }
    });
  };

  const handleModeChange = (slotId, newMode) => {
    const isCoordenador = hasCoordAccess(user);
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
    const isCoordenador = hasCoordAccess(user);

    // Determinar mensagens e número mínimo de datas com base na regra ativa
    const minDates =
      regraDisponibilidadeGlobal === "livre"
        ? 1
        : regraDisponibilidadeGlobal === "regra3"
          ? 3
          : 2;
    const ruleMessageZero =
      regraDisponibilidadeGlobal === "livre"
        ? "Selecione pelo menos uma missa/data."
        : regraDisponibilidadeGlobal === "regra3"
          ? "Selecione pelo menos três missas em datas não sequenciais."
          : "Selecione pelo menos duas missas em datas não sequenciais.";

    if (slotsSelecionados.length === 0) {
      if (isCoordenador)
        return {
          valid: true,
          message:
            "Clique em Enviar para registrar sua disponibilidade (ou limpar).",
        };
      return {
        valid: false,
        message: ruleMessageZero,
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

    if (!isCoordenador && datasSelecionadas.length < minDates) {
      return {
        valid: false,
        message:
          regraDisponibilidadeGlobal === "livre"
            ? "Selecione pelo menos uma data para prosseguir."
            : regraDisponibilidadeGlobal === "regra3"
              ? "Selecione pelo menos três datas diferentes para prosseguir."
              : "Selecione pelo menos duas datas diferentes para prosseguir.",
      };
    }

    if (regraDisponibilidadeGlobal === "livre") {
      return { valid: true, message: "" };
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
          regraDisponibilidadeGlobal === "regra3"
            ? "Selecione datas em períodos diferentes (ex: três sábados ou datas não sequenciais)."
            : "Selecione datas em períodos diferentes (ex: dois sábados ou datas não sequenciais).",
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
    const isUserCoordenador = hasCoordAccess(user);
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
      nome: targetUser?.nome || targetUser?.nomeExibicao,
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
      safeFetchJson<any>(`/api/escala?paroquia=${encodeURIComponent(user.paroquia)}`, undefined, {})
        .then((data) => {
          if (data) setEscala(data);
        })
        .catch((err) => console.error("Erro ao buscar escala:", err));
    }
  }, [user, escalaPublicada]);

  useEffect(() => {
    const targetUser = viewAsUser || user;
    if (!escala || !targetUser) {
      setMyAssignments([]);
      return;
    }
    const allFoundAssignments: any[] = [];
    Object.entries(escala).forEach(([dateStr, missas]: [string, any]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (!missas || typeof missas !== "object") return;
      Object.entries(missas).forEach(([time, missa]: [string, any]) => {
        if (!missa || typeof missa !== "object") return;
        const ministros = Array.isArray(missa.ministros) ? missa.ministros : [];
        const matchedMinister = ministros.find((m: any) => isMinisterMatchingUser(m, targetUser));
        const isLeader = isMinisterLiderForUser(missa.lider, targetUser, ministros);

        if (matchedMinister || isLeader) {
          const matchedName = (typeof matchedMinister === "object" && matchedMinister !== null)
            ? (matchedMinister.nome || "")
            : matchedMinister || targetUser.nome;

          allFoundAssignments.push({
            date: dateStr,
            time: time,
            horario: time,
            matchedName: matchedName,
            ...missa,
          });
        }
      });
    });

    allFoundAssignments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || a.horario || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || b.horario || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    });

    setMyAssignments(allFoundAssignments);
  }, [escala, user, viewAsUser]);

  useEffect(() => {
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

  if (view === "privacy") {
    return (
      <PrivacyView
        voltar={() => {
          if (user) {
            setView(user.role === "admin" ? "admin" : "coordenacao");
          } else {
            setView("login");
          }
        }}
      />
    );
  }

  if (!user) {
    return (
      <LoginView
        onLogin={onLogin}
        setView={setView}
        modoManutencao={modoManutencao}
      />
    );
  }

  // Se o sistema estiver em modo de manutenção e o usuário não for administrador nem Alexandre Borelli Facchini,
  // bloqueamos o acesso interativo com uma linda tela informativa
  const isAlexandreOrAdmin = (u: any) => {
    if (!u) return false;
    if (u.role === "admin") return true;
    const cleanPhone = (p: any) => (p || "").replace(/\D/g, "");
    const phones = [
      cleanPhone(u.telefone),
      cleanPhone(u.telefoneConjuge),
      cleanPhone(u.loginPhone),
      cleanPhone(u.phone),
    ];
    if (phones.some((p) => p.endsWith("14997865806") || p === "14997865806")) {
      return true;
    }

    const normalize = (s: any) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    const names = [
      normalize(u.nome),
      normalize(u.nomeExibicao),
      normalize(u.nomeConjuge),
      normalize(u.nomeExibicaoConjuge),
      normalize(u.loggedInName),
    ];
    if (
      names.some(
        (n) =>
          n.includes("alexandre borelli facchini") ||
          n.includes("alexandre facchini"),
      )
    ) {
      return true;
    }
    if (u.email && u.email.toLowerCase().includes("alex.facchini1@gmail.com")) {
      return true;
    }
    return false;
  };

  const isUserExempt = isAlexandreOrAdmin(user);
  if (modoManutencao && !isUserExempt) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full rounded-3xl border p-8 shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
        >
          {/* Decorative glowing gradient backdrop */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            <div
              className="p-4 bg-red-950/40 rounded-full border border-red-550/30 text-red-400"
              style={{
                backgroundColor: "rgba(127, 29, 29, 0.4)",
                borderColor: "rgba(220, 38, 38, 0.3)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight uppercase text-white">
                Sistema em Manutenção
              </h1>
              <p className="text-[10px] font-mono text-slate-400">
                {user
                  ? `Usuário: ${user.nome} • Paróquia: ${user.paroquia || "Geral"}`
                  : "Bloqueio Temporário de Segurança"}
              </p>
            </div>

            <div
              className="p-5 rounded-2xl border text-sm text-left leading-relaxed space-y-3"
              style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
            >
              <p className="text-slate-350" style={{ color: "#cbd5e1" }}>
                Olá! <strong>Coordenação / Ministros</strong>, o sistema iniciou
                uma <strong>manutenção preventiva</strong> ou{" "}
                <strong>atualização de dados</strong>.
              </p>
              <p className="text-slate-350" style={{ color: "#cbd5e1" }}>
                Para manter a integridade das escalas, das mensagens e de suas
                disponibilidades (evitando incompatibilidades de salvamento
                enquanto o banco de dados é atualizado ou restaurado), o acesso
                interativo foi pausado.
              </p>
              <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                Nenhum dado foi perdido! Suas informações estão seguras. O
                sistema retornará ao funcionamento integral assim que o
                administrador finalizar a atualização.
              </p>
            </div>

            <div
              className="pt-4 flex flex-col items-center gap-3 w-full"
              style={{ borderTop: "1px solid #334155" }}
            >
              <p className="text-xs text-slate-400 font-medium">
                Sua página recarregará automaticamente ou pressione abaixo para
                recarregar.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  Recarregar Sistema
                </button>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: "#334155",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    Sair da Conta
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isCoordenadorGlobal = hasCoordAccess(user);
  const finalInitialSlots = initialSlotsSelecionados;

  if (view === "welcome" || view === "coordenacao") {
    return (
      <>
        <CoordenacaoView
          onTabChange={setActiveCoordenacaoTab}
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
          regraDisponibilidade={regraDisponibilidadeGlobal}
          error={error}
          message={message}
          isCoordenador={isCoordenadorGlobal}
          ocupacao={ocupacao}
          setOcupacao={setOcupacao}
          setSlotsDisponiveisApp={setSlotsDisponiveis}
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
              const typeLabel =
                obj.type === "success" ? "Sucesso" : "Erro / Atenção";
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
              const typeLabel =
                obj.type === "success" ? "Sucesso" : "Erro / Atenção";
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
    const isUserCasal =
      targetUser?.tipo === "casal" ||
      user?.tipo === "casal" ||
      !!(targetUser?.nomeConjuge && targetUser.nomeConjuge.trim().length > 0) ||
      !!(user?.nomeConjuge && user.nomeConjuge.trim().length > 0);
    const isCoordenador = hasCoordAccess(user);
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
        <div className="bg-white min-h-screen w-full flex items-center justify-center p-6 font-sans relative">
          <BackgroundLogo paroquia={targetUser?.paroquia} />
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
                ? "Sua disponibilidade já foi enviada com sucesso! Veja abaixo as datas e missas que você selecionou para este mês."
                : "O período para envio do Agendamento Mensal de Disponibilidade foi concluído. Caso precise de suporte, contate a coordenação."}
            </p>
            {isReceived && (
              <SubmittedSlotsConsultation
                submittedList={initialSlotsSelecionados}
                allSlots={slotsDisponiveis}
                mes={mesSelecionado}
                ano={anoSelecionado}
                user={targetUser || user}
              />
            )}
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
      <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans relative">
        <BackgroundLogo paroquia={targetUser?.paroquia} />
        <div className="max-w-[1600px] mx-auto w-full relative z-10">
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
                {targetUser?.role === "vice_coordenacao" && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold uppercase font-sans">
                    Vice-Coordenador
                  </span>
                )}
                {hasCoordAccess(targetUser) &&
                  targetUser?.role !== "vice_coordenacao" && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold uppercase font-sans">
                      Coordenador
                    </span>
                  )}
                {((targetUser?.tipo === 'casal' && targetUser?.isConjugeLogin) ? targetUser?.isLiderConjuge : targetUser?.isLider) && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold uppercase font-sans">
                    Responsável pela Missa
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
                            console.log(
                              "DEBUG 4: chave:",
                              chaveOcupacao,
                              "ocupacao:",
                              ocupacao[chaveOcupacao],
                            );
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
                              isUserCasal
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

                                {isSelected && isUserCasal && (
                                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-blue-100 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "casal")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "casal" ? "bg-blue-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      Ambos
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
                            console.log("DEBUG 2:", chaveOcupacao, slot);
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
                              isUserCasal
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

                                {isSelected && isUserCasal && (
                                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-emerald-100 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModeChange(slot.id, "casal")
                                      }
                                      className={`flex-1 py-1 text-[10px] font-bold rounded ${selection.modo === "casal" ? "bg-emerald-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50"}`}
                                    >
                                      Ambos
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
          sessionStorage.setItem("user", JSON.stringify(finalUser));
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
      <div className="min-h-screen bg-slate-50 relative">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
          <CadastroView
            user={user}
            onSave={handleSaveUserGlobally}
            voltar={() => setView("welcome")}
            onBack={() => setView("welcome")}
            onSetView={setView}
          />
        </div>
        {renderModal()}
      </div>
    );
  }

  if (view === "lider_painel") {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
          <LiderView
            user={viewAsUser || user}
            myAssignments={myAssignments}
            voltar={() => setView("welcome")}
            onAlert={(titulo, mensagem) => {
              if (typeof titulo === "object" && titulo !== null) {
                const obj = titulo as any;
                customConfirm(obj.title || obj.titulo || "Aviso", obj.message || obj.mensagem, obj.onConfirm, obj.onCancel);
                return;
              }
              customConfirm(titulo, mensagem || "", () => {});
            }}
          />
        </div>
        {renderModal()}
      </div>
    );
  }

  if (view === "mensagem") {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
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
        </div>
        {renderModal()}
      </div>
    );
  }

  if (view === "escala") {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
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
        </div>
        {renderModal()}
      </div>
    );
  }

  if (view === "calendario") {
    return (
      <>
        <CalendarioCatolicoView
          voltar={() => setView("welcome")}
          slots={slotsDisponiveis}
          user={user}
          escala={escala}
          myAssignments={myAssignments}
        />
        {renderModal()}
      </>
    );
  }

  if (view === "santo") {
    return (
      <div className="min-h-screen bg-slate-50 relative p-4 sm:p-6 max-w-5xl mx-auto">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
          <SantosView onBack={() => setView("welcome")} />
        </div>
        {renderModal()}
      </div>
    );
  }

  if (user?.role === "admin") {
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
              const typeLabel =
                obj.type === "success" ? "Sucesso" : "Erro / Atenção";
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

  return (
    <>
      <CoordenacaoView
        onTabChange={setActiveCoordenacaoTab}
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
        regraDisponibilidade={regraDisponibilidadeGlobal}
        error={error}
        message={message}
        isCoordenador={isCoordenadorGlobal}
        ocupacao={ocupacao}
        setOcupacao={setOcupacao}
        setSlotsDisponiveisApp={setSlotsDisponiveis}
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
            const typeLabel =
              obj.type === "success" ? "Sucesso" : "Erro / Atenção";
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
