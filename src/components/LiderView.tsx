import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Flag, AlertCircle } from "lucide-react";
import LiderMissaCard from "./LiderMissaCard";
import { isMinisterLeader, isMinisterLiderForUser } from "../utils";

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
      fetch(`/api/relatorios-lider?paroquia=${encodeURIComponent(user.paroquia)}`)
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
      fetch(`/api/escala?paroquia=${encodeURIComponent(user.paroquia)}&preview=true`)
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
                const isLeaderInMass = ministros.some((m: any) => isMinisterLeader(m, missa.lider));
                const isLeader = isLeaderInMass && isMinisterLiderForUser(missa.lider, user, ministros);
                const isCoord =
                  user?.role === "coordenacao" ||
                  user?.role === "vice_coordenacao" ||
                  user?.role === "admin";

                if (isLeader || (isCoord && ministros.length > 0)) {
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

  // Only show celebrations within the active window: 2 days before the mass date until 2 days after
  const isWithinActiveWindow = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    assignDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((assignDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // diffDays:
    // +2: exactly 2 days before the mass
    // 0: day of the mass
    // -2: 2 days after the mass
    // Appears 2 days before (diffDays <= 2) and disappears 2 days after (diffDays >= -2)
    return diffDays >= -2 && diffDays <= 2;
  };

  const allLeaderAssignments = useMemo(() => {
    const combined = [...myAssignments, ...fetchedAssignments];
    const uniqueMap = new Map<string, any>();
    combined.forEach((assign) => {
      const key = `${assign.date}_${assign.time || assign.horario}`;
      if (!uniqueMap.has(key)) {
        const ministros = Array.isArray(assign.ministros) ? assign.ministros : [];
        const isLeaderInMass = ministros.some((m: any) => isMinisterLeader(m, assign.lider));
        const isLeader = isLeaderInMass && isMinisterLiderForUser(assign.lider, user, ministros);
        const isCoord =
          user?.role === "coordenacao" ||
          user?.role === "vice_coordenacao" ||
          user?.role === "admin";
        if (isLeader || isCoord) {
          // Check 2 days before until 2 days after window
          if (isWithinActiveWindow(assign.date)) {
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
  }, [user, myAssignments, fetchedAssignments]);

  const activeLeaderAssignment = useMemo(() => {
    if (selectedAssignKey) {
      const found = allLeaderAssignments.find(
        (a) => `${a.date}_${a.time || a.horario}` === selectedAssignKey,
      );
      if (found) return found;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const unsubmittedLeaderAssignments = allLeaderAssignments.filter(
      (assign) => {
        const key = `${assign.date}_${assign.time || assign.horario}`;
        return !submittedReportKeys.includes(key);
      },
    );

    // Prefer earliest unsubmitted within the window
    let nextAssignment = unsubmittedLeaderAssignments.find((assign) => {
      const parts = assign.date.split("-");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
        return d >= todayStart;
      }
      return false;
    });

    if (!nextAssignment && unsubmittedLeaderAssignments.length > 0) {
      nextAssignment = unsubmittedLeaderAssignments[0];
    }

    if (!nextAssignment && allLeaderAssignments.length > 0) {
      nextAssignment = allLeaderAssignments[0];
    }

    return nextAssignment;
  }, [allLeaderAssignments, submittedReportKeys, selectedAssignKey]);

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
                const parts = a.date.split("-");
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : a.date;

                return (
                  <button
                    key={key || idx}
                    type="button"
                    id={`btn-select-missa-${idx}`}
                    onClick={() => setSelectedAssignKey(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>
                      {formattedDate} às {a.time || a.horario}
                    </span>
                    {a.nome && <span className="opacity-80 font-normal">({a.nome})</span>}
                    {isSubmitted && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Enviado
                      </span>
                    )}
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
              {!(user?.isLider || user?.isLiderConjuge || user?.role === "coordenacao" || user?.role === "vice_coordenacao" || user?.role === "admin") ? (
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
