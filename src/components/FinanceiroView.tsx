import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Search, 
  Check, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  User as UserIcon,
  Filter,
  Wallet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import type { User as UserType, FinanceiroLancamento } from "../types";
import { formatPhone } from "../utils";
import { PieChart3D } from "./PieChart3D";
import { BarChart3D } from "./BarChart3D";

interface FinanceiroViewProps {
  user: UserType;
  onAlert: (title: string, msg: string) => void;
  onCustomConfirm: (msg: string, onConfirm: () => void) => void;
}

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const formatCurrency = (value: string) => {
  let v = value.replace(/\D/g, ''); 
  if (v.length === 0) return '0,00';
  v = v.padStart(3, '0');
  const cents = v.slice(-2);
  let integer = v.slice(0, -2);
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integer},${cents}`;
};

const parseCurrency = (value: string) => {
  if (typeof value !== "string") return Number(value) || 0;
  const clean = value.trim();
  if (clean.includes(",")) {
    return Number(clean.replace(/\./g, "").replace(",", "."));
  }
  return Number(clean) || 0;
};

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const getMinistroPagoDisplayName = (m: UserType | any) => {
  if (!m) return "";
  const isCouple = m.tipo === "casal" || !!m.nomeConjuge || !!m.nomeExibicaoConjuge;
  if (isCouple) {
    const p1 = m.nomeExibicao || m.nome || "";
    const p2 = m.nomeExibicaoConjuge || m.nomeConjuge || "";
    if (p1 && p2) {
      return `${p1} e ${p2}`;
    }
    return p1 || p2;
  }
  return m.nomeExibicao || m.nome || "";
};

export default function FinanceiroView({ user, onAlert, onCustomConfirm }: FinanceiroViewProps) {
  const [lancamentos, setLancamentos] = useState<FinanceiroLancamento[]>([]);
  const [ministros, setMinistros] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Year & general filter states
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("todos"); // "todos" or "01"-"12"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos"); // "todos", "mensalidade", "outros"
  const [typeFilter, setTypeFilter] = useState<string>("todos"); // "todos", "entrada", "saida"

  // Pagination state (default 5 items per page)
  const [itemsPerPage, setItemsPerPage] = useState<number | "todos">(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonthFilter, searchQuery, categoryFilter, typeFilter, itemsPerPage]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New entry form state
  const [formData, setFormData] = useState({
    tipo: "entrada" as "entrada" | "saida",
    categoria: "mensalidade" as "mensalidade" | "outros" | "saldo_anterior",
    valor: "0.00",
    tipoValor: "fixo" as "fixo" | "variado", 
    data: new Date().toISOString().split("T")[0],
    ministroId: "",
    descricao: "",
    mesReferencia: new Date().toISOString().substring(0, 7) // "YYYY-MM"
  });

  // Decide if read-only
  // Coordinator user.role is 'coordenacao'. Minister is 'ministro'.
  // Coordinator gets standard read-only view ("apenas consulta"). 
  // Treasurer (minister with isTesoureiro flag) can write.
  const [gabaritoTab, setGabaritoTab] = useState<"matriz" | "relacao" | "matriz-paid" | "matriz-pending">("matriz");
  const [selectedMonthReport, setSelectedMonthReport] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<"mensal" | "anual">("mensal");

  const isReadOnly = useMemo(() => {
    const isCoordinator = user.role === "coordenacao" || user.role === "admin" || user.role === "vice_coordenacao" || (user.role && user.role.toLowerCase().includes("coordena"));
    const isTreasurer = user.isTesoureiro === true;
    
    // Coordination is always read-only in this tab as requested: "a coordenação teria uma aba somente para consulta"
    if (isCoordinator) {
      return true;
    }
    // If they logged in as a normal minister but are Treasurer, they have write-access.
    return !isTreasurer;
  }, [user]);

  // Fetch approved ministers and financial movements
  const fetchData = async () => {
    setLoading(true);
    try {
      const paroquiaQuery = user.paroquia ? `?paroquia=${encodeURIComponent(user.paroquia)}` : "";
      
      // Fetch ministers to link in monthly fee
      const minRes = await fetch(`/api/admin/ministros${paroquiaQuery}`);
      let fetchedMinisters: UserType[] = [];
      if (minRes.ok) {
        fetchedMinisters = await minRes.json();
        // Sort ministers alphabetically
        fetchedMinisters.sort((a, b) => a.nome.localeCompare(b.nome));
        setMinistros(fetchedMinisters);
      }

      // Fetch financial elements
      const finRes = await fetch(`/api/financeiro${paroquiaQuery}`);
      if (finRes.ok) {
        const data = await finRes.json();
        setLancamentos(data);
      }
    } catch (e) {
      console.error("Erro ao carregar dados financeiros:", e);
      onAlert("Erro", "Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.paroquia]);

  // Submits a new financial entry
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.valor || Number(formData.valor) <= 0) {
      onAlert("Atenção", "Por favor, informe um valor válido maior do que zero.");
      return;
    }

    if (formData.categoria === "mensalidade" && !formData.ministroId) {
      onAlert("Atenção", "Para a categoria 'Mensalidade', selecione o Ministro pagador.");
      return;
    }

    setSubmitting(true);
    try {
      let ministroNomeSelected = "";
      if (formData.categoria === "mensalidade" && formData.ministroId) {
        const found = ministros.find(m => String(m.id) === String(formData.ministroId));
        if (found) {
          ministroNomeSelected = getMinistroPagoDisplayName(found);
        }
      }

      const bodyData = {
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor: parseCurrency(formData.valor),
        tipoValor: formData.tipoValor,
        data: formData.data,
        ministroId: formData.categoria === "mensalidade" ? Number(formData.ministroId) : undefined,
        ministroNome: formData.categoria === "mensalidade" ? ministroNomeSelected : undefined,
        usuario: user.nome,
        paroquia: user.paroquia,
        descricao: formData.descricao.trim(),
        mesReferencia: formData.categoria === "mensalidade" ? formData.mesReferencia : undefined
      };

      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        // Reset form
        setFormData({
          tipo: "entrada",
          categoria: "mensalidade",
          valor: "",
          tipoValor: "fixo",
          data: new Date().toISOString().split("T")[0],
          ministroId: "",
          descricao: "",
          mesReferencia: new Date().toISOString().substring(0, 7)
        });
        setShowAddModal(false);
        fetchData();
        onAlert("Sucesso", "Movimentação financeira registrada com sucesso!");
      } else {
        const errData = await res.json();
        onAlert("Erro", errData.error || "Erro ao registrar lançamento.");
      }
    } catch (err) {
      console.error(err);
      onAlert("Erro", "Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handles quick-recording monthly fee by clicking cells in the grid
  const handleQuickRecordPayment = (ministro: UserType, monthStr: string) => {
    if (isReadOnly) return;

    const [yr, mo] = monthStr.split("-");
    const monthName = MONTHS_FULL[parseInt(mo) - 1];
    
    const displayName = getMinistroPagoDisplayName(ministro);
    const msg = `Registrar pagamento de mensalidade no valor padrão de R$ 10,00 para o ministro ${displayName} referente ao mës de ${monthName} de ${yr}?`;
    
    onCustomConfirm(msg, async () => {
      try {
        let ministroNomeSelected = displayName;

        const bodyData = {
          tipo: "entrada",
          categoria: "mensalidade",
          valor: 10, // Default quick record value R$ 10,00
          data: new Date().toISOString().split("T")[0],
          ministroId: ministro.id,
          ministroNome: ministroNomeSelected,
          usuario: user.nome,
          paroquia: user.paroquia,
          descricao: `Mensalidade paga via Painel de Controle`,
          mesReferencia: monthStr
        };

        const res = await fetch("/api/financeiro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });

        if (res.ok) {
          fetchData();
        } else {
          const errData = await res.json();
          onAlert("Erro", errData.error || "Erro ao registrar pagamento.");
        }
      } catch (e) {
        console.error(e);
        onAlert("Erro", "Erro ao conectar com o servidor.");
      }
    });
  };

  // Removes a financial record helper
  const handleDeleteEntry = (id: string, detail: string) => {
    if (isReadOnly) return;
    
    onCustomConfirm(`Tem certeza que deseja excluir o lançamento "${detail}"? Essa ação é irreversível.`, async () => {
      try {
        const res = await fetch(`/api/financeiro/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchData();
          onAlert("Sucesso", "Lançamento financeiro excluído com sucesso!");
        } else {
          onAlert("Erro", "Não foi possível excluir o lançamento.");
        }
      } catch (e) {
        console.error(e);
        onAlert("Erro", "Erro ao conectar com o servidor.");
      }
    });
  };

  // ----------------- CALCULATIONS & ANALYTICS -----------------

  // Filtered list of lancamentos based on top-level filter controls
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(l => {
      // Filter by selected year
      const itemYear = new Date(l.data).getFullYear();
      if (itemYear !== selectedYear) return false;

      // Filter by selected month
      if (selectedMonthFilter !== "todos") {
        const itemMonthStr = l.data.split("-")[1]; // "01", "02" etc
        if (itemMonthStr !== selectedMonthFilter) return false;
      }

      // Filter by category
      if (categoryFilter !== "todos" && l.categoria !== categoryFilter) return false;

      // Filter by type
      if (typeFilter !== "todos" && l.tipo !== typeFilter) return false;

      // Search engine
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = l.descricao?.toLowerCase().includes(query) || false;
        const matchesMinStr = l.ministroNome?.toLowerCase().includes(query) || false;
        const matchesCategory = l.categoria.toLowerCase().includes(query);
        const matchesId = l.id.toLowerCase().includes(query);
        return matchesDesc || matchesMinStr || matchesCategory || matchesId;
      }

      return true;
    });
  }, [lancamentos, selectedYear, selectedMonthFilter, searchQuery, categoryFilter, typeFilter]);

  // Sorted list of lancamentos (newest first)
  const sortedLancamentos = useMemo(() => {
    return [...filteredLancamentos].sort((a, b) => b.data.localeCompare(a.data) || b.createdAt.localeCompare(a.createdAt));
  }, [filteredLancamentos]);

  // Total pages
  const totalPages = useMemo(() => {
    if (itemsPerPage === "todos") return 1;
    return Math.ceil(sortedLancamentos.length / itemsPerPage) || 1;
  }, [sortedLancamentos.length, itemsPerPage]);

  // Paginated slice of lancamentos
  const paginatedLancamentos = useMemo(() => {
    if (itemsPerPage === "todos") return sortedLancamentos;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedLancamentos.slice(start, start + itemsPerPage);
  }, [sortedLancamentos, currentPage, itemsPerPage]);

  // Generate beautiful paginated numbers list with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }, [totalPages, currentPage]);

  // Overall totals for the active filters in selected year
  const statistics = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    
    filteredLancamentos.forEach(l => {
      if (l.tipo === "entrada") {
        entradas += l.valor;
      } else {
        saidas += l.valor;
      }
    });

    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  }, [filteredLancamentos]);

  // Generate data comparison for monthly bar chart
  const monthlyChartData = useMemo(() => {
    const dataMap = Array.from({ length: 12 }, (_, i) => ({
      name: MONTHS_SHORT[i],
      Entradas: 0,
      Saídas: 0,
    }));

    // Process all lancamentos of the selected year
    lancamentos.forEach(l => {
      const d = new Date(l.data);
      if (d.getFullYear() === selectedYear) {
        const monthIndex = d.getMonth();
        if (l.tipo === "entrada") {
          dataMap[monthIndex].Entradas += l.valor;
        } else {
          dataMap[monthIndex].Saídas += l.valor;
        }
      }
    });

    return dataMap;
  }, [lancamentos, selectedYear]);

  // Category breakdown for Pie Chart
  const pieChartData = useMemo(() => {
    let mensalidadeVal = 0;
    let saldoAnteriorVal = 0;
    let outrosEntradaVal = 0;
    let outrosSaidaVal = 0;

    filteredLancamentos.forEach(l => {
      if (l.categoria === "mensalidade") {
        mensalidadeVal += l.valor;
      } else if (l.categoria === "saldo_anterior") {
        saldoAnteriorVal += l.valor;
      } else if (l.tipo === "entrada") {
        outrosEntradaVal += l.valor;
      } else {
        outrosSaidaVal += l.valor;
      }
    });

    const data = [];
    if (saldoAnteriorVal > 0) data.push({ name: "Saldo Anterior", value: saldoAnteriorVal, color: "#8b5cf6" });
    if (mensalidadeVal > 0) data.push({ name: "Mensalidades", value: mensalidadeVal, color: "#10b981" });
    if (outrosEntradaVal > 0) data.push({ name: "Outras Entradas", value: outrosEntradaVal, color: "#3b82f6" });
    if (outrosSaidaVal > 0) data.push({ name: "Saídas / Despesas", value: outrosSaidaVal, color: "#ef4444" });

    return data;
  }, [filteredLancamentos]);

  // Build key-value map for quick check of who paid what month of selected year
  // Key: `${ministroId}-${year}-${month}` (month is "01"-"12")
  const pagosMap = useMemo(() => {
    const map = new Set<string>();
    lancamentos.forEach(l => {
      if (l.categoria === "mensalidade" && l.ministroId && l.mesReferencia) {
        map.add(`${l.ministroId}-${l.mesReferencia}`);
      }
    });
    return map;
  }, [lancamentos]);

  // Memoized stats for the selected month report
  const reportStats = useMemo(() => {
    const monthKey = `${selectedYear}-${selectedMonthReport}`;
    const paidList: any[] = [];
    const pendingList: any[] = [];

    ministros.forEach(m => {
      const key = `${m.id}-${monthKey}`;
      const hasPaid = pagosMap.has(key);
      if (hasPaid) {
        paidList.push(m);
      } else {
        pendingList.push(m);
      }
    });

    return {
      paid: paidList,
      pending: pendingList,
      total: ministros.length,
      paidCount: paidList.length,
      pendingCount: pendingList.length,
      percentPaid: ministros.length > 0 ? Math.round((paidList.length / ministros.length) * 100) : 0
    };
  }, [ministros, selectedYear, selectedMonthReport, pagosMap]);

  // Memoized stats for annual report per minister
  const annualReportStats = useMemo(() => {
    return ministros.map(m => {
      let paidMonthsCount = 0;
      const details: { monthIndex: number; paid: boolean }[] = [];
      
      for (let i = 0; i < 12; i++) {
        const monthVal = (i + 1).toString().padStart(2, "0");
        const key = `${m.id}-${selectedYear}-${monthVal}`;
        const hasPaid = pagosMap.has(key);
        if (hasPaid) paidMonthsCount++;
        details.push({ monthIndex: i, paid: hasPaid });
      }

      return {
        ministro: m,
        paidMonthsCount,
        totalPaid: paidMonthsCount * 10,
        pendingMonthsCount: 12 - paidMonthsCount,
        totalPending: (12 - paidMonthsCount) * 10,
        details
      };
    });
  }, [ministros, selectedYear, pagosMap]);


  return (
    <div className="space-y-8">
      {/* Upper header with access alert */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <img
              src="/tesouraria.jpg"
              alt="Tesouraria"
              className="w-7 h-7 object-contain drop-shadow-xs inline-block"
              referrerPolicy="no-referrer"
            />
            Movimentação Financeira e Caixa
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {isReadOnly 
              ? "Modo Leitura Técnica de Consulta. Apenas tesoureiros designados podem registrar lançamentos."
              : "Painel de Lançamento Ativo para o Tesoureiro do Ministério."
            }
          </p>
        </div>
        
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setFormData({
                  tipo: "entrada",
                  categoria: "saldo_anterior",
                  valor: "",
                  tipoValor: "fixo",
                  data: new Date().toISOString().split("T")[0],
                  ministroId: "",
                  descricao: "Saldo Anterior do Caixa",
                  mesReferencia: new Date().toISOString().substring(0, 7)
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 font-bold text-sm transition-all shadow-sm cursor-pointer"
              title="Lançar saldo anterior do caixa ou conta"
            >
              <Wallet className="w-4 h-4 text-purple-600" />
              Lançar Saldo Anterior
            </button>

            <button
              onClick={() => {
                setFormData({
                  tipo: "entrada",
                  categoria: "mensalidade",
                  valor: "",
                  tipoValor: "fixo",
                  data: new Date().toISOString().split("T")[0],
                  ministroId: "",
                  descricao: "",
                  mesReferencia: new Date().toISOString().substring(0, 7)
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold text-sm transition-all shadow-blue-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>
        )}
      </div>

      {/* Financial stats card layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entradas */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
        >
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Entradas ({selectedYear})</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              R$ {statistics.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        {/* Saídas */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
        >
          <div className="p-4 bg-red-50 rounded-2xl text-red-500">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Saídas ({selectedYear})</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              R$ {statistics.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        {/* Saldo Caixa */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
        >
          <div className={`p-4 rounded-2xl ${statistics.saldo >= 0 ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}>
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo Caixa Atual</p>
            <p className={`text-2xl font-black mt-1 ${statistics.saldo >= 0 ? "text-blue-600" : "text-rose-600"}`}>
              R$ {statistics.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Analytics chart and graphics summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="font-extrabold text-slate-800 text-sm mb-4">Entradas vs Saídas por Mês ({selectedYear})</h4>
          <div className="h-[260px] w-full flex items-center justify-center">
            <BarChart3D data={monthlyChartData} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-4">Composição de Receitas / Despesas</h4>
            <div className="h-52 w-full flex items-center justify-center">
              <PieChart3D data={pieChartData} />
            </div>
          </div>

          <div className="space-y-2">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-black text-slate-800">
                  R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Matrix / Checklist for Mensalidades */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Gabarito de Mensalidades dos Ministros ({selectedYear})</h4>
            <p className="text-xs text-slate-500 mt-1">
              {!isReadOnly 
                ? "Clique no quadrante cinza correspondente de um ministro no mês para indicar o pagamento regular de R$ 10,00."
                : "Abaixo constam as mensalidades pagas e registradas por cada ministro no ano selecionado."
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab switch control */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <div className="flex gap-1.5">
            <button
              onClick={() => setGabaritoTab("matriz")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                gabaritoTab === "matriz"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gabarito Geral (Matriz)
            </button>
            <button
              onClick={() => setGabaritoTab("relacao")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                gabaritoTab === "relacao"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Relação por Mês & Impressão
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPrintType("mensal");
                setShowPrintModal(true);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Gerar e imprimir relatório mensal"
            >
              Imprimir Relação Mensal
            </button>
            <button
              onClick={() => {
                setPrintType("anual");
                setShowPrintModal(true);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Gerar e imprimir relatório anual"
            >
              Imprimir Gabarito Anual
            </button>
          </div>
        </div>

        {/* Dashboard Cards Representation */}
        {(gabaritoTab === "matriz" || gabaritoTab === "matriz-paid" || gabaritoTab === "matriz-pending") && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setGabaritoTab("matriz-paid")}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-left hover:bg-emerald-100/50 transition-colors group"
              >
                <p className="text-emerald-700 font-bold">Total Pago (até Jun)</p>
                <p className="text-4xl font-black text-emerald-600">R$ {(pagosMap.size * 10).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-emerald-600/70 font-medium mt-1">Ver ministros que pagaram</p>
              </button>
              <button
                onClick={() => setGabaritoTab("matriz-pending")}
                className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-left hover:bg-rose-100/50 transition-colors group"
              >
                <p className="text-rose-700 font-bold">Total Pendente (até Jun)</p>
                <p className="text-4xl font-black text-rose-600">R$ {((ministros.length * 6 - pagosMap.size) * 10).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-rose-600/70 font-medium mt-1">Ver ministros com pendências</p>
              </button>
            </div>
            
            {(gabaritoTab === "matriz-paid" || gabaritoTab === "matriz-pending") && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800">
                          {gabaritoTab === "matriz-paid" ? "Relatório de Mensalidades Recebidas" : "Relatório de Mensalidades em Aberto"}
                        </h4>
                        <button onClick={() => setGabaritoTab("matriz")} className="text-xs text-slate-500 hover:text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">Voltar</button>
                    </div>
                    
                    <div className="space-y-4">
                        {ministros.map(m => {
                           const paidMonths = MONTHS_SHORT.filter((_, idx) => pagosMap.has(`${m.id}-${selectedYear}-${(idx+1).toString().padStart(2, '0')}`));
                           const pendingMonths = MONTHS_SHORT.filter((_, idx) => !pagosMap.has(`${m.id}-${selectedYear}-${(idx+1).toString().padStart(2, '0')}`));
                           
                           if (gabaritoTab === "matriz-paid" && paidMonths.length === 0) return null;
                           if (gabaritoTab === "matriz-pending" && pendingMonths.length === 0) return null;
                           
                           return (
                             <div key={m.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg">
                                <span className="text-xs font-semibold text-slate-700 w-1/3 truncate">{getMinistroPagoDisplayName(m)}</span>
                                <div className="flex flex-wrap gap-1 w-2/3 justify-end">
                                    {(gabaritoTab === "matriz-paid" ? paidMonths : pendingMonths).map(mo => (
                                        <span key={mo} className={`text-[10px] font-bold px-2 py-0.5 rounded ${gabaritoTab === "matriz-paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{mo}</span>
                                    ))}
                                </div>
                             </div>
                           )
                        })}
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Tab 2: Relação detailed / checklists */}
        {gabaritoTab === "relacao" && (
          <div className="space-y-6">
            {/* Filter/Selection Header for Month of Report */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-slate-500">Mês de Consulta:</span>
                <select
                  value={selectedMonthReport}
                  onChange={(e) => setSelectedMonthReport(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {MONTHS_FULL.map((m, idx) => (
                    <option key={idx} value={(idx + 1).toString().padStart(2, "0")}>
                      {m} de {selectedYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress and status counters */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-xl">
                  {reportStats.paidCount} Pagaram ({reportStats.percentPaid}%)
                </div>
                <div className="bg-rose-50 text-rose-600 border border-rose-100 px-3.5 py-1.5 rounded-xl font-sans">
                  {reportStats.pendingCount} Falta Pagar
                </div>
                <div className="bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1.5 rounded-xl font-mono">
                  Total {reportStats.total} Ministros
                </div>
              </div>
            </div>

            {/* Monthly Progress Bar representation */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${reportStats.percentPaid}%` }}
              />
            </div>

            {/* Paid vs Pending Columns Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PAID COLUMN */}
              <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="text-xs font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    Quem já pagou ({reportStats.paidCount})
                  </h5>
                  <span className="text-[10px] font-black text-slate-400 font-mono">Mensalidade R$ 10,00</span>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
                  {reportStats.paid.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400 font-medium font-sans">Nenhum pagamento registrado neste mês.</p>
                  ) : (
                    reportStats.paid.map((m) => {
                      const monthKey = `${selectedYear}-${selectedMonthReport}`;
                      // Check who recorded it and details
                      const matchRecord = lancamentos.find(
                        (l) => l.categoria === "mensalidade" && l.ministroId === m.id && l.mesReferencia === monthKey
                      );

                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                          <div>
                            <p className="text-xs font-bold text-slate-800 font-sans">{getMinistroPagoDisplayName(m)}</p>
                            {matchRecord && (
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5 font-sans">
                                Registrado em {new Date(matchRecord.data + "T00:00:00").toLocaleDateString("pt-BR")} por {matchRecord.usuario}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-lg font-sans">
                            PAGO ✔
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* PENDING COLUMN */}
              <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    Quem falta pagar ({reportStats.pendingCount})
                  </h5>
                  <span className="text-[10px] font-black text-slate-400 font-sans">R$ 10,00 Pendente</span>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1">
                  {reportStats.pending.length === 0 ? (
                    <p className="text-center py-8 text-xs text-emerald-600 font-bold font-sans">Excelente! Todos os ministros pagaram este mês! 🎉</p>
                  ) : (
                    reportStats.pending.map((m) => {
                      const monthKey = `${selectedYear}-${selectedMonthReport}`;
                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 bg-rose-50/20 hover:bg-rose-50/50 border border-rose-100/50 rounded-xl transition-all">
                          <div>
                            <p className="text-xs font-bold text-slate-700 font-sans">{getMinistroPagoDisplayName(m)}</p>
                          </div>
                          {!isReadOnly ? (
                            <button
                              onClick={() => handleQuickRecordPayment(m, monthKey)}
                              className="text-[10px] font-extrabold uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg border border-transparent transition-all cursor-pointer shadow-sm font-sans"
                            >
                              Baixar
                            </button>
                          ) : (
                            <span className="text-[11px] font-black uppercase text-rose-500 bg-rose-50/55 px-2 py-1 rounded-lg font-sans">
                              PENDENTE
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Movement / Lancamentos lists table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Registro de Lançamentos da Tesouraria</h4>
            <p className="text-xs text-slate-500 mt-1">Exibindo histórico de movimentações financeiras da tesouraria e coordenação.</p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value;
                setItemsPerPage(val === "todos" ? "todos" : Number(val));
              }}
              className="p-2 px-3 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value={5}>Últimos 5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value="todos">Mostrar Todos</option>
            </select>
          </div>
        </div>

        {/* Filters and search box layouts */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, ID, ministro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Meses</option>
              {MONTHS_FULL.map((m, idx) => (
                <option key={idx} value={(idx + 1).toString().padStart(2, "0")}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="todos">Todas Finanças</option>
              <option value="entrada">Apenas Entradas</option>
              <option value="saida">Apenas Saídas</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="todos">Categorias</option>
              <option value="mensalidade">Apenas Mensalidades</option>
              <option value="saldo_anterior">Saldo Anterior</option>
              <option value="outros">Outros Lançamentos</option>
            </select>
          </div>
        </div>

        {/* Lancamentos tabular representation */}
        <div className="overflow-x-auto">
          {paginatedLancamentos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Nenhum lançamento financeiro localizado</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Tente ajustar seus termos de busca ou filtros marcados acima.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest min-w-[90px]">Data</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Lançado Por</th>
                  {!isReadOnly && <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right min-w-[50px]">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLancamentos.map((l) => {
                  const lDate = new Date(l.data + "T00:00:00");
                  const formattedDate = lDate.toLocaleDateString("pt-BR");
                  
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 text-xs font-bold text-slate-600">{formattedDate}</td>
                      <td className="py-3 px-2 text-xs">
                        {l.tipo === "entrada" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <ArrowUpRight className="w-3 h-3" /> Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-500 border border-rose-100">
                            <ArrowDownRight className="w-3 h-3" /> Saída
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-xs font-bold">
                        {l.categoria === "mensalidade" ? (
                          <span className="text-blue-600 italic">Mensalidade</span>
                        ) : l.categoria === "saldo_anterior" ? (
                          <span className="text-purple-600 font-bold italic">Saldo Anterior</span>
                        ) : (
                          <span className="text-slate-500 italic">Outros</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-600">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {l.categoria === "mensalidade" 
                              ? `Mensalidade ref. ${l.mesReferencia?.split("-")[1]}/${l.mesReferencia?.split("-")[0]} - ${l.ministroNome}` 
                              : l.categoria === "saldo_anterior"
                              ? (l.descricao || "Saldo Anterior do Caixa")
                              : l.descricao
                            }
                          </p>
                          {l.categoria !== "mensalidade" && l.categoria !== "saldo_anterior" && l.descricao && (
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{l.descricao}</p>
                          )}
                          <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{l.id}</p>
                        </div>
                      </td>
                      <td className={`py-3 px-2 text-xs font-black ${l.tipo === "entrada" ? "text-emerald-600" : "text-rose-500"}`}>
                        R$ {l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500 text-right">{l.usuario}</td>
                      {!isReadOnly && (
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleDeleteEntry(l.id, l.categoria === "mensalidade" ? `Mensalidade de ${l.ministroNome}` : l.descricao || `Lançamento ${l.id}`)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all inline-flex cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {sortedLancamentos.length > 0 && itemsPerPage !== "todos" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-700">{Math.min((currentPage - 1) * (itemsPerPage as number) + 1, sortedLancamentos.length)}</span> até <span className="font-bold text-slate-700">{Math.min(currentPage * (itemsPerPage as number), sortedLancamentos.length)}</span> de <span className="font-bold text-slate-700">{sortedLancamentos.length}</span> lançamentos
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((pageNum, idx) => {
                if (pageNum === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs font-bold select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 outline-none w-full max-w-lg p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Registrar Novo Lançamento Financeiro
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-black p-1 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitEntry} className="space-y-4">
                {/* Tipo de movimentação: Entrada ou saida */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Caixa</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: "entrada" }))}
                      className={`py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 border ${
                        formData.tipo === "entrada"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Entrada / Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: "saida", categoria: "outros" }))} // Monthly is entries only
                      className={`py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 border ${
                        formData.tipo === "saida"
                          ? "bg-rose-50 text-rose-500 border-rose-200 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Saída / Despesa
                    </button>
                  </div>
                </div>

                {/* Category (only available for entries) */}
                {formData.tipo === "entrada" ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoria: "mensalidade" }))}
                        className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          formData.categoria === "mensalidade"
                            ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Mensalidade
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoria: "saldo_anterior", descricao: prev.descricao || "Saldo Anterior do Caixa" }))}
                        className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          formData.categoria === "saldo_anterior"
                            ? "bg-purple-50 text-purple-600 border-purple-200 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Saldo Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoria: "outros" }))}
                        className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          formData.categoria === "outros"
                            ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Outros
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Ministro Pagador - only if Category is Mensalidade */}
                {formData.tipo === "entrada" && formData.categoria === "mensalidade" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ministro Pagador</label>
                      <select
                        value={formData.ministroId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const selectedMinistro = ministros.find(m => String(m.id) === id);
                          let valor = formData.valor;
                          if (formData.tipoValor === "fixo") {
                            valor = selectedMinistro?.tipo === "casal" ? "20,00" : "10,00";
                          }
                          setFormData(prev => ({ ...prev, ministroId: id, valor }));
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700"
                        required
                      >
                        <option value="">Selecione o ministro...</option>
                        {ministros.map((m) => (
                          <option key={m.id} value={m.id}>
                            {getMinistroPagoDisplayName(m)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Mês de Referência</label>
                      <input
                        type="month"
                        value={formData.mesReferencia}
                        onChange={(e) => setFormData(prev => ({ ...prev, mesReferencia: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Amount Valor and Data de Lançamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: formatCurrency(e.target.value) }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo Valor</label>
                    <select
                      value={formData.tipoValor}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipoValor: e.target.value as "fixo" | "variado" }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700 font-bold bg-white"
                    >
                      <option value="fixo">Fixo</option>
                      <option value="variado">Variado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Data do Lançamento</label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700 font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Additional Description - optional */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição / Notas complementares</label>
                  <textarea
                    placeholder={
                      formData.categoria === "mensalidade" 
                        ? "Ex: Pago em dinheiro para o tesoureiro" 
                        : formData.categoria === "saldo_anterior"
                        ? "Ex: Saldo vindo do exercício anterior ou conta bancária"
                        : "Ex: Compra de materiais de escritório, hóstias, etc."
                    }
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-700"
                    rows={3}
                  />
                </div>

                {/* Buttons block */}
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {submitting ? "Registrando..." : "Confirmar Lançamento"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showPrintModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-report-area, #printable-report-area * {
                  visibility: visible !important;
                }
                #printable-report-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: black !important;
                  padding: 20px !important;
                }
              }
            `}</style>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 font-sans">
                    <Check className="w-5 h-5 text-emerald-500" />
                    Visualização e Impressão de Relatório
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider font-sans">
                    Gabarito de Mensalidades {selectedYear}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPrintType(prev => prev === "mensal" ? "anual" : "mensal")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                  >
                    Mudar para Relatório {printType === "mensal" ? "Anual" : "Mensal"}
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-black p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Area starts here */}
              <div id="printable-report-area" className="border border-slate-200 rounded-2xl p-6 bg-white space-y-6">
                
                {/* Report Header */}
                <div className="border-b-2 border-slate-900 pb-4 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight font-sans">RELATÓRIO DE QUITAÇÃO DA MENSALIDADE</h2>
                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide font-sans">
                      Ministério de Acólitos e Ministros da Comunhão
                    </p>
                  </div>
                  <div className="text-right sm:text-right text-xs font-semibold text-slate-700 font-sans">
                    <p>Ano Corrente: <strong className="text-slate-900">{selectedYear}</strong></p>
                    <p>Gerado em: <strong className="text-slate-900">{new Date().toLocaleDateString("pt-BR")}</strong></p>
                  </div>
                </div>

                {printType === "mensal" ? (
                  /* MONTH REPORT PRINT LAYOUT */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest font-sans">Módulo Mensal Escolhido</p>
                        <h3 className="text-sm font-extrabold text-blue-600 uppercase mt-0.5 font-sans">{MONTHS_FULL[Number(selectedMonthReport) - 1]} de {selectedYear}</h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center font-sans">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Pagantes</p>
                          <p className="text-sm font-black text-slate-800">{reportStats.paidCount} / {reportStats.total}</p>
                        </div>
                        <div className="text-center font-sans">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Arrecadado</p>
                          <p className="text-sm font-black text-emerald-600">R$ {(reportStats.paidCount * 10).toFixed(2)}</p>
                        </div>
                        <div className="text-center font-sans">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Pendente</p>
                          <p className="text-sm font-black text-rose-500">R$ {(reportStats.pendingCount * 10).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* PAID LIST FOR PRINT */}
                      <div className="space-y-3 font-sans">
                        <h4 className="text-xs font-black uppercase text-emerald-600 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                          <span>✔ Mensalidades Recebidas ({reportStats.paidCount})</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">Total: R$ {(reportStats.paidCount * 10).toFixed(2)}</span>
                        </h4>
                        
                        {reportStats.paid.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nenhum pagamento registrado neste mês.</p>
                        ) : (
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400">
                                <th className="py-1">Nome do Ministro</th>
                                <th className="py-1 text-right font-sans">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {reportStats.paid.map((m) => (
                                <tr key={m.id}>
                                  <td className="py-1.5 font-bold">
                                    {getMinistroPagoDisplayName(m)}
                                  </td>
                                  <td className="py-1.5 text-right font-black text-emerald-600">R$ 10,00</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* PENDING LIST FOR PRINT */}
                      <div className="space-y-3 font-sans">
                        <h4 className="text-xs font-black uppercase text-rose-500 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                          <span>✖ Mensalidades Pendentes ({reportStats.pendingCount})</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">Total: R$ {(reportStats.pendingCount * 10).toFixed(2)}</span>
                        </h4>
                        
                        {reportStats.pending.length === 0 ? (
                          <p className="text-xs text-emerald-600 font-bold italic">Sem pendências para este mês!</p>
                        ) : (
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400">
                                <th className="py-1">Nome do Ministro</th>
                                <th className="py-1 text-right font-sans">Pendente</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {reportStats.pending.map((m) => (
                                <tr key={m.id}>
                                  <td className="py-1.5 font-bold">
                                    {getMinistroPagoDisplayName(m)}
                                  </td>
                                  <td className="py-1.5 text-right font-black text-rose-500">R$ 10,00</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ANNUAL REPORT PRINT LAYOUT */
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-sans">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Gabarito Consolidado Geral</p>
                        <h3 className="text-sm font-extrabold text-blue-600 uppercase mt-0.5">Exibição de Quitação - {selectedYear}</h3>
                      </div>
                      <div className="flex gap-4 font-sans">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Ministros</p>
                          <p className="text-sm font-black text-slate-800">{ministros.length}</p>
                        </div>
                        <div className="text-center font-mono">
                          <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Total Arrecadado</p>
                          <p className="text-sm font-black text-emerald-600">
                            R$ {annualReportStats.reduce((acc, curr) => acc + curr.totalPaid, 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center font-mono">
                          <p className="text-[10px] text-slate-400 font-sans font-bold uppercase">Falta Arrecadar</p>
                          <p className="text-sm font-black text-rose-500">
                            R$ {annualReportStats.reduce((acc, curr) => acc + curr.totalPending, 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-700 font-extrabold bg-slate-100/50">
                            <th className="py-2 px-1">Nome do Ministro</th>
                            {MONTHS_SHORT.map((m, idx) => (
                              <th key={idx} className="py-2 px-[2px] text-center font-black">{m}</th>
                            ))}
                            <th className="py-2 px-1 text-right font-sans">R$ Pago</th>
                            <th className="py-2 px-1 text-right font-sans">R$ Aberto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {annualReportStats.map((item) => (
                            <tr key={item.ministro.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-1 font-bold text-slate-800">
                                {getMinistroPagoDisplayName(item.ministro)}
                              </td>
                              {item.details.map((m, idx) => (
                                <td key={idx} className="py-1.5 px-[2px] text-center font-bold text-xs">
                                  {m.paid ? (
                                    <span className="text-emerald-600">✔</span>
                                  ) : (
                                    <span className="text-slate-300 select-none">-</span>
                                  )}
                                </td>
                              ))}
                              <td className="py-1.5 px-1 text-right font-black text-emerald-600">R$ {item.totalPaid.toFixed(2)}</td>
                              <td className="py-1.5 px-1 text-right font-black text-rose-500">R$ {item.totalPending.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer Signature */}
                <div className="pt-20 border-t border-dashed border-slate-350 flex justify-between items-center text-[10px] text-slate-400 font-bold font-sans uppercase">
                  <div className="border-t border-slate-400 w-48 text-center pt-2">
                    Coordenação da Escala
                  </div>
                  <div className="text-center font-mono tracking-tight lowercase">
                    {window.location.hostname} • folha oficial de tesouraria
                  </div>
                  <div className="border-t border-slate-400 w-48 text-center pt-2">
                    Tesoureiro Responsável
                  </div>
                </div>

              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                >
                  Fechar Visualização
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Confirmar e Imprimir Relatório
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
