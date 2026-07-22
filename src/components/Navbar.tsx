import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Cpu,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Download,
} from "lucide-react";
import { StatusValidacao } from "../types";

interface NavbarProps {
  repoName: string;
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    total: number;
    pendentes: number;
    confirmados: number;
    corrigidos: number;
    rejeitados: number;
  };
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  repoName,
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
  onOpenExportModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 z-10 shadow-sm">
      {/* Brand & Repositories Label */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/40 font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-wide bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                AppEquipScan
              </h1>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                IA Visão Telecom
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[220px]" title={repoName}>
              {repoName}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Navigation (Anterior & Próxima) */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={onPrevious}
          disabled={totalItems <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors border border-slate-700/60"
          title="Anterior (Atalho: Seta Esquerda ←)"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="px-3 py-1 text-center font-mono text-xs text-slate-300">
          {totalItems > 0 ? (
            <span className="font-semibold text-indigo-300">
              {currentIndex + 1} <span className="text-slate-500">/</span> {totalItems}
            </span>
          ) : (
            <span className="text-slate-500">0 / 0</span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={totalItems <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors border border-slate-700/60"
          title="Próxima (Atalho: Seta Direita →)"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <button
          onClick={() => onFilterChange("Todos")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            filterStatus === "Todos"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/40"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40"
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] opacity-75 font-mono">({counts.total})</span>
        </button>

        <button
          onClick={() => onFilterChange("Pendente")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            filterStatus === "Pendente"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-slate-800/80 text-amber-400/90 hover:text-amber-300 border border-slate-700/40"
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Pendentes</span>
          <span className="text-[10px] font-mono">({counts.pendentes})</span>
        </button>

        <button
          onClick={() => onFilterChange("Confirmado")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            filterStatus === "Confirmado"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-800/80 text-emerald-400/90 hover:text-emerald-300 border border-slate-700/40"
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Confirmados</span>
          <span className="text-[10px] font-mono">({counts.confirmados})</span>
        </button>

        <button
          onClick={() => onFilterChange("Corrigido")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            filterStatus === "Corrigido"
              ? "bg-cyan-600 text-white shadow-sm"
              : "bg-slate-800/80 text-cyan-400/90 hover:text-cyan-300 border border-slate-700/40"
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Corrigidos</span>
          <span className="text-[10px] font-mono">({counts.corrigidos})</span>
        </button>
      </div>

      {/* Search & Export Action */}
      <div className="flex items-center gap-2">
        <div className="relative w-36 sm:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm shadow-emerald-950/30"
          title="Exportar dados para CSV, JSON ou BigQuery"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
