import React, { useState } from "react";
import { RepositorioData } from "../types";
import { exportToCsv, exportToJson, generateBigQueryScript } from "../utils/exportUtils";
import {
  X,
  FileSpreadsheet,
  FileCode,
  Database,
  Copy,
  Check,
  Download,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: RepositorioData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  repository,
}) => {
  const [activeTab, setActiveTab] = useState<"bq" | "csv" | "json">("bq");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bigQuerySql = generateBigQueryScript(repository);

  const handleCopyBq = () => {
    navigator.clipboard.writeText(bigQuerySql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Exportar Dados da Sessão</h2>
              <p className="text-xs text-slate-400">
                Integração com BigQuery, planilhas CSV e payload JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("bq")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "bq"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>BigQuery SQL Schema</span>
          </button>

          <button
            onClick={() => setActiveTab("csv")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "csv"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Planilha CSV</span>
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "json"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON Completo</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {activeTab === "bq" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>DDL DML SQL pré-formatado para ingestão no Google BigQuery:</span>
                <button
                  onClick={handleCopyBq}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copiado!" : "Copiar SQL"}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-[320px] scrollbar-thin">
                {bigQuerySql}
              </pre>
            </div>
          )}

          {activeTab === "csv" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Gera um arquivo <strong>.CSV</strong> pronto para importação no Excel, Google Sheets ou sistemas de inventário de redes telecom.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-400">
                <div>Itens exportados: {repository.itens.length} registros</div>
                <div>Repositório: {repository.nome}</div>
                <div>Status das Validações: Inclui confirmações e correções humanas</div>
              </div>
              <button
                onClick={() => exportToCsv(repository)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo CSV</span>
              </button>
            </div>
          )}

          {activeTab === "json" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Exporta o estado completo da sessão do repositório em formato <strong>JSON</strong> estruturado para backup ou integração com APIs backend.
              </p>
              <button
                onClick={() => exportToJson(repository)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Payload JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
