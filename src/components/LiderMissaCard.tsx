import React, { useState, useEffect } from "react";
import { Flag, Check, X, Package, MessageSquare, Send, ShieldCheck, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { 
  isMinisterLeader, 
  isMinisterLiderForUser, 
  normalizeMinisterText,
  ITENS_ESTOQUE_RELATORIO,
  parseUsoEstoque,
  formatUsoEstoque,
  toTitleCase
} from "../utils";

interface LiderMissaCardProps {
  isPreview?: boolean;
  user: any;
  assign: {
    date: string;
    time?: string;
    horario?: string;
    nome?: string;
    lider?: string;
    ministros?: string[];
    [key: string]: any;
  };
  onAlert?: (msg: string, type?: "success" | "error" | "info") => void;
  onReportSubmitted?: (date: string, time: string) => void;
}

export const LiderMissaCard: React.FC<LiderMissaCardProps> = ({ user, assign, onAlert, onReportSubmitted, isPreview = false }) => {
  const dateStr = assign.date;
  const timeStr = assign.time || assign.horario || "";
  const massName = assign.nome || "Missa";
  const liderName = assign.lider || "";
  const ministrosList = assign.ministros || [];

  const isCoord =
    user?.role === "coordenacao" ||
    user?.role === "vice_coordenacao" ||
    user?.role === "admin";

  const normLid = liderName ? normalizeMinisterText(liderName) : "";
  const celebrationHasDefinedLeader = Boolean(
    normLid &&
    normLid !== "nao definido" &&
    normLid !== "lider da missa" &&
    normLid !== "coordenacao"
  );

  // 1. Is there a leader/responsible with star (⭐) in this celebration?
  const isLeaderStarredInMass = React.useMemo(() => {
    if (!celebrationHasDefinedLeader) return false;
    if (Array.isArray(ministrosList) && ministrosList.length > 0) {
      return ministrosList.some((m: any) => isMinisterLeader(m, liderName));
    }
    return false;
  }, [celebrationHasDefinedLeader, ministrosList, liderName]);

  // 2. Is the current logged in user the leader/responsible of this mass (or coordination)?
  const isCurrentUserLeader = React.useMemo(() => {
    if (isCoord) return true; // Coordination has supervisory access
    if (!celebrationHasDefinedLeader) return false;
    return isMinisterLiderForUser(liderName, user, ministrosList);
  }, [isCoord, celebrationHasDefinedLeader, liderName, user, ministrosList]);

  // The relation of ministers appears if:
  // - The current user is from coordination (supervisory access)
  // - OR the current user is the leader/responsible of this mass
  // - OR the leader is confirmed with star
  const canViewMinistersRelation = isCoord || isCurrentUserLeader || isLeaderStarredInMass;

  const doesMinisterMatchLeader = (minRaw: any, lidRaw: any): boolean => {
    if (!minRaw || !lidRaw) return false;
    const minStr = typeof minRaw === "string" ? minRaw.trim() : (minRaw.nome || minRaw.name || "").trim();
    const lidStr = typeof lidRaw === "string" ? lidRaw.trim() : (lidRaw.nome || lidRaw.name || "").trim();
    if (!minStr || !lidStr) return false;

    if (minStr.toLowerCase() === lidStr.toLowerCase()) return true;
    if (isMinisterLeader(minStr, lidStr)) return true;

    const normMin = normalizeMinisterText(minStr);
    const normLid = normalizeMinisterText(lidStr);
    if (!normMin || !normLid) return false;
    if (normMin === normLid) return true;

    // Check couple tokens (e.g. "Maurício e Juliana" with "Juliana")
    if (normMin.includes(" e ") || normMin.includes(" & ") || normMin.includes(" / ")) {
      const parts = normMin.split(/\s+(?:e|&|\/)\s+/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (p === normLid) return true;
        const tokensP = p.split(/\s+/).filter(Boolean);
        const tokensL = normLid.split(/\s+/).filter(Boolean);
        if (tokensP.length > 0 && tokensL.length > 0 && tokensP[0] === tokensL[0]) return true;
      }
    }

    return false;
  };

  // Team members list includes assigned ministers to check (excluding the leader, who is already confirmed leading the mass)
  const teamMembers = React.useMemo(() => {
    const list: string[] = [];
    const addName = (raw: any) => {
      if (!raw) return;
      const name = typeof raw === "string" ? raw.trim() : (raw.nome || raw.name || "").trim();
      if (!name) return;
      // Exclude the leader/responsible from the checklist
      if (doesMinisterMatchLeader(name, liderName)) return;
      if (!list.includes(name)) {
        list.push(name);
      }
    };

    // First add all ministers scheduled for this mass
    if (Array.isArray(ministrosList)) {
      ministrosList.forEach(addName);
    }

    return list;
  }, [liderName, ministrosList]);

  const [presencas, setPresencas] = useState<{ [key: string]: boolean }>({});
  const [justificativas, setJustificativas] = useState<{ [key: string]: string }>({});
  const [faltaCasalTipo, setFaltaCasalTipo] = useState<{ [key: string]: 'ambos' | 'p1' | 'p2' }>({});
  const [faltaCasalMembro, setFaltaCasalMembro] = useState<{ [key: string]: { p1Faltou: boolean; p2Faltou: boolean } }>({});
  const [expandedCouples, setExpandedCouples] = useState<{ [coupleName: string]: boolean }>({});
  const [trocasNaoRegistradas, setTrocasNaoRegistradas] = useState("");
  const [usoEstoque, setUsoEstoque] = useState("");
  const [selectedEstoqueItems, setSelectedEstoqueItems] = useState<string[]>([]);
  const [outroEstoque, setOutroEstoque] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [semAlteracao, setSemAlteracao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasUserModified, setHasUserModified] = useState(false);

  const faltasCount = React.useMemo(() => {
    return Object.keys(presencas).filter((k) => presencas[k] === false).length;
  }, [presencas]);

  // Determine if there is any information filled in by the leader/responsible
  const hasAnyInformationFilled = React.useMemo(() => {
    const hasFalta = faltasCount > 0;
    const hasTrocas = trocasNaoRegistradas.trim().length > 0;
    const hasEstoque = usoEstoque.trim().length > 0;
    const hasObs = observacoes.trim().length > 0;
    const hasJustificativas = Object.values(justificativas).some((j) => j && j.trim().length > 0);

    return hasFalta || hasTrocas || hasEstoque || hasObs || hasJustificativas;
  }, [faltasCount, trocasNaoRegistradas, usoEstoque, observacoes, justificativas]);

  const isCoupleSlot = (name: string): boolean => {
    const norm = String(name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return norm.includes(' e ') || norm.includes(' & ') || norm.includes(' / ');
  };

  const splitCoupleNames = (name: string): [string, string] => {
    const parts = name.split(/\s+e\s+|\s+&\s+|\s+\/\s+/i).map(p => p.trim()).filter(Boolean);
    return [parts[0] || name, parts[1] || 'Cônjuge'];
  };

  // Initialize all team members as Present by default
  useEffect(() => {
    const initialPresencas: { [key: string]: boolean } = {};
    teamMembers.forEach((m) => {
      initialPresencas[m] = true;
    });
    setPresencas(initialPresencas);

    // Fetch existing report if any
    if (user.paroquia && dateStr && timeStr) {
      fetch(`/api/relatorios-lider?paroquia=${encodeURIComponent(user.paroquia)}&data=${encodeURIComponent(dateStr)}&horario=${encodeURIComponent(timeStr)}`)
        .then((res) => {
          if (!res.ok) return [];
          const ct = res.headers.get("content-type");
          if (!ct || !ct.includes("application/json")) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const report = data[0];
            if (report.presencas) setPresencas(report.presencas);
            if (report.trocasNaoRegistradas) setTrocasNaoRegistradas(report.trocasNaoRegistradas);
            if (report.usoEstoque) {
              setUsoEstoque(report.usoEstoque);
              const parsed = parseUsoEstoque(report.usoEstoque);
              setSelectedEstoqueItems(parsed.selected);
              setOutroEstoque(parsed.outro);
            }
            if (report.observacoes) setObservacoes(report.observacoes);
            if (report.semAlteracao) setSemAlteracao(true);
            if (report.faltasReportadas && Array.isArray(report.faltasReportadas)) {
              const justMap: { [key: string]: string } = {};
              const casalTipoMap: { [key: string]: 'ambos' | 'p1' | 'p2' } = {};
              report.faltasReportadas.forEach((f: any) => {
                if (f.ministroNome) {
                  justMap[f.ministroNome] = f.justificativa || "";
                  if (f.tipoFalta === 'principal') casalTipoMap[f.ministroNome] = 'p1';
                  else if (f.tipoFalta === 'conjuge') casalTipoMap[f.ministroNome] = 'p2';
                  else casalTipoMap[f.ministroNome] = 'ambos';
                }
              });
              setJustificativas(justMap);
              setFaltaCasalTipo(casalTipoMap);
            }
            setIsSaved(true);
            if (report.updatedAt) setLastSavedAt(new Date(report.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
          }
        })
        .catch((err) => console.error("Erro ao carregar relatório do líder:", err));
    }
  }, [dateStr, timeStr, user.paroquia]);

  const handleToggleSemAlteracao = (checked: boolean) => {
    setSemAlteracao(checked);
    setHasUserModified(true);
    setIsSaved(false);

    if (checked) {
      // Confirma que não houve falta, não retirou hóstia/vinho e não há avisos
      const allPresent: { [key: string]: boolean } = {};
      const clearedCasal: { [key: string]: { p1Faltou: boolean; p2Faltou: boolean } } = {};
      teamMembers.forEach((m) => {
        allPresent[m] = true;
        if (isCoupleSlot(m)) {
          clearedCasal[m] = { p1Faltou: false, p2Faltou: false };
        }
      });
      setPresencas(allPresent);
      setFaltaCasalMembro(clearedCasal);
      setJustificativas({});
      setTrocasNaoRegistradas("");
      setUsoEstoque("");
      setSelectedEstoqueItems([]);
      setOutroEstoque("");
      setObservacoes("");
    }
  };

  const togglePresenca = (minName: string, isPresent: boolean) => {
    if (semAlteracao) setSemAlteracao(false);
    setPresencas((prev) => ({ ...prev, [minName]: isPresent }));
    if (!isPresent && isCoupleSlot(minName)) {
      setFaltaCasalTipo((prev) => ({ ...prev, [minName]: 'ambos' }));
      setFaltaCasalMembro((prev) => ({ ...prev, [minName]: { p1Faltou: true, p2Faltou: true } }));
    } else if (isPresent && isCoupleSlot(minName)) {
      setFaltaCasalMembro((prev) => ({ ...prev, [minName]: { p1Faltou: false, p2Faltou: false } }));
    }
    setHasUserModified(true);
    setIsSaved(false);
  };

  const toggleCoupleMember = (minName: string, member: 'p1' | 'p2') => {
    if (semAlteracao) setSemAlteracao(false);
    const current = faltaCasalMembro[minName] || { p1Faltou: false, p2Faltou: false };
    const next = {
      ...current,
      [member === 'p1' ? 'p1Faltou' : 'p2Faltou']: !current[member === 'p1' ? 'p1Faltou' : 'p2Faltou']
    };
    const anyFaltou = next.p1Faltou || next.p2Faltou;
    setPresencas((prev) => ({ ...prev, [minName]: !anyFaltou }));
    let cType: 'ambos' | 'p1' | 'p2' = 'ambos';
    if (next.p1Faltou && next.p2Faltou) cType = 'ambos';
    else if (next.p1Faltou) cType = 'p1';
    else if (next.p2Faltou) cType = 'p2';
    setFaltaCasalTipo((prev) => ({ ...prev, [minName]: cType }));
    setFaltaCasalMembro((prev) => ({ ...prev, [minName]: next }));
    setHasUserModified(true);
    setIsSaved(false);
  };

  const toggleCoupleExpanded = (coupleName: string) => {
    setExpandedCouples(prev => ({ ...prev, [coupleName]: !prev[coupleName] }));
  };

  const setCoupleAttendance = (minName: string, option: 'ambos_presentes' | 'so_p1' | 'so_p2' | 'ambos_faltaram') => {
    if (semAlteracao) setSemAlteracao(false);
    let next = { p1Faltou: false, p2Faltou: false };
    let isPres = true;
    let cType: 'ambos' | 'p1' | 'p2' = 'ambos';

    if (option === 'ambos_presentes') {
      next = { p1Faltou: false, p2Faltou: false };
      isPres = true;
    } else if (option === 'so_p1') {
      // Só cônjuge 1 esteve presente (cônjuge 2 faltou)
      next = { p1Faltou: false, p2Faltou: true };
      isPres = false;
      cType = 'p2';
    } else if (option === 'so_p2') {
      // Só cônjuge 2 esteve presente (cônjuge 1 faltou)
      next = { p1Faltou: true, p2Faltou: false };
      isPres = false;
      cType = 'p1';
    } else if (option === 'ambos_faltaram') {
      next = { p1Faltou: true, p2Faltou: true };
      isPres = false;
      cType = 'ambos';
    }

    setPresencas((prev) => ({ ...prev, [minName]: isPres }));
    setFaltaCasalTipo((prev) => ({ ...prev, [minName]: cType }));
    setFaltaCasalMembro((prev) => ({ ...prev, [minName]: next }));
    setHasUserModified(true);
    setIsSaved(false);
  };

  const handleJustificativaChange = (minName: string, val: string) => {
    if (semAlteracao) setSemAlteracao(false);
    setJustificativas((prev) => ({ ...prev, [minName]: val }));
    setHasUserModified(true);
    setIsSaved(false);
  };

  const toggleEstoqueItem = (item: string) => {
    if (semAlteracao) setSemAlteracao(false);
    const next = selectedEstoqueItems.includes(item)
      ? selectedEstoqueItems.filter((i) => i !== item)
      : [...selectedEstoqueItems, item];
    setSelectedEstoqueItems(next);
    const formatted = formatUsoEstoque(next, outroEstoque);
    setUsoEstoque(formatted);
    setHasUserModified(true);
    setIsSaved(false);
  };

  const handleOutroEstoqueChange = (val: string) => {
    if (semAlteracao) setSemAlteracao(false);
    setOutroEstoque(val);
    const formatted = formatUsoEstoque(selectedEstoqueItems, val);
    setUsoEstoque(formatted);
    setHasUserModified(true);
    setIsSaved(false);
  };

  const handleSubmitRelatorio = async () => {
    setLoading(true);
    try {
      const faltasReportadas = Object.keys(presencas)
        .filter((mName) => presencas[mName] === false)
        .map((mName) => {
          const isCouple = isCoupleSlot(mName);
          const cType = faltaCasalTipo[mName] || 'ambos';
          const [p1, p2] = splitCoupleNames(mName);

          let finalName = mName;
          let qtd = 1;
          let tipoFalta = 'individual';

          if (isCouple) {
            if (cType === 'ambos') {
              finalName = `${p1} e ${p2}`;
              qtd = 2;
              tipoFalta = 'ambos';
            } else if (cType === 'p1') {
              finalName = p1;
              qtd = 1;
              tipoFalta = 'principal';
            } else {
              finalName = p2;
              qtd = 1;
              tipoFalta = 'conjuge';
            }
          }

          return {
            ministroNome: finalName,
            quantidade: qtd,
            tipoFalta,
            justificativa: justificativas[mName] || "Falta informada pelo Responsável pela Missa",
          };
        });

      const payload = {
        paroquia: user.paroquia,
        data: dateStr,
        horario: timeStr,
        liderNome: liderName || user.nome,
        presencas,
        faltasReportadas,
        trocasNaoRegistradas,
        usoEstoque,
        observacoes,
      };

      const res = await fetch("/api/relatorios-lider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSaved(true);
        setLastSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        if (onAlert) {
          onAlert("Relatório do líder enviado com sucesso à coordenação!", "success");
        }
        if (onReportSubmitted) {
          onReportSubmitted(dateStr, timeStr);
        }
      } else {
        const errData = await res.json();
        if (onAlert) onAlert(errData.error || "Erro ao salvar relatório.", "error");
      }
    } catch (err) {
      console.error(err);
      if (onAlert) onAlert("Erro de conexão ao salvar relatório.", "error");
    } finally {
      setLoading(false);
    }
  };

  const dateFormatted = dateStr.split("-").reverse().join("/");

  
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 text-slate-800 shadow-sm border border-slate-200 my-4 relative overflow-hidden">
      {isPreview && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-900">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed font-sans">
            <strong className="text-blue-700">MODO DE VISUALIZAÇÃO:</strong> Você não está escalado como Responsável pela Missa neste final de semana. Aproveite para conhecer o formulário! O botão de enviar está desativado.
          </p>
        </div>
      )}

      {/* Background Accent Decorative Elements */}
      
      

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🚩 Responsável pela Missa
              </span>
              {isSaved && (
                <span className="bg-emerald-500/20 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Enviado {lastSavedAt ? `às ${lastSavedAt}` : ""}</span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">Relatório da Celebração</h3>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-700">{dateFormatted} - {timeStr}h</p>
          <p className="text-xs text-blue-600 font-semibold">{massName}</p>
        </div>
      </div>

      {canViewMinistersRelation ? (
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl mb-4 text-xs text-slate-600 leading-relaxed">
          🚩 <strong className="text-slate-900">Painel do Responsável pela Missa:</strong> Todos os ministros escalados são considerados presentes automaticamente. Se a celebração ocorreu sem nenhuma alteração, marque o quadrado abaixo para habilitar o envio.
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl mb-6 text-xs text-amber-900 leading-relaxed">
          🔒 <strong>Acesso Restrito:</strong> A relação dos ministros desta celebração é visível apenas para o Ministro Líder e Responsável habilitado com a estrela (⭐) na frente na escala.
        </div>
      )}

      {/* Quadrado Sem Alteração */}
      {canViewMinistersRelation && (
        <div
          onClick={() => handleToggleSemAlteracao(!semAlteracao)}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 mb-6 ${
            semAlteracao
              ? "bg-emerald-50/90 border-emerald-500 shadow-sm"
              : "bg-slate-50 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              id="checkbox-sem-alteracao"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSemAlteracao(!semAlteracao);
              }}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                semAlteracao
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                  : "bg-white border-slate-300 hover:border-emerald-500"
              }`}
              aria-label="Sem alteração na celebração"
              aria-checked={semAlteracao}
              role="checkbox"
            >
              {semAlteracao && <Check className="w-4 h-4 stroke-[3] text-white" />}
            </button>
            <span className="text-xs sm:text-sm font-black text-slate-900">
              Sem Alteração (Tudo Normal)
            </span>
          </div>

          <div className="shrink-0 text-right">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg inline-block ${
              semAlteracao ? "bg-emerald-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}>
              {semAlteracao ? "Tudo Normal" : "Marcar"}
            </span>
          </div>
        </div>
      )}

      {/* Main Horizontal Grid (2 Columns on Large Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Attendance & Absences */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${canViewMinistersRelation ? "text-blue-600" : "text-amber-600"}`} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  1. Presença e Faltas {canViewMinistersRelation ? `(${teamMembers.length} escalados)` : ""}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                {canViewMinistersRelation ? (
                  faltasCount > 0 ? (
                    <span className="text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg">
                      ⚠️ {faltasCount} {faltasCount === 1 ? "falta marcada" : "faltas marcadas"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-300/30 px-2.5 py-0.5 rounded-lg">
                      Marcar quadrado apenas se faltou ⚠️
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                    🔒 Oculto para não-líderes
                  </span>
                )}
              </div>
            </div>

            {!canViewMinistersRelation ? (
              <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/80 text-center space-y-3 my-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-amber-950 uppercase tracking-tight">
                  Relação de Ministros Oculta
                </h4>
                <p className="text-xs text-amber-900/90 max-w-sm mx-auto leading-relaxed">
                  {!isLeaderStarredInMass
                    ? "O Líder/Responsável não está habilitado com a estrela (⭐) na frente na escala desta celebração. A relação dos ministros permanece oculta até a designação do responsável com estrela."
                    : "Você não é o Ministro Líder e Responsável (⭐) escalado para esta celebração. A relação dos ministros para controle de presença e faltas é de acesso exclusivo do líder designado."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500 font-medium mb-3">
                  Toque no <strong>quadrado na frente</strong> do ministro caso ele tenha <strong>faltado</strong> à missa.
                </p>

                {teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum ministro escalado para este horário.</p>
                ) : (
                  <div className="space-y-2.5">
                {teamMembers.map((minName, idx) => {
                  const isCouple = isCoupleSlot(minName);
                  const isLeaderRow = doesMinisterMatchLeader(minName, liderName);

                  if (isCouple) {
                    const [p1, p2] = splitCoupleNames(minName);
                    const p1Faltou = Boolean(faltaCasalMembro[minName]?.p1Faltou);
                    const p2Faltou = Boolean(faltaCasalMembro[minName]?.p2Faltou);
                    const hasAnyFaltou = p1Faltou || p2Faltou;
                    const isExpanded = Boolean(expandedCouples[minName]);

                    const currentStatus: 'ambos_presentes' | 'so_p1' | 'so_p2' | 'ambos_faltaram' =
                      !hasAnyFaltou
                        ? 'ambos_presentes'
                        : p1Faltou && p2Faltou
                        ? 'ambos_faltaram'
                        : p1Faltou
                        ? 'so_p2'
                        : 'so_p1';

                    return (
                      <div
                        key={idx}
                        id={`ministro-attendance-row-${idx}`}
                        className={`rounded-xl border transition-all ${
                          !hasAnyFaltou
                            ? "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                            : p1Faltou && p2Faltou
                            ? "bg-red-50/90 border-red-300 text-red-950 shadow-xs"
                            : "bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs"
                        }`}
                      >
                        {/* Nome do Casal normal - Ao clicar abre as opções */}
                        <button
                          type="button"
                          id={`casal-header-btn-${idx}`}
                          onClick={() => toggleCoupleExpanded(minName)}
                          className="w-full flex items-center justify-between p-3 text-xs sm:text-sm text-left cursor-pointer transition hover:bg-slate-50/60 rounded-xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                !hasAnyFaltou
                                  ? "bg-white border-slate-300"
                                  : p1Faltou && p2Faltou
                                  ? "bg-red-600 border-red-600 text-white shadow-xs"
                                  : "bg-amber-500 border-amber-500 text-white font-bold shadow-xs"
                              }`}
                            >
                              {hasAnyFaltou && (
                                p1Faltou && p2Faltou ? (
                                  <Check className="w-4 h-4 stroke-[3] text-white" />
                                ) : (
                                  <span className="text-xs font-black leading-none text-white">!</span>
                                )
                              )}
                            </div>
                            <span className={`truncate ${!hasAnyFaltou ? "font-bold text-slate-800" : "font-black text-slate-900"}`}>
                              {toTitleCase(minName)}
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                              Casal
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                !hasAnyFaltou
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : p1Faltou && p2Faltou
                                  ? "bg-red-600 text-white"
                                  : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}
                            >
                              {!hasAnyFaltou
                                ? "✓ Ambos Presentes"
                                : p1Faltou && p2Faltou
                                ? "⚠️ Ambos Faltaram"
                                : p1Faltou
                                ? `⚠️ Só ${p2}`
                                : `⚠️ Só ${p1}`}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Opções expandidas para o casal */}
                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-slate-100 mt-1">
                            <p className="text-[10px] font-semibold text-slate-500 mb-2 px-0.5">
                              Selecione a presença do casal na celebração:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <button
                                type="button"
                                onClick={() => setCoupleAttendance(minName, 'ambos_presentes')}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  currentStatus === 'ambos_presentes'
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                Ambos
                              </button>

                              <button
                                type="button"
                                onClick={() => setCoupleAttendance(minName, 'so_p1')}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                                  currentStatus === 'so_p1'
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                                }`}
                                title={`Apenas ${toTitleCase(p1)} esteve presente (${toTitleCase(p2)} faltou)`}
                              >
                                Só {toTitleCase(p1)}
                              </button>

                              <button
                                type="button"
                                onClick={() => setCoupleAttendance(minName, 'so_p2')}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                                  currentStatus === 'so_p2'
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                                }`}
                                title={`Apenas ${toTitleCase(p2)} esteve presente (${toTitleCase(p1)} faltou)`}
                              >
                                Só {toTitleCase(p2)}
                              </button>

                              <button
                                type="button"
                                onClick={() => setCoupleAttendance(minName, 'ambos_faltaram')}
                                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  currentStatus === 'ambos_faltaram'
                                    ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-800'
                                }`}
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                Ambos Faltaram
                              </button>
                            </div>

                            {hasAnyFaltou && (
                              <div className="mt-3 pt-2 border-t border-slate-200">
                                <input
                                  type="text"
                                  id={`falta-justificativa-${idx}`}
                                  placeholder={`Justificativa da falta (${p1Faltou && p2Faltou ? 'ambos' : p1Faltou ? p1 : p2}) - opcional...`}
                                  value={justificativas[minName] || ""}
                                  onChange={(e) => handleJustificativaChange(minName, e.target.value)}
                                  className="w-full bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Individual minister
                  const hasFaltou = presencas[minName] === false;
                  return (
                    <div
                      key={idx}
                      id={`ministro-attendance-row-${idx}`}
                      className={`p-3 rounded-xl border transition-all ${
                        !hasFaltou
                          ? "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                          : "bg-red-50/90 border-red-300 text-red-950 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Quadrado na frente + Nome do Ministro */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            id={`checkbox-falta-${idx}`}
                            onClick={() => togglePresenca(minName, hasFaltou)}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                              hasFaltou
                                ? "bg-red-600 border-red-600 text-white shadow-xs"
                                : "bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/40"
                            }`}
                            title={
                              hasFaltou
                                ? "Desmarcar falta (Ministro Presente)"
                                : "Marcar que o ministro faltou na missa"
                            }
                            aria-label={`Marcar falta para ${minName}`}
                            aria-checked={hasFaltou}
                            role="checkbox"
                          >
                            {hasFaltou && <Check className="w-4 h-4 stroke-[3] text-white" />}
                          </button>

                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span
                              onClick={() => togglePresenca(minName, hasFaltou)}
                              className={`text-xs sm:text-sm font-bold cursor-pointer select-none transition-colors ${
                                hasFaltou ? "text-red-900 font-extrabold" : "text-slate-800 hover:text-slate-950"
                              }`}
                            >
                              {toTitleCase(minName)}
                            </span>
                            {isLeaderRow && (
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 shrink-0">
                                <Flag className="w-2.5 h-2.5 text-blue-600" /> Responsável
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status à direita */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasFaltou ? (
                            <button
                              type="button"
                              onClick={() => togglePresenca(minName, true)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Clique para desmarcar e confirmar presença"
                            >
                              <span className="text-[10px] uppercase tracking-wider">⚠️ Falta Marcada</span>
                              <X className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                            </button>
                          ) : (
                            <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 hidden sm:inline-flex items-center gap-1">
                              ✓ Presente
                            </span>
                          )}
                        </div>
                      </div>

                      {hasFaltou && (
                        <div className="mt-2.5 pt-2.5 border-t border-red-200/80 space-y-2 animate-in fade-in duration-200">
                          <input
                            type="text"
                            id={`falta-justificativa-${idx}`}
                            placeholder="Justificativa da falta (opcional)..."
                            value={justificativas[minName] || ""}
                            onChange={(e) => handleJustificativaChange(minName, e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
          </div>
        </div>

        {/* RIGHT COLUMN: Substitutions, Stock & Observations */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* SECTION 2: Substituições */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Trocas / Substituições de Última Hora
              </h4>
            </div>
            <input
              type="text"
              disabled={!canViewMinistersRelation}
              value={trocasNaoRegistradas}
              onChange={(e) => {
                setTrocasNaoRegistradas(e.target.value);
                setHasUserModified(true);
                setIsSaved(false);
              }}
              placeholder={canViewMinistersRelation ? "Ex: Carlos serviu no lugar de Roberto..." : "Acesso restrito ao Ministro Líder (⭐)..."}
              className={`w-full border rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                !canViewMinistersRelation ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-900 border-slate-200"
              }`}
            />
          </div>

          {/* SECTION 3: Estoque */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  3. Consumo de Estoque
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Habilite os itens utilizados</span>
            </div>

            {/* 4 Quadrados de tamanho médio */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {ITENS_ESTOQUE_RELATORIO.map((item) => {
                const isChecked = selectedEstoqueItems.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    disabled={!canViewMinistersRelation}
                    onClick={() => toggleEstoqueItem(item)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      !canViewMinistersRelation
                        ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed"
                        : isChecked
                        ? "bg-blue-50/90 border-blue-400 text-blue-900 font-semibold shadow-xs cursor-pointer"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        !canViewMinistersRelation
                          ? "bg-slate-200 border-slate-300 text-transparent"
                          : isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-300 text-transparent"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs leading-tight font-medium">{item}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              disabled={!canViewMinistersRelation}
              value={outroEstoque}
              onChange={(e) => handleOutroEstoqueChange(e.target.value)}
              placeholder={canViewMinistersRelation ? "Outro item ou detalhe (opcional)..." : "Acesso restrito ao Ministro Líder (⭐)..."}
              className={`w-full border rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                !canViewMinistersRelation ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-900 border-slate-200"
              }`}
            />
          </div>

          {/* SECTION 4: Observações */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                4. Observações
              </h4>
            </div>
            <textarea
              rows={2}
              disabled={!canViewMinistersRelation}
              value={observacoes}
              onChange={(e) => {
                setObservacoes(e.target.value);
                setHasUserModified(true);
                setIsSaved(false);
              }}
              placeholder={canViewMinistersRelation ? "Ex: Imprevistos, alfaias para lavagem, atrasos..." : "Acesso restrito ao Ministro Líder (⭐)..."}
              className={`w-full border rounded-xl p-2.5 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed ${
                !canViewMinistersRelation ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-900 border-slate-200"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-[11px] text-slate-500/70 font-medium">
          {!canViewMinistersRelation
            ? "Apenas o Ministro Líder e Responsável (⭐) desta celebração pode enviar o relatório."
            : !hasAnyInformationFilled && !semAlteracao && !isSaved
            ? "Marque 'Sem Alteração' ou preencha alguma ocorrência para habilitar o envio."
            : isSaved
            ? "✓ Relatório sincronizado e enviado à coordenação."
            : semAlteracao
            ? "✓ Sem alteração confirmado! Envio habilitado para a coordenação."
            : "⚠️ Você possui alterações prontas para envio."}
        </span>

        <button
          type="button"
          onClick={handleSubmitRelatorio}
          disabled={loading || isPreview || !canViewMinistersRelation || (!hasAnyInformationFilled && !semAlteracao && !hasUserModified && !isSaved)}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
            isPreview || !canViewMinistersRelation || (!hasAnyInformationFilled && !semAlteracao && !hasUserModified && !isSaved)
              ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
              : isSaved
              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer"
          }`}
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{isSaved ? "Atualizar Relatório da Missa" : "Enviar Relatório à Coordenação"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiderMissaCard;
