import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Info, CalendarDays, Calendar, LogOut, Check, CheckCircle2, ChevronLeft, BookOpen, Heart, Sun, Cross, Users, Settings, Lock, Unlock, Clock, Church, RefreshCw, AlertCircle, Activity, Gift, X, Minus, Plus, LayoutDashboard, MessageSquare, HelpCircle, Monitor, Smartphone, HandHeart, DollarSign, UserX, Flag, Sparkles } from 'lucide-react';
import { getLiturgicalThemeDynamic, getTodayDateStringForLiturgy } from '../utils/calendario';
import { hasCoordAccess, isMinisterMatchingUser, isMinisterLiderForUser, safeJson, safeFetchJson } from '../utils';
import LiderMissaCard from './LiderMissaCard';

interface WelcomeViewProps {
  needsPasswordReset?: boolean;
  user: any;
  birthdayMessage: string;
  aniversariantes?: any[];
  onLogout: () => void;
  onVerEscala: () => void;
  onSetView: (view: string) => void;
  onSetTab?: (tab: string) => void;
  onUpdateUser?: (user: any) => void;
  onClearImpersonation?: () => void;
  originalUser?: any;
  slotsDisponiveis: any[];
  escala: any;
  isTab?: boolean;
  disponibilidadeAberta?: boolean;
  escalaPublicada?: boolean;
  paroquiaBloqueada?: boolean;
  hasSubmitted?: boolean;
  mesSelecionado?: number;
  anoSelecionado?: number;
  unreadCount?: number;
  liturgyColor?: string;
  showPreAberturaMessage?: boolean;
  mensagemDisponibilidade?: {texto: string, tipo: 'info' | 'warning' | 'error' | 'success'} | null;
  onAlert?: (titulo: string, mensagem: string) => void;
  classicWebMode?: boolean;
  onToggleClassicWebMode?: (val: boolean) => void;
}

const BIBLE_VERSES = [
  "'Tudo posso naquele que me fortalece.' - Filipenses 4:13",
  "'O Senhor é o meu pastor; nada me faltará.' - Salmos 23:1",
  "'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.' - Provérbios 3:5",
  "'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.' - Mateus 11:28",
  "'Porque onde estiver o vosso tesouro, aí estará também o vosso coração.' - Mateus 6:21",
  "'Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai senão por mim.' - João 14:6",
  "'Amai-vos uns aos outros como eu vos amei.' - João 15:12",
  "'Sede fortes e corajosos. Não vos atemorizeis, nem vos espanteis diante deles, porque o Senhor, vosso Deus, é quem vai convosco; não vos deixará, nem vos desamparará.' - Deuteronômio 31:6",
  "'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.' - Isaías 40:31",
  "'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' - João 3:16",
  "'Portanto, ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo;' - Mateus 28:19",
  "'Eis que estou convosco todos os dias, até a consumação dos séculos.' - Mateus 28:20",
  "'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura os seus interesses, não se ira facilmente, não guarda rancor.' - 1 Coríntios 13:4-5",
  "'Combati o bom combate, terminei a corrida, guardei a fé.' - 2 Timóteo 4:7",
  "'Porque para Deus nada é impossível.' - Lucas 1:37",
  "'Bem-aventurados os puros de coração, porque verão a Deus.' - Mateus 5:8",
  "'Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.' - Filipenses 4:4",
  "'Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.' - 1 Pedro 5:7",
  "'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.' - Jeremias 29:11",
  "'Honra teu pai e tua mãe, para que tenhas longa vida na terra que o Senhor teu Deus te dá.' - Êxodo 20:12"
];

const DEFAULT_GOSPEL = {
  text: 'Naquele tempo, Jesus disse aos seus discípulos... (Evangelho)',
  ref: 'Mateus 5, 13-16',
  vaticanUrl: 'https://www.vaticannews.va/pt/palavra-do-dia.html',
  papasText: ''
};

