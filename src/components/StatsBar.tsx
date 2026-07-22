import React from "react";
import { CheckCircle2, AlertCircle, Clock, XCircle, BarChart3 } from "lucide-react";

interface StatsBarProps {
  total: number;
  pendentes: number;
  confirmados: number;
  corrigidos: number;
  rejeitados: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  total,
  pendentes,
  confirmados,
  corrigidos,
  rejeitados,
}) => {
  const concluidos = confirmados + corrigidos;
  const pctConcluido = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-slate-400">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Progresso do Lote:</span>
          <span className="font-bold text-slate-100 font-mono">{pctConcluido}%</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-32 sm:w-48 h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${total > 0 ? (confirmados / total) * 100 : 0}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Confirmados: ${confirmados}`}
          />
          <div
            style={{ width: `${total > 0 ? (corrigidos / total) * 100 : 0}%` }}
            className="bg-cyan-500 h-full transition-all"
            title={`Corrigidos: ${corrigidos}`}
          />
          <div
            style={{ width: `${total > 0 ? (rejeitados / total) * 100 : 0}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Rejeitados: ${rejeitados}`}
          />
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>{confirmados} Confirmados</span>
        </div>
        <div className="flex items-center gap-1 text-cyan-400">
          <AlertCircle className="w-3 h-3" />
          <span>{corrigidos} Corrigidos</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <Clock className="w-3 h-3" />
          <span>{pendentes} Pendentes</span>
        </div>
      </div>
    </div>
  );
};
