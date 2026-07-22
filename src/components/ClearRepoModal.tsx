import React, { useState } from "react";
import { RepositorioData } from "../types";
import { Trash2, Eraser, AlertTriangle, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface ClearRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRepo: RepositorioData;
  onClearItems: (repoId: string) => void;
  onDeleteRepo: (repoId: string) => void;
  onResetAllRepos: () => void;
}

export const ClearRepoModal: React.FC<ClearRepoModalProps> = ({
  isOpen,
  onClose,
  currentRepo,
  onClearItems,
  onDeleteRepo,
  onResetAllRepos,
}) => {
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalItems = currentRepo.itens.length;

  const handleClearItems = () => {
    onClearItems(currentRepo.id);
    setActionSuccessMsg(`Todas as ${totalItems} imagens do lote "${currentRepo.nome}" foram removidas.`);
    setTimeout(() => {
      setActionSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleDeleteRepo = () => {
    onDeleteRepo(currentRepo.id);
    setActionSuccessMsg(`Repositório "${currentRepo.nome}" excluído com sucesso.`);
    setTimeout(() => {
      setActionSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleResetAll = () => {
    onResetAllRepos();
    setActionSuccessMsg("Todos os repositórios foram restaurados para o estado padrão.");
    setTimeout(() => {
      setActionSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Eraser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Limpar Repositório / Lote</h2>
              <p className="text-xs text-rose-400 font-mono">{currentRepo.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {actionSuccessMsg ? (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Atenção ao gerenciar dados do lote</p>
                  <p className="text-amber-300/80 text-[11px]">
                    Este lote possui atualmente <strong className="text-white">{totalItems} imagens</strong> registradas.
                    Escolha a ação desejada abaixo:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Option 1: Clear items inside current repo */}
                <button
                  onClick={handleClearItems}
                  disabled={totalItems === 0}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 transition-all flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 group-hover:scale-105 transition-transform">
                      <Eraser className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        Esvaziar Fotos do Lote Atual
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Remove todas as {totalItems} fotos mantendo o lote "{currentRepo.nome}" ativo.
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Delete repository completely */}
                <button
                  onClick={handleDeleteRepo}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-rose-500/50 bg-slate-950/60 hover:bg-rose-950/20 text-slate-200 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 group-hover:scale-105 transition-transform">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-rose-300">
                        Excluir Lote Selecionado
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Remove o lote "{currentRepo.nome}" e todo o seu conteúdo do sistema.
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 3: Reset all to initial state */}
                <button
                  onClick={handleResetAll}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        Restaurar Todos os Lotes Padrão
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Restaura a lista inicial de demonstração (UF-LOC-EST) limpando edições.
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