function WelcomeView({ user, birthdayMessage, aniversariantes = [], onLogout, onVerEscala, onSetView, onSetTab, onUpdateUser, onClearImpersonation, originalUser, slotsDisponiveis, escala, needsPasswordReset, isTab = false, disponibilidadeAberta = false, escalaPublicada = false, paroquiaBloqueada = false, hasSubmitted = false, mesSelecionado, anoSelecionado, unreadCount = 0, showPreAberturaMessage = false, mensagemDisponibilidade = null, onAlert, classicWebMode, onToggleClassicWebMode }: WelcomeViewProps) {
  const isImpersonating = !!originalUser && originalUser.id !== user.id;

  const liturgyColor = useMemo(() => {
    const today = getTodayDateStringForLiturgy();
    const color = getLiturgicalThemeDynamic(today);
    switch (color) {
      case 'purple': return 'purple';
      case 'red': return 'rose';
      case 'white': return 'white';
      case 'green': return 'emerald';
      default: return 'indigo';
    }
  }, []);

  const theme = useMemo(() => {
    switch (liturgyColor) {
      case 'purple': return { 
        bg: 'bg-purple-50/50', 
        border: 'border-purple-100/80', 
        text950: 'text-purple-950', 
        text700: 'text-purple-700', 
        text600: 'text-purple-600', 
        text500: 'text-purple-500', 
        iconBg: 'bg-purple-100/70', 
        pillBg: 'bg-purple-100/50', 
        pillBorder: 'border-purple-200/50', 
        cardBg: 'bg-white/80'
      };
      case 'rose': return { 
        bg: 'bg-rose-50/50', 
        border: 'border-rose-100/80', 
        text950: 'text-rose-950', 
        text700: 'text-rose-700', 
        text600: 'text-rose-600', 
        text500: 'text-rose-500', 
        iconBg: 'bg-rose-100/70', 
        pillBg: 'bg-rose-100/50', 
        pillBorder: 'border-rose-200/50', 
        cardBg: 'bg-white/80'
      };
      case 'white': return { 
        bg: 'bg-slate-50/50', 
        border: 'border-slate-200/80', 
        text950: 'text-slate-950', 
        text700: 'text-slate-700', 
        text600: 'text-slate-600', 
        text500: 'text-slate-500', 
        iconBg: 'bg-slate-200/70', 
        pillBg: 'bg-slate-100/50', 
        pillBorder: 'border-slate-300/50', 
        cardBg: 'bg-white/80'
      };
      default: return { 
        bg: 'bg-emerald-50/50', 
        border: 'border-emerald-100/80', 
        text950: 'text-emerald-950', 
        text700: 'text-emerald-700', 
        text600: 'text-emerald-600', 
        text500: 'text-emerald-500', 
        iconBg: 'bg-emerald-100/70', 
        pillBg: 'bg-emerald-100/50', 
        pillBorder: 'border-emerald-200/50', 
        cardBg: 'bg-white/80'
      };
    }
  }, [liturgyColor]);

  const [currentVerse, setCurrentVerse] = useState('');
  const [dailyGospel, setDailyGospel] = useState(DEFAULT_GOSPEL);
  const [vigilGospel, setVigilGospel] = useState<typeof DEFAULT_GOSPEL | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [weekendAssignments, setWeekendAssignments] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [showWeekendReminder, setShowWeekendReminder] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [ministerPontualidade, setMinisterPontualidade] = useState<number>(100);
  const [submittedReportKeys, setSubmittedReportKeys] = useState<string[]>([]);
  const [selectedLiderAssign, setSelectedLiderAssign] = useState<any>(null);

  const myLeaderAssignments = useMemo(() => {
    return myAssignments.filter((assign) => {
      const liderName = assign.lider || "";
      if (!liderName || liderName === "Não definido" || liderName === "Líder da Missa" || liderName === "Coordenação") return false;
      const ministros = Array.isArray(assign.ministros) ? assign.ministros : [];
      return isMinisterLiderForUser(assign.lider, user, ministros);
    });
  }, [user, myAssignments]);

  const activeLeaderAssignment = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Filter my leader assignments that are NOT submitted yet
    const unsubmittedLeaderAssignments = myLeaderAssignments.filter((assign) => {
      const key = `${assign.date}_${assign.time || assign.horario}`;
      return !submittedReportKeys.includes(key);
    });

    const eligibleAssignments = unsubmittedLeaderAssignments.filter((assign) => {
      const parts = assign.date.split("-");
      if (parts.length !== 3) return false;
      const assignDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      assignDate.setHours(0, 0, 0, 0);
      const diffInDays = Math.round((assignDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Appears 2 days before (diffInDays <= 2) and disappears 2 days after (diffInDays >= -2)
      return diffInDays >= -2 && diffInDays <= 2;
    });

    // If there is any eligible assignment, we take the earliest one (exactly one!)
    if (eligibleAssignments.length > 0) {
      return eligibleAssignments[0];
    }

    return null;
  }, [myLeaderAssignments, submittedReportKeys]);

  const isLiderUser = useMemo(() => {
    if (!user) return false;
    // 1. Check profile flags - only registered leaders or coordination can be leader users
    const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    if (isLoggedAsConjuge) {
      return Boolean(user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');
    } else {
      return Boolean(user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');
    }
  }, [user]);

  // Real-time discreet clock state
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

  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [readEventIds, setReadEventIds] = useState<string[]>(() => {
    try {
      const userKey = user?.id || user?.telefone || 'guest';
      return JSON.parse(localStorage.getItem(`read_events_${userKey}`) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleEventsReadUpdate = () => {
      try {
        const userKey = user?.id || user?.telefone || 'guest';
        setReadEventIds(JSON.parse(localStorage.getItem(`read_events_${userKey}`) || '[]'));
      } catch {
        // ignore
      }
    };
    window.addEventListener('events_read_updated', handleEventsReadUpdate);
    window.addEventListener('storage', handleEventsReadUpdate);
    return () => {
      window.removeEventListener('events_read_updated', handleEventsReadUpdate);
      window.removeEventListener('storage', handleEventsReadUpdate);
    };
  }, [user?.id, user?.telefone]);

  useEffect(() => {
    if (user && user.paroquia) {
      safeFetchJson<any[]>(`/api/eventos?paroquia=${encodeURIComponent(user.paroquia)}`, undefined, [])
        .then(data => {
          if (Array.isArray(data)) {
            setCustomEvents(data);
          }
        })
        .catch(err => console.error('Erro ao buscar eventos em WelcomeView:', err));

      safeFetchJson<any[]>(`/api/relatorios-lider?paroquia=${encodeURIComponent(user.paroquia)}`, undefined, [])
        .then(data => {
          if (Array.isArray(data)) {
            const keys = data.map((r: any) => `${r.data}_${r.horario}`);
            setSubmittedReportKeys(keys);
          }
        })
        .catch(err => console.error('Erro ao buscar relatórios enviados em WelcomeView:', err));
    }
  }, [user?.paroquia]);

  const handleReportSubmitted = (dateStr: string, timeStr: string) => {
    const key = `${dateStr}_${timeStr}`;
    setSubmittedReportKeys(prev => prev.includes(key) ? prev : [...prev, key]);
  };

  const upcomingEvents = useMemo(() => {
    if (!customEvents || customEvents.length === 0) return [];
    const now = new Date();
    const isCoord = hasCoordAccess(user) || user?.isTesoureiro;

    return customEvents.filter((evt: any) => {
      if (!evt.data) return false;

      // Check if it is an admin agenda event - only show to coordination users
      if (evt.criadoPorAdmin && !hasCoordAccess(user)) return false;

      // Check destinatario targeting for non-coordinators
      if (!isCoord && evt.destinatario && evt.destinatario !== 'todos') {
        if (!user) return false;
        
        if (evt.destinatario === 'lideres') {
          if (!isLiderUser) return false;
        } else {
          const uId = String(user.id);
          const uName = (user.nome || user.nomeExibicao || "").toLowerCase();
          
          let matches = false;
          if (evt.alvoIds && Array.isArray(evt.alvoIds) && evt.alvoIds.includes(uId)) {
            matches = true;
          } else if (evt.alvoId && String(evt.alvoId) === uId) {
            matches = true;
          } else if (evt.alvoNomes && Array.isArray(evt.alvoNomes)) {
            matches = evt.alvoNomes.some((n: string) => uName.includes(n.toLowerCase()) || n.toLowerCase().includes(uName));
          } else if (evt.alvoNome && uName) {
            matches = uName.includes(evt.alvoNome.toLowerCase()) || evt.alvoNome.toLowerCase().includes(uName);
          }
          if (!matches) return false;
        }
      }

      const parts = evt.data.split('-').map(Number);
      if (parts.length !== 3) return false;
      const [y, m, d] = parts;

      let eventHour = 23;
      let eventMin = 59;
      if (evt.horario && typeof evt.horario === 'string' && evt.horario.includes(':')) {
        const hParts = evt.horario.split(':').map(Number);
        eventHour = hParts[0] || 0;
        eventMin = hParts[1] || 0;
      }

      const evtDateTime = new Date(y, m - 1, d, eventHour, eventMin, 0);
      const expirationTime = new Date(evtDateTime.getTime() + 2 * 60 * 60 * 1000);

      if (now.getTime() > expirationTime.getTime()) {
        return false;
      }

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const evtDayStart = new Date(y, m - 1, d, 0, 0, 0);
      const diffTime = evtDayStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).sort((a: any, b: any) => a.data.localeCompare(b.data));
  }, [customEvents, user, isLiderUser]);

  const unreadUpcomingEvents = useMemo(() => {
    return upcomingEvents.filter((evt: any) => !readEventIds.includes(evt.id));
  }, [upcomingEvents, readEventIds]);

  const hasUnreadCalendarEvents = unreadUpcomingEvents.length > 0;

  const tutorialSteps = [
    {
      title: "Seja Bem-vindo ao Sistema!",
      description: "Este portal foi criado para facilitar a organização das missas e sua comunicação com a coordenação. Vamos conhecer as principais funcionalidades?",
      icon: <Church className="w-12 h-12 text-blue-600" />,
      color: "blue"
    },
    {
      title: "1. O Seu Painel (Dashboard)",
      description: "Aqui você encontra o Evangelho do dia, mensagens importantes da sua paróquia e um lembrete rápido da sua próxima escala. É o seu ponto de partida diário.",
      icon: <Activity className="w-12 h-12 text-emerald-600" />,
      color: "emerald"
    },
    {
      title: "2. Enviando sua Disponibilidade",
      description: "Na aba 'Disponibilidade', você escolhe os dias que pode servir. Lembre-se da regra: selecione pelo menos duas datas em períodos diferentes (não pode ser apenas um sábado e o domingo seguinte).",
      icon: <Calendar className="w-12 h-12 text-red-600" />,
      color: "red"
    },
    {
      title: "3. Consultando a Escala",
      description: "Após o período de disponibilidade, a coordenação publica a escala oficial. Você poderá ver detalhadamente o horário e a missa em que foi escalado na aba 'Escala'.",
      icon: <CalendarDays className="w-12 h-12 text-liturgy-600" />,
      color: "liturgy"
    },
    {
      title: "4. Mantenha seu Perfil Atualizado",
      description: "Na aba 'Cadastro', você pode atualizar seu telefone, nome de exibição e informações do cônjuge. Manter seus dados em dia é fundamental para a comunicação.",
      icon: <User className="w-12 h-12 text-amber-600" />,
      color: "amber"
    }
  ];

  const hasException = user?.excecaoAcessoAte && new Date(user.excecaoAcessoAte) > new Date();
  const exceptionExpiry = hasException ? new Date(user.excecaoAcessoAte).toLocaleString('pt-BR') : null;

  const aniversariantesHoje = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    return (aniversariantes || []).filter((a: any) => {
      const birthDia = parseInt(a.dia);
      return birthDia === todayDay && a.nome !== user.nome && a.nome !== user.nomeConjuge;
    });
  }, [aniversariantes, user.nome, user.nomeConjuge]);

  const anyBirthdayToday = useMemo(() => {
    const todayDay = new Date().getDate();
    return (aniversariantes || []).filter((a: any) => parseInt(a.dia) === todayDay);
  }, [aniversariantes]);

  const handleAction = async (view: string, tab?: string) => {
    const isCoordenador = hasCoordAccess(user);

    if (paroquiaBloqueada && view === 'disponibilidade' && !isCoordenador) {
      onAlert?.('Acesso Bloqueado', 'Sua paróquia está temporariamente bloqueada. Entre em contato com a coordenação.');
      return;
    }
    
    if (view === 'disponibilidade' && !disponibilidadeAberta && !isCoordenador && !hasException) {
      // Just allow navigation, the Disponibilidade view in App.tsx will show the integrated message
    }
    
    if (isTab && onSetTab && tab) {
      onSetTab(tab);
    } else {
      onSetView(view);
    }
  };

  useEffect(() => {
    if (needsPasswordReset) {
      onSetView('cadastro');
    }

    // Buscar mensagens da paróquia
    if (user && user.paroquia) {
      fetch(`/api/mensagens?paroquia=${encodeURIComponent(user.paroquia)}&type=broadcast&telefone=${encodeURIComponent(user.telefone || '')}`)
        .then(res => {
          if (!res.ok) return [];
          const ct = res.headers.get('content-type');
          if (!ct || !ct.includes('application/json')) return [];
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setMensagens(data);
          }
        })
        .catch(err => console.error('Erro ao buscar mensagens:', err));
    }

    // Buscar pontualidade do ministro
    if (user && user.paroquia) {
      const ministerName = user.isConjugeLogin ? (user.nomeExibicaoConjuge || user.nomeConjuge || user.nome) : (user.nomeExibicao || user.nome);
      fetch(`/api/ministro/pontualidade?telefone=${encodeURIComponent(user.telefone || '')}&paroquia=${encodeURIComponent(user.paroquia)}&nome=${encodeURIComponent(ministerName || '')}&id=${encodeURIComponent(user.id || '')}`)
        .then(res => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type');
          if (!ct || !ct.includes('application/json')) return null;
          return res.json();
        })
        .then(data => {
          if (data && typeof data.pontualidade === 'number') {
            setMinisterPontualidade(data.pontualidade);
          }
        })
        .catch(err => console.error('Erro ao buscar pontualidade do ministro:', err));
    }
    if (user && user.telefone) {
      fetch(`/api/ministros/${encodeURIComponent(user.telefone)}`)
        .then(res => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type');
          if (!ct || !ct.includes('application/json')) return null;
          return res.json();
        })
        .then(data => {
          if (data) {
            if (onUpdateUser && data.excecaoAcessoAte !== user.excecaoAcessoAte) {
              onUpdateUser((prev: any) => {
                const updated = { ...prev, excecaoAcessoAte: data.excecaoAcessoAte };
                sessionStorage.setItem('user', JSON.stringify(updated));
                return updated;
              });
            }
          }
        })
        .catch(err => console.error('Erro ao verificar exceção:', err));
    }
    // Seleciona um versículo aleatório ao carregar
    const randomIndex = Math.floor(Math.random() * BIBLE_VERSES.length);
    setCurrentVerse(BIBLE_VERSES[randomIndex]);

    const normalize = (s: any) => {
      if (typeof s !== 'string') return '';
      let n = s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, ' e ').replace(/\s+/g, ' ').trim();
      if (n.includes(' e ')) {
        n = n.split(' e ').map(x => x.trim()).sort().join(' e ');
      }
      return n;
    };

    const normalizedUserNames = [
        user.nome,
        user.nomeExibicao,
        user.nomeConjuge,
        user.nomeExibicaoConjuge
    ].filter(Boolean).map(normalize);
    
    const allUserNames = [...new Set(normalizedUserNames)];
    const today = new Date();

    // Verificar todas as próximas escalações
    if (escala) {
      const todayReset = new Date(today);
      todayReset.setHours(0, 0, 0, 0);

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
                ...missa
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

      // Filtrar apenas futuras para a lista geral
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
    
    // Fetch daily liturgy
    const isSaturday = today.getDay() === 6;

    // Fetch today's liturgy from Vatican News
    fetch('/api/liturgia')
      .then(res => res.json())
      .then(data => {
        if (data && data.evangelho) {
          setDailyGospel({
            text: data.evangelho.texto || '',
            ref: data.evangelho.referencia || '',
            vaticanUrl: data.evangelho.vaticanUrl || 'https://www.vaticannews.va/pt/palavra-do-dia.html',
            papasText: data.evangelho.papasText || ''
          });
        }
      })
      .catch(err => {
        console.error('Erro ao buscar liturgia do Vatican News:', err);
        setDailyGospel({
          text: 'Não foi possível carregar a liturgia.',
          ref: '',
          papasText: '',
          vaticanUrl: 'https://www.vaticannews.va/pt/palavra-do-dia.html'
        });
      });

  }, [escala, user.nome, user.paroquia]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isTab ? '' : 'bg-slate-50 min-h-screen p-4 sm:p-8'} w-full flex flex-col font-sans pb-20 sm:pb-8`}
    >
      <div className={`${isTab ? '' : 'max-w-6xl mx-auto'} w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* 1. Welcome Banner - Soft & Delicate (Dynamic Liturgical Theme) */}
        <div
          className={`p-4 md:p-5 rounded-2xl shadow-sm border ${
            user.paroquia === "Paróquia Santa Rita de Cássia"
              ? "border-slate-800/20"
              : `${theme.bg} ${theme.border}`
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
              <Church className={`w-32 h-32 ${theme.text600}`} />
            </div>
          )}
          <div className="relative z-10 space-y-1 mb-4 sm:mb-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                user.paroquia === "Paróquia Santa Rita de Cássia"
                  ? "bg-white/10 border-white/20 text-white"
                  : `${theme.pillBg} ${theme.pillBorder} ${theme.text600}`
              }`}
            >
              <Activity className="w-3 h-3" />
              Portal do Ministro
            </div>
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                user.paroquia === "Paróquia Santa Rita de Cássia" ? "text-white" : theme.text950
              }`}
            >
              Olá, {user.isConjugeLogin ? (user.nomeExibicaoConjuge || user.nomeConjuge || '') : (user.nomeExibicao || user.nome || '')}
              {user.tipo === 'casal' && (user.nomeExibicaoConjuge || user.nomeConjuge) ? (
                <span className={`${user.paroquia === "Paróquia Santa Rita de Cássia" ? "text-slate-200" : theme.text700} font-medium italic`}>
                  {" "}
                  & {user.isConjugeLogin ? (user.nomeExibicao || user.nome || '') : (user.nomeExibicaoConjuge || user.nomeConjuge || '')}
                </span>
              ) : (
                ''
              )}
            </h2>
            <p
              className={`text-xs font-medium ${
                user.paroquia === "Paróquia Santa Rita de Cássia" ? "text-slate-300" : `${theme.text700}/80`
              }`}
            >
              Servindo com amor no mês de <strong>{(() => {
                const date = mesSelecionado && anoSelecionado 
                  ? new Date(Number(anoSelecionado), Number(mesSelecionado) - 1) 
                  : new Date();
                const formatted = format(date, "MMMM/yyyy", { locale: ptBR });
                return formatted.charAt(0).toUpperCase() + formatted.slice(1);
              })()}</strong>.
            </p>
            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              {isLiderUser && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  user.paroquia === "Paróquia Santa Rita de Cássia"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  <Flag className="w-3.5 h-3.5" />
                  Responsável pela Missa
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                user.paroquia === "Paróquia Santa Rita de Cássia"
                  ? "bg-white/10 text-emerald-300 border border-white/20"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pontualidade: {ministerPontualidade}%
              </span>
            </div>
          </div>

          {/* Discreet Clock in the bottom-right corner */}
          <div className={`absolute bottom-3 right-4 z-10 flex items-center gap-1.5 text-[10px] font-bold ${
            user.paroquia === "Paróquia Santa Rita de Cássia"
              ? "text-white bg-white/15 border border-white/20 shadow-sm"
              : `${theme.text600} bg-white/80 border ${theme.border || "border-slate-200"} shadow-sm`
          } px-2.5 py-1 rounded-lg backdrop-blur-xs`}>
            <Clock className="w-3 h-3 opacity-80" />
            <span>
              {liveDateTime.weekday}, {liveDateTime.date}
            </span>
          </div>

        </div>

        {birthdayMessage && (
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-xl flex items-center gap-3 text-pink-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎂</span>
            </div>
            <p className="font-bold text-lg leading-tight">{birthdayMessage}</p>
          </div>
        )}

        {/* Pre Abertura Alert */}
        {showPreAberturaMessage && !disponibilidadeAberta && (
          <div className="mb-6 p-4 bg-liturgy-50 border border-liturgy-200 rounded-xl flex items-center gap-3 text-liturgy-800 shadow-sm">
            <Info className="w-6 h-6 text-liturgy-600 flex-shrink-0" />
            <p className="font-bold text-lg leading-tight">A disponibilidade será aberta em breve.</p>
          </div>
        )}

        {mensagemDisponibilidade && (
          <div className={`mb-6 p-4 border rounded-xl flex items-center gap-3 shadow-sm ${
            mensagemDisponibilidade.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            mensagemDisponibilidade.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            mensagemDisponibilidade.tipo === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex-shrink-0">
              {mensagemDisponibilidade.tipo === 'success' ? (
                <Check className="w-6 h-6 text-emerald-600" />
              ) : mensagemDisponibilidade.tipo === 'warning' || mensagemDisponibilidade.tipo === 'error' ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : (
                <Info className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <p className="font-bold text-lg leading-tight">{mensagemDisponibilidade.texto}</p>
          </div>
        )}

        {/* Alerts Section */}
        <div className="space-y-4">
          {user.cadastroCompleto === false && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4 text-blue-900 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm font-medium">Seu cadastro está incompleto. Deseja atualizar agora?</p>
              </div>
              <button 
                onClick={() => isTab && onSetTab ? onSetTab('editar') : onSetView('cadastro')}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Completar Perfil
              </button>
            </div>
          )}

          {hasException && (
            <div className="p-4 bg-liturgy-50 border border-liturgy-200 rounded-2xl flex items-center gap-3 text-liturgy-900 shadow-sm border-l-4 border-l-liturgy-500">
              <Unlock className="w-5 h-5 text-liturgy-600 flex-shrink-0" />
              <p className="text-sm font-medium">
                <strong>Acesso Liberado:</strong> Você pode enviar sua disponibilidade até {exceptionExpiry}.
              </p>
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex flex-col gap-3 shadow-sm border-l-4 border-l-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-950">
                  <CalendarDays className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">
                      Aviso de Reunião / Formação / Evento
                    </p>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      Agendado pela coordenação para os próximos dias
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAction("home", "calendario")}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Ver Calendário
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {upcomingEvents.map((evt: any) => {
                  const isUnread = !readEventIds.includes(evt.id);
                  const parts = evt.data.split('-').map(Number);
                  const formattedDate = parts.length === 3 ? `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}/${parts[0]}` : evt.data;
                  const tipoLabel = evt.tipo === 'formacao' ? 'Formação' : evt.tipo === 'retiro' ? 'Retiro' : evt.tipo === 'evento' ? 'Evento' : 'Reunião';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleAction("home", "calendario")}
                      className="p-3 bg-white/90 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 transition-all shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            {tipoLabel}
                          </span>
                          <span className="text-xs font-black text-slate-800 truncate">
                            {evt.titulo}
                          </span>
                          {isUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0" title="Não visualizado" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-3">
                          <span>🗓️ {formattedDate}</span>
                          {evt.horario && <span>⏰ {evt.horario}</span>}
                        </p>
                        {evt.descricao && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {evt.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold">
                        <span>Ver</span>
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Quick Actions removed by user request (no balloons) */}

        {/* 4. Main Dashboard Feed */}
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              

              {/* Section for Upcoming Weekend Schedules (3 days before) */}
              {showWeekendReminder && weekendAssignments.length > 0 ? (
                <div className={`p-4 md:p-5 ${theme.bg} border ${theme.border} rounded-2xl shadow-sm relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Calendar className={`w-32 h-32 ${theme.text600}`} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-8 h-8 ${theme.iconBg} ${theme.text600} rounded-lg flex items-center justify-center`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                         <h3 className={`text-sm font-black ${theme.text950} uppercase tracking-widest leading-none`}>Próximos Agendamentos</h3>
                         <p className={`text-[10px] ${theme.text700}/80 font-bold uppercase mt-1`}>Fique atento à sua escala</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 mt-4">
                      {weekendAssignments.map((assign, idx) => {
                        const dateObj = new Date(assign.date + 'T00:00:00');
                        const dayNum = dateObj.getDate();
                        const weekdays = [
                          'Domingo',
                          'Segunda-feira',
                          'Terça-feira',
                          'Quarta-feira',
                          'Quinta-feira',
                          'Sexta-feira',
                          'Sábado'
                        ];
                        const fullWeekday = weekdays[dateObj.getDay()];

                        return (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/80 shadow-sm transition-all hover:bg-white">
                            <div className={`${theme.bg} ${theme.text700} w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center flex-shrink-0 border ${theme.pillBorder} shadow-sm px-2`}>
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 opacity-70">Dia</span>
                              <span className="text-xl font-black leading-none">{dayNum}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-base font-black ${theme.text950} leading-tight truncate`}>
                                {fullWeekday}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                                <span className={`font-black ${theme.text600} bg-stone-100 flex items-center gap-1 px-2 py-0.5 rounded-lg border border-stone-200/30`}>
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                  Horário: {assign.time || assign.horario}
                                </span>
                                <span className="text-slate-500 font-medium truncate max-w-[150px] sm:max-w-none">
                                  {assign.nome || 'Missa'}
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
                <div className={`${theme.bg}/30 rounded-2xl border border-dashed ${theme.border}/60 p-8 flex flex-col items-center justify-center text-center`}>
                  <Calendar className={`w-10 h-10 ${theme.text600} opacity-20 mb-3`} />
                  <p className={`font-bold text-xs ${theme.text600}/60 uppercase tracking-widest`}>Nenhum agendamento para os próximos dias.</p>
                </div>
              )}

              {/* Grid of Menu Icon Buttons like the Photo */}
              <div className="mt-8 border-t border-slate-200/60 pt-6">
                <div className="text-center sm:text-left mb-6">
                  <h3 className={`text-xs font-black ${theme.text600} uppercase tracking-widest`}>
                    Serviços e Atalhos
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    Acesse as funcionalidades do seu portal
                  </p>
                </div>

                <div className={`grid ${classicWebMode ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'} gap-2 sm:gap-3`}>
                    {(() => {
                      const menuItems = [
                        {
                          id: "calendario",
                          label: "Calendário Litúrgico",
                          subtitle: "Leituras e cores",
                          icon: CalendarDays,
                          badge: hasUnreadCalendarEvents ? unreadUpcomingEvents.length : 0,
                        },
                        {
                          id: "como_usar",
                          label: "Como Usar",
                          subtitle: "Guia do sistema",
                          icon: HelpCircle,
                          badge: 0,
                        },
                        {
                          id: "comunhao",
                          label: "Comunhão",
                          subtitle: "Reg. de comunhão",
                          icon: Heart,
                          badge: 0,
                        },
                        {
                          id: "disponibilidade",
                          label: "Disponibilidade",
                          subtitle: "Enviar datas",
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
                          id: "aniversariantes",
                          label: "Aniversariantes",
                          subtitle: "Aniversariantes do mês",
                          icon: Gift,
                          badge: 0,
                        },
                        {
                          id: "mensagem",
                          label: "Mensagens",
                          subtitle: "Falar com coord.",
                          icon: MessageSquare,
                          badge: unreadCount,
                        },
                        {
                          id: "editar",
                          label: "Meu Perfil",
                          subtitle: "Seus dados",
                          icon: Settings,
                          badge: 0,
                        },
                        {
                          id: "enfermos",
                          label: "Rito de Enfermos",
                          subtitle: "Visita e Comunhão",
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
                          subtitle: "Gerenciar trocas",
                          icon: RefreshCw,
                          badge: 0,
                        },
                        ...(isLiderUser ? [{
                          id: "lider_painel",
                          label: "Responsável pela Missa",
                          subtitle: "Relatórios",
                          icon: Flag,
                          badge: activeLeaderAssignment ? 1 : 0,
                        }] : []),
                        ...(user.isTesoureiro || hasCoordAccess(user) ? [{
                          id: "financeiro",
                          label: "Tesouraria",
                          subtitle: "Gestão Financeira",
                          icon: DollarSign,
                          badge: 0,
                        }] : []),
                        ...(hasCoordAccess(user) ? [{
                          id: "faltas",
                          label: "Faltas",
                          subtitle: "Ranking e ausências",
                          icon: UserX,
                          badge: 0,
                        }] : []),
                        ...((user.paroquia === "Paróquia Santa Rita de Cássia" || user.paroquia?.toLowerCase().includes("santa rita")) ? [{
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
                      ];

                      // Always sort menu items alphabetically by label
                      menuItems.sort((a, b) =>
                        a.label.localeCompare(b.label, "pt-BR", {
                          sensitivity: "base",
                        }),
                      );

                      return menuItems;
                    })().map((item) => {
                      const IconComp = item.icon;
                      const isNiverHoje = item.id === "aniversariantes" && anyBirthdayToday.length > 0;
                      const isEscalado = item.id === "escala" && Array.isArray(weekendAssignments) && weekendAssignments.length > 0;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === "como_usar") {
                              setShowTutorial(true);
                              setTutorialStep(0);
                            } else if (item.id === "santo") {
                              if (isTab && onSetTab) {
                                onSetTab("santo");
                              } else {
                                onSetView("santo");
                              }
                            } else if (item.id === "versao_web") {
                              if (onToggleClassicWebMode) {
                                onToggleClassicWebMode(!classicWebMode);
                              }
                            } else if (item.id === "lider_painel") {
                              onSetView("lider_painel");
                            } else {
                              handleAction("home", item.id);
                            }
                          }}
                          className={`group flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-2xl transition-all duration-300 relative border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 aspect-square ${
                            isNiverHoje
                              ? "bg-red-500/10 backdrop-blur-md border-red-300/70 ring-2 ring-red-500/20 shadow-[0_4px_16px_rgba(239,68,68,0.1),inset_0_1px_1px_rgba(255,255,255,0.7)]"
                              : isEscalado
                                ? "bg-red-500/15 backdrop-blur-md border-red-400/80 ring-2 ring-red-500/25 shadow-[0_4px_16px_rgba(239,68,68,0.15),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:bg-red-500/25"
                                : item.id === "versao_web"
                                  ? "bg-white/40 backdrop-blur-md border-slate-200/70 hover:bg-white/60 hover:border-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                  : liturgyColor === "purple"
                                    ? "bg-purple-900/[0.04] backdrop-blur-md border-purple-300/40 hover:bg-purple-900/[0.08] hover:border-purple-400/60 shadow-[0_4px_16px_rgba(147,51,234,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                    : liturgyColor === "rose"
                                      ? "bg-rose-900/[0.04] backdrop-blur-md border-rose-300/40 hover:bg-rose-900/[0.08] hover:border-rose-400/60 shadow-[0_4px_16px_rgba(244,63,94,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                      : liturgyColor === "white"
                                        ? "bg-white/40 backdrop-blur-md border-slate-200/70 hover:bg-white/60 hover:border-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                        : liturgyColor === "emerald"
                                          ? "bg-emerald-900/[0.04] backdrop-blur-md border-emerald-300/40 hover:bg-emerald-900/[0.08] hover:border-emerald-400/60 shadow-[0_4px_16px_rgba(16,185,129,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                                          : "bg-blue-900/[0.04] backdrop-blur-md border-blue-300/40 hover:bg-blue-900/[0.08] hover:border-blue-400/60 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)]"
                          }`}
                        >
                          <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 relative border overflow-hidden ${
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
                                        : liturgyColor === "purple"
                                        ? "bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-purple-200/60 text-purple-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(147,51,234,0.08)]"
                                        : liturgyColor === "rose"
                                          ? "bg-gradient-to-b from-rose-500/20 to-rose-500/5 border-rose-200/60 text-rose-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(244,63,94,0.08)]"
                                          : liturgyColor === "white"
                                            ? "bg-gradient-to-b from-white/90 to-white/40 border-white text-slate-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),0_2px_6px_rgba(0,0,0,0.04)]"
                                            : liturgyColor === "emerald"
                                              ? "bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border-emerald-200/60 text-emerald-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(16,185,129,0.08)]"
                                              : "bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-200/60 text-blue-700 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.85),0_2px_6px_rgba(59,130,246,0.08)]"
                          }`}>
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
                            ) : item.id === "disponibilidade" ? (
                              <img
                                src="/disponibilidade_3d.jpg"
                                alt="Disponibilidade"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            ) : item.id === "editar" ? (
                              <img
                                src="/editar_3d.jpg"
                                alt="Meu Perfil"
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
                            ) : item.id === "faltas" ? (
                              <img
                                src="/faltas_3d.jpg"
                                alt="Faltas"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            ) : item.id === "lider_painel" ? (
                              <img
                                src="/relatorios_3d.jpg"
                                alt="Responsável pela Missa"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md transform scale-125 transition-transform duration-200 group-hover:scale-130 rounded-xl"
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <IconComp className={`w-7 h-7 sm:w-8 sm:h-8 ${isEscalado ? "text-red-600" : ""}`} />
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
                              <span className="text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-center line-clamp-2 px-0.5 text-red-950">
                                {item.label}
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-red-600 font-black mt-1 leading-none uppercase tracking-wider bg-red-100/80 px-1.5 py-0.5 rounded border border-red-200/60">
                                Escalado
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`text-[10px] sm:text-[12px] font-black leading-tight tracking-tight text-center line-clamp-2 px-0.5 ${theme.text950}`}>
                                {item.label}
                              </span>
                              <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-0.5 leading-none">
                                {item.subtitle}
                              </span>
                            </>
                          )}

                          {isNiverHoje ? (
                            <div className="absolute top-3 right-3 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </div>
                          ) : isEscalado ? (
                            <div className="absolute top-2.5 right-2.5 flex items-center justify-center">
                              <span className="relative inline-flex items-center justify-center bg-red-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full shadow-sm">
                                {weekendAssignments && weekendAssignments.length > 0 ? weekendAssignments.length : "✓"}
                              </span>
                            </div>
                          ) : item.badge > 0 ? (
                            <span className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-sm">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

            </div>
          </div>
        </div>

        <div className="flex justify-center pb-8 pt-4">
          <button
            type="button"
            onClick={() => onSetView("privacy")}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3 opacity-50" />
            Política de Privacidade
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-slate-50 border-4 border-slate-100 shadow-inner sm:w-28 sm:h-28`}>
                {tutorialSteps[tutorialStep].icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 sm:text-2xl">{tutorialSteps[tutorialStep].title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed sm:text-base">
                  {tutorialSteps[tutorialStep].description}
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2 py-2">
                {tutorialSteps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === tutorialStep ? 'w-8 bg-liturgy-600' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
              <button 
                onClick={() => tutorialStep > 0 ? setTutorialStep(prev => prev - 1) : setShowTutorial(false)}
                className="px-6 py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all"
              >
                {tutorialStep === 0 ? 'Pular' : 'Anterior'}
              </button>
              
              <button 
                onClick={() => {
                  if (tutorialStep < tutorialSteps.length - 1) {
                    setTutorialStep(prev => prev + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
                className={`px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 flex items-center gap-2 ${tutorialStep === tutorialSteps.length - 1 ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' : 'bg-liturgy-600 text-black shadow-liturgy-100 hover:bg-liturgy-700'}`}
              >
                {tutorialStep === tutorialSteps.length - 1 ? 'Finalizar Tutorial' : 'Próxima'}
                {tutorialStep < tutorialSteps.length - 1 && <ChevronLeft className="w-4 h-4 rotate-180" />}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}

export default WelcomeView;
