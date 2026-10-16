import apiFetch from '../utils/api';
import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Flag, AlertCircle } from "lucide-react";
import LiderMissaCard from "./LiderMissaCard";
import { isMinisterLeader, isMinisterLiderForUser, isWithinActiveWindow } from "../utils";

interface LiderViewProps {
  user: any;
  myAssignments: any[];
  voltar: () => void;
  onAlert?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const LiderView: React.FC<LiderViewProps> = ({
  user,
  myAssignments,
  voltar,
  onAlert,
}) => {
  const [submittedReportKeys, setSubmittedReportKeys] = useState<string[]>([]);
  const [fetchedAssignments, setFetchedAssignments] = useState<any[]>([]);
  const [selectedAssignKey, setSelectedAssignKey] = useState<string>("");

  useEffect(() => {
    if (user?.paroquia) {
      apiFetch(`/api/relatorios-lider?paroquia=${encodeURIComponent(user.paroquia)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const keys = data.map((r: any) => `${r.data}_${r.horario}`);
            setSubmittedReportKeys(keys);
          }
        })
        .catch((err) =>
          console.error("Erro ao buscar relatórios em LiderView:", err),
        );

      // Also fetch escala to ensure all leader assignments and complete minister lists are present
      apiFetch(`/api/escala?paroquia=${encodeURIComponent(user.paroquia)}&preview=true`)
        .then((res) => res.json())
        .then((escalaData) => {
          if (escalaData && typeof escalaData === "object") {
            const list: any[] = [];
            Object.entries(escalaData).forEach(([dateStr, missas]: [string, any]) => {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
              if (!missas || typeof missas !== "object") return;
              Object.entries(missas).forEach(([horario, missa]: [string, any]) => {
                if (!missa || typeof missa !== "object") return;
                const ministros = Array.isArray(missa.ministros) ? missa.ministros : [];
                const isLeader = isMinisterLiderForUser(missa.lider, user, ministros);

                // Apenas se o usuário logado for o responsável da celebração atual
                if (isLeader) {
                  list.push({
                    date: dateStr,
                    horario: horario,
                    time: horario,
                    ...missa,
                  });
                }
              });
            });
            list.sort((a, b) =>
              `${a.date}T${a.time || a.horario}`.localeCompare(
                `${b.date}T${b.time || b.horario}`,
              ),
            );
            setFetchedAssignments(list);
          }
        })
        .catch((err) =>
          console.error("Erro ao carregar escala em LiderView:", err),
        );
    }
  }, [user?.paroquia]);

  const handleReportSubmitted = (dateStr: string, timeStr: string) => {
    const key = `${dateStr}_${timeStr}`;
    setSubmittedReportKeys((prev) =>
      prev.includes(key) ? prev : [...prev, key],
    );
  };

  // REGRA DO USUÁRIO: Não apagar enquanto o líder/responsável não enviar o relatório!
  // Se ainda não foi enviado, nunca apaga até o envio. Se já foi enviado, permanece por 2 dias após a missa.
  const isCelebrationVisible = (dateStr: string, isSubmitted: boolean): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    assignDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((assignDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!isSubmitted) {
      // Celebrações futuras até 2 dias antes, do dia de hoje, e todas do passado sem relatório enviado (NUNCA APAGAR)
      return diffDays <= 2;
    }

    // Se já foi enviado, fica visível por 2 dias após a missa
    return diffDays >= -2 && diffDays <= 2;
  };

  const allLeaderAssignments = useMemo(() => {
    const combined = [...myAssignments, ...fetchedAssignments];
    const uniqueMap = new Map<string, any>();
    combined.forEach((assign) => {
      const key = `${assign.date}_${assign.time || assign.horario}`;
      if (!uniqueMap.has(key)) {
        const ministros = Array.isArray(assign.ministros) ? assign.ministros : [];
        const isLeader = isMinisterLiderForUser(assign.lider, user, ministros);
        if (isLeader) {
          const isSubmitted = submittedReportKeys.includes(key);
          if (isCelebrationVisible(assign.date, isSubmitted)) {
            uniqueMap.set(key, assign);
          }
        }
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) =>
      `${a.date}T${a.time || a.horario}`.localeCompare(
        `${b.date}T${b.time || b.horario}`,
      ),
    );
  }, [user, myAssignments, fetchedAssignments, submittedReportKeys]);

  // Identifica celebrações pendentes (passadas ou de hoje cujo relatório não foi enviado)
  const pendingAssignments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allLeaderAssignments.filter((assign) => {
      const key = `${assign.date}_${assign.time || assign.horario}`;
      const isSubmitted = submittedReportKeys.includes(key);
      const parts = assign.date.split("-").map(Number);
      if (parts.length !== 3) return false;
      const assignDate = new Date(parts[0], parts[1] - 1, parts[2]);
      assignDate.setHours(0, 0, 0, 0);
      return !isSubmitted && assignDate.getTime() <= today.getTime();
    });
  }, [allLeaderAssignments, submittedReportKeys]);

  const activeLeaderAssignment = useMemo(() => {
    if (allLeaderAssignments.length === 0) return null;

    if (selectedAssignKey) {
      const found = allLeaderAssignments.find(
        (a) => `${a.date}_${a.time || a.horario}` === selectedAssignKey,
      );
      if (found) return found;
    }

    // Prioridade 1: Celebração com pendência (não enviada e já ocorrida/hoje)
    if (pendingAssignments.length > 0) {
      return pendingAssignments[0];
    }

    // Prioridade 2: Celebração futura não enviada
    const unsubmittedFuture = allLeaderAssignments.filter((assign) => {
      const key = `${assign.date}_${assign.time || assign.horario}`;
      return !submittedReportKeys.includes(key);
    });

    if (unsubmittedFuture.length > 0) {
      return unsubmittedFuture[0];
    }

    return allLeaderAssignments[0];
  }, [allLeaderAssignments, submittedReportKeys, selectedAssignKey, pendingAssignments]);

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100">
              <Flag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Painel do Responsável pela Missa
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-widest">
                Relatório da Celebração
              </p>
            </div>
          </div>
          {voltar && (
            <button
              onClick={voltar}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar ao Painel
            </button>
          )}
        </div>

        {pendingAssignments.length > 0 && (
          <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-900 text-white p-4 sm:p-5 rounded-3xl border-2 border-red-500 shadow-lg flex items-start sm:items-center gap-3.5 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white border border-red-400 flex items-center justify-center shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Relatório Litúrgico Pendente
                </span>
                <span className="text-red-200 text-xs font-bold">
                  {pendingAssignments.length === 1 ? '1 celebração aguardando envio' : `${pendingAssignments.length} celebrações aguardando envio`}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-1 leading-tight">
                Este relatório não é apagado até que você realize o envio à coordenação!
              </h3>
              <p className="text-xs text-red-100/90 mt-0.5 leading-relaxed">
                Selecione a celebração com a etiqueta vermelha "Pendência" abaixo, confira as presenças dos ministros e envie o relatório litúrgico para regularizar.
              </p>
            </div>
          </div>
        )}

        {allLeaderAssignments.length > 1 && (
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
            <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
              Selecione a Celebração:
            </span>
            <div className="flex flex-wrap gap-2">
              {allLeaderAssignments.map((a, idx) => {
                const key = `${a.date}_${a.time || a.horario}`;
                const isSelected =
                  activeLeaderAssignment &&
                  `${activeLeaderAssignment.date}_${activeLeaderAssignment.time || activeLeaderAssignment.horario}` ===
                    key;
                const isSubmitted = submittedReportKeys.includes(key);
                const isPending = pendingAssignments.some(p => `${p.date}_${p.time || p.horario}` === key);
                const isMyOwn = isMinisterLiderForUser(a.lider, user, Array.isArray(a.ministros) ? a.ministros : []);
                const parts = a.date.split("-");
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : a.date;

                return (
                  <button
                    key={key || idx}
                    type="button"
                    id={`btn-select-missa-${idx}`}
                    onClick={() => setSelectedAssignKey(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected && isPending
                        ? "bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400"
                        : isSelected
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : isPending
                        ? "bg-red-50 text-red-950 border-red-300 hover:bg-red-100 ring-1 ring-red-400/30"
                        : isMyOwn
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isMyOwn && <span className="text-amber-500 font-extrabold">⭐</span>}
                    <span>
                      {formattedDate} às {a.time || a.horario}
                    </span>
                    {a.nome && <span className="opacity-80 font-normal">({a.nome})</span>}
                    {isMyOwn && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isSelected ? "bg-white/20 text-white" : isPending ? "bg-red-200/80 text-red-950" : "bg-amber-200/80 text-amber-950"
                      }`}>
                        Sua Missa
                      </span>
                    )}
                    {isPending ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 ${
                        isSelected ? "bg-white/25 text-white" : "bg-red-600 text-white animate-pulse"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Pendência
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Enviado
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {activeLeaderAssignment ? (
            <LiderMissaCard
              assign={activeLeaderAssignment}
              user={user}
              onAlert={onAlert}
              onReportSubmitted={handleReportSubmitted}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm space-y-3">
              {!(user?.isLider || user?.isLiderConjuge || user?.role === "coordenacao" || user?.role === "vice_coordenacao" || user?.role === "admin" || (user as any)?.isActualCoord || (user as any)?.isCoordenador || allLeaderAssignments.length > 0) ? (
                <>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Acesso Restrito ao Ministro Líder (⭐)
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Você não está habilitado como Ministro Líder ou não é o responsável escalado com a estrela (⭐) para esta celebração. A relação dos ministros e o preenchimento do relatório são exclusivos do líder designado.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Flag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Nenhuma Celebração Ativa no Momento
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    A relação dos ministros e o relatório da missa ficam disponíveis para o Ministro Líder e Responsável (⭐) <strong>a partir de 2 dias antes</strong> de cada celebração e são encerrados <strong>2 dias depois</strong> da data.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiderView;
