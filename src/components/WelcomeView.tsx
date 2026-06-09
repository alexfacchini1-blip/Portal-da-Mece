import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Info, CalendarDays, Calendar, LogOut, Check, ChevronLeft, BookOpen, Heart, Sun, Cross, Users, Settings, Lock, Unlock, Clock, Church, RefreshCw, AlertCircle, Activity, Gift, X, Minus, Plus } from 'lucide-react';
import { getLiturgicalThemeDynamic } from '../utils/calendario';

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
  vaticanUrl: '',
  papasText: ''
};

function WelcomeView({ user, birthdayMessage, aniversariantes = [], onLogout, onVerEscala, onSetView, onSetTab, onUpdateUser, onClearImpersonation, originalUser, slotsDisponiveis, escala, needsPasswordReset, isTab = false, disponibilidadeAberta = false, escalaPublicada = false, paroquiaBloqueada = false, hasSubmitted = false, mesSelecionado, anoSelecionado, unreadCount = 0, showPreAberturaMessage = false, mensagemDisponibilidade = null, onAlert }: WelcomeViewProps) {
  const isImpersonating = !!originalUser && originalUser.id !== user.id;

  const liturgyColor = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
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
  const [showGospelModal, setShowGospelModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [fontScale, setFontScale] = useState(1);

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
    const today = new Date().getDate();
    return aniversariantes.filter((a: any) => a.dia === today && a.nome !== user.nome && a.nome !== user.nomeConjuge);
  }, [aniversariantes, user.nome, user.nomeConjuge]);

  const handleAction = async (view: string, tab?: string) => {
    const isCoordenador = user?.role === 'admin' || user?.role === 'coordenador' || user?.role === 'coordenacao';

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
          if (!res.ok) throw new Error('Falha ao buscar mensagens');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setMensagens(data);
          }
        })
        .catch(err => console.error('Erro ao buscar mensagens:', err));
    }

    // Verificar exceção de acesso
    if (user && user.telefone) {
      fetch(`/api/ministros/${encodeURIComponent(user.telefone)}`)
        .then(res => res.json())
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
        const assignmentDate = new Date(dateStr + 'T00:00:00');
        if (assignmentDate >= todayReset) {
          Object.entries(missas).forEach(([time, missa]: [string, any]) => {
            const ministros = missa.ministros || [];
            const matchedName = ministros.find((m: string) => {
              const normalizedM = normalize(m);
              
              return allUserNames.some(userName => {
                // 1. Exact match
                if (normalizedM === userName) return true;
                
                // 2. Split schedule into parts (for couples like "Osvaldo e Maria")
                const mParts = normalizedM.split(' e ').map(p => p.trim()).filter(Boolean);
                
                // If any part of the schedule matches any of the user's names exactly
                return mParts.some(mp => allUserNames.includes(mp));
              });
            });

            if (matchedName) {
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

      // Lógica do Lembrete: Mostrar somente escalações de final de semana, 3 dias antes da missa
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const reminderAssignments = allFoundAssignments.filter(assign => {
        const assignDate = new Date(assign.date + 'T00:00:00');
        const diffInTime = assignDate.getTime() - todayStart.getTime();
        const diffInDays = Math.round(diffInTime / (1000 * 60 * 60 * 24));
        
        // Verifica se é final de semana (Sexta=5, Sábado=6, Domingo=0)
        const dayOfWeek = assignDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
        
        // Retorna verdadeiro se for final de semana e estiver dentro do intervalo de 3 dias (ou hoje)
        return isWeekend && diffInDays >= 0 && diffInDays <= 3;
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

    // Fetch today's liturgy
    fetch('/api/liturgia')
      .then(res => {
        if (!res.ok) return { evangelho: { texto: 'Liturgia indisponível', referencia: '', papasText: '' } };
        return res.json();
      })
      .then(data => {
        if (data && data.evangelho) {
          setDailyGospel({
            text: data.evangelho.texto || '',
            ref: data.evangelho.referencia || '',
            vaticanUrl: data.evangelho.vaticanUrl || '',
            papasText: data.evangelho.papasText || ''
          });
        }
      })
      .catch(err => {
        console.error('Erro ao buscar liturgia diária:', err);
        setDailyGospel({ text: 'Não foi possível carregar a liturgia.', ref: '', papasText: '', vaticanUrl: '' });
      });

    // If Saturday, fetch tomorrow's liturgy (Vigil)
    if (isSaturday) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayStr = tomorrow.getDate().toString().padStart(2, '0');
      const monthStr = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const dateParam = `${dayStr}-${monthStr}`;

      fetch(`/api/liturgia?date=${dateParam}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch vigil liturgy');
          return res.json();
        })
        .then(data => {
          if (data && data.evangelho) {
            setVigilGospel({
              text: data.evangelho.texto || '',
              ref: data.evangelho.referencia || '',
              vaticanUrl: data.evangelho.vaticanUrl || '',
              papasText: data.evangelho.papasText || ''
            });
          }
        })
        .catch(err => {
          console.error('Erro ao buscar liturgia da vigília:', err);
        });
    } else {
      setVigilGospel(null);
    }

  }, [escala, user.nome, user.paroquia]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isTab ? '' : 'bg-slate-50 min-h-screen p-4 sm:p-8'} w-full flex flex-col font-sans pb-20 sm:pb-8`}
    >
      <div className={`${isTab ? '' : 'max-w-6xl mx-auto'} w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* 1. Welcome Banner - Soft & Delicate (Dynamic Liturgical Theme) */}
        <div className={`${theme.bg} p-4 md:p-5 rounded-2xl shadow-sm border ${theme.border} text-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Church className={`w-32 h-32 ${theme.text600}`} />
          </div>
          <div className="relative z-10 space-y-1 mb-4 sm:mb-0">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 ${theme.pillBg} rounded-full border ${theme.pillBorder} text-[9px] font-black uppercase tracking-widest ${theme.text600}`}>
              <Activity className="w-3 h-3" />
              Portal do Ministro
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme.text950}`}>
              Olá, {(user.nomeExibicao || user.nome || '').split(' ')[0]}
              {user.tipo === 'casal' && (user.nomeExibicaoConjuge || user.nomeConjuge) ? <span className={`${theme.text700} font-medium italic`}> & {(user.nomeExibicaoConjuge || user.nomeConjuge || '').split(' ')[0]}</span> : ''}
            </h2>
            <p className={`${theme.text700}/80 text-xs font-medium`}>Servindo com amor no mês de <strong>{format(new Date(), "MMMM", { locale: ptBR })}</strong>.</p>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2">
            <button 
              onClick={() => { setShowTutorial(true); setTutorialStep(0); }}
              className={`bg-white/80 backdrop-blur-sm shadow-sm border ${theme.pillBorder} px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all group/btn mb-2 sm:mb-0`}
            >
              <BookOpen className={`w-4 h-4 ${theme.text600}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text700}`}>Como usar o sistema?</span>
            </button>
            <div className={`bg-white/80 backdrop-blur-sm shadow-sm border ${theme.pillBorder} px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[120px]`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${theme.text500} mb-0.5`}>Mês de Referência</p>
              <p className={`text-sm font-black ${theme.text700}`}>{format(new Date(), "MMMM / yyyy", { locale: ptBR })}</p>
            </div>
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

        {/* Featured Gospel Card - Compact and Dynamic */} 
        <div 
          onClick={() => setShowGospelModal(true)}
          className={`relative overflow-hidden ${theme.bg} p-5 sm:p-6 rounded-3xl shadow-sm border ${theme.border} cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 group flex flex-col`}
        >
          {/* Decorative subtle element */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none`}></div>

          <div className="flex items-start sm:items-center justify-between gap-4 relative z-10 w-full">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${theme.iconBg} ${theme.text600} rounded-xl flex items-center justify-center shadow-inner border border-white/50 flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[9px] font-black ${theme.text600} uppercase tracking-[0.2em] leading-tight`}>Evangelho do Dia</p>
                    {vigilGospel && (
                       <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-200">
                         Vigília
                       </span>
                    )}
                  </div>
                  <h3 className={`text-lg sm:text-xl font-display font-black ${theme.text950} tracking-tight`}>
                    {(vigilGospel || dailyGospel).ref || 'Carregando...'}
                  </h3>
                </div>
             </div>
             <div className={`hidden sm:flex w-8 h-8 rounded-full ${theme.iconBg} items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors`}>
                <ChevronLeft className={`w-4 h-4 ${theme.text600} rotate-180`} />
             </div>
          </div>
          
          <div className="mt-4 relative z-10">
            <p className={`text-sm sm:text-base font-serif italic ${theme.text700} leading-relaxed line-clamp-2 opacity-90`}>
              "{(vigilGospel || dailyGospel).text.split('\n\n')[0].substring(0, 150)}..."
            </p>
          </div>
        </div>

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

          {aniversariantesHoje.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-3 shadow-sm border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 text-amber-900">
                <Gift className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm font-bold">Aniversariantes do Dia na Paróquia</p>
              </div>
              <div className="space-y-2">
                {aniversariantesHoje.map((a: any, index: number) => (
                  <div key={index} className="flex items-center justify-between gap-2 bg-white/60 p-3 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-xs font-black text-slate-800">{a.nome}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                        {a.tipo} • <span className="text-amber-700 italic">Deseje a ele um feliz aniversário!</span>
                      </p>
                    </div>
                  </div>
                ))}
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
            </div>
          </div>
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

      {/* Improved & Compact Gospel Modal */}
      {showGospelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#fcfaf7] w-full max-w-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] border border-stone-200"
          >
            {/* Modal Header - Editorial Style Compact */}
            <div className="px-6 py-5 sm:py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${theme.iconBg} ${theme.text600} rounded-xl flex items-center justify-center shadow-sm border ${theme.border}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-stone-900 text-xl sm:text-2xl tracking-tight">Santo Evangelho</h3>
                    {vigilGospel && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-200">
                        Vigília
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${theme.text500}/40`}></span>
                    {(() => {
                      const now = new Date();
                      const isSaturdayAfternoon = now.getDay() === 6 && now.getHours() >= 17;
                      return (isSaturdayAfternoon && vigilGospel) ? vigilGospel.ref : dailyGospel.ref;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 mr-2">
                  <button 
                    onClick={() => setFontScale(prev => Math.max(0.7, prev - 0.15))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors text-stone-500 hover:text-stone-700 shadow-sm border border-transparent hover:border-stone-200"
                    title="Diminuir texto"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-stone-200" />
                  <button 
                    onClick={() => setFontScale(prev => Math.min(2.5, prev + 0.15))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors text-stone-500 hover:text-stone-700 shadow-sm border border-transparent hover:border-stone-200"
                    title="Aumentar texto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => setShowGospelModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-stone-400 hover:text-stone-600 hover:shadow-sm border border-transparent hover:border-stone-200"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180 sm:rotate-0" />
                </button>
              </div>
            </div>

            {/* Modal Body - Book Layout Compact */}
            <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar flex-1 bg-white/40">
              <div 
                className="max-w-prose mx-auto"
                style={{ fontSize: `${fontScale}rem`, lineHeight: 1.6 }}
              >
                <div className="font-serif text-slate-800 space-y-6">
                  {(() => {
                    const now = new Date();
                    const isSaturdayAfternoon = now.getDay() === 6 && now.getHours() >= 17;
                    const text = (isSaturdayAfternoon && vigilGospel) ? vigilGospel.text : dailyGospel.text;
                    
                    if (!text || text.includes('Carregando')) {
                      return <div className="flex flex-col items-center justify-center py-16 text-stone-300 italic">
                        <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                        Carregando a Palavra...
                      </div>;
                    }

                    return text.split('\n\n').map((paragraph, i) => {
                      const cleanParagraph = paragraph.trim();
                      if (!cleanParagraph) return null;

                      // Only drop cap for the first paragraph
                      if (i === 0) {
                        const firstChar = cleanParagraph[0];
                        const restOfText = cleanParagraph.slice(1);
                        return (
                          <p key={i} className="relative">
                            <span className={`text-5xl sm:text-6xl font-display font-black mr-3 float-left leading-[0.85] ${theme.text600} opacity-80 pt-1`}>
                              {firstChar}
                            </span>
                            {restOfText}
                          </p>
                        );
                      }
                      return <p key={i} className="font-serif text-slate-800 mb-6">{cleanParagraph}</p>;
                    });
                  })()}
                </div>
                
                <div className="mt-12 pt-8 border-t border-stone-100 flex flex-col items-center">
                  <div className="w-10 h-px bg-stone-200 mb-6" />
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-[0.3em] mb-1.5">Palavra da Salvação</p>
                  <p className={`text-base ${theme.text700} font-display font-black uppercase tracking-tight`}>Glória a vós, Senhor</p>
                </div>
                
                {(() => {
                  const now = new Date();
                  const isSaturdayAfternoon = now.getDay() === 6 && now.getHours() >= 17;
                  const papasText = (isSaturdayAfternoon && vigilGospel) ? vigilGospel.papasText : dailyGospel.papasText;
                  
                  if (papasText) {
                    return (
                      <div className="mt-16 p-6 sm:p-8 rounded-[1.5rem] bg-stone-50/80 border border-stone-100 shadow-inner relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                            <Church className="w-24 h-24" />
                         </div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${theme.iconBg} ${theme.text700} rounded-lg flex items-center justify-center`}>
                              <Heart className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-display font-bold text-stone-800 italic">O Pensamento do Papa</h3>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-stone-200/50 rounded-lg p-0.5">
                            <button 
                              onClick={() => setFontScale(prev => Math.max(0.7, prev - 0.15))}
                              className="p-1 hover:bg-white rounded-md transition-colors text-stone-500 hover:text-stone-700"
                              title="Diminuir texto"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => setFontScale(prev => Math.min(2.5, prev + 0.15))}
                              className="p-1 hover:bg-white rounded-md transition-colors text-stone-500 hover:text-stone-700"
                              title="Aumentar texto"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div 
                          className="font-serif text-stone-600 italic leading-relaxed space-y-4"
                          style={{ fontSize: `${fontScale}rem` }}
                        >
                          {papasText.split('\n\n').map((paragraph, i) => (
                            <p key={i}>{paragraph.trim()}</p>
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
            <div className="p-6 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-center gap-5">
              {(() => {
                const now = new Date();
                const isSaturdayAfternoon = now.getDay() === 6 && now.getHours() >= 17;
                const vaticanUrl = (isSaturdayAfternoon && vigilGospel) ? vigilGospel.vaticanUrl : dailyGospel.vaticanUrl;
                if (vaticanUrl) return (
                  <a 
                    href={vaticanUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-100 transition-all shadow-sm flex items-center gap-2.5"
                  >
                    <div className={`w-6 h-6 ${theme.iconBg} ${theme.text600} rounded-md flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
                style={{ backgroundColor: `var(--color-${liturgyColor === 'white' ? 'slate' : (liturgyColor === 'rose' ? 'rose' : (liturgyColor === 'emerald' ? 'emerald' : liturgyColor))}-600)` }}
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
    </motion.div>
  );
}

export default WelcomeView;
