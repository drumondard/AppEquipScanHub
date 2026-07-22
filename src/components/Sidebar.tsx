import React, { useState } from "react";
import { RepositorioData } from "../types";
import {
  Folder,
  FolderPlus,
  ImagePlus,
  Server,
  Radio,
  TowerControl,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Database,
} from "lucide-react";

interface SidebarProps {
  repositories: RepositorioData[];
  selectedRepoId: string;
  onSelectRepo: (id: string) => void;
  onOpenNewRepoModal: () => void;
  onOpenUploadModal: () => void;
  onOpenExportModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repositories,
  selectedRepoId,
  onSelectRepo,
  onOpenNewRepoModal,
  onOpenUploadModal,
  onOpenExportModal,
  isCollapsed,
  onToggleCollapse,
}) => {
  const currentRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  const getRepoIcon = (iconName: string) => {
    switch (iconName) {
      case "Server":
        return <Server className="w-4 h-4 text-cyan-400" />;
      case "Radio":
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case "TowerControl":
        return <TowerControl className="w-4 h-4 text-amber-400" />;
      default:
        return <Folder className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-20 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-sm">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm tracking-wide">Repositórios</h2>
              <p className="text-[11px] text-slate-400">Seleção Dinâmica de Lotes</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title={isCollapsed ? "Expandir Lateral" : "Recolher Lateral"}
        >
          <ChevronRight className={`w-4 h-4 transform transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Main Repositories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {!isCollapsed && (
          <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-2">
            Diretórios Locais & Lotes
          </div>
        )}

        {repositories.map((repo) => {
          const isSelected = repo.id === selectedRepoId;
          const total = repo.itens.length;
          const confirmados = repo.itens.filter((i) => i.validacaoHumana.status === "Confirmado").length;
          const corrigidos = repo.itens.filter((i) => i.validacaoHumana.status === "Corrigido").length;
          const pendentes = repo.itens.filter((i) => i.validacaoHumana.status === "Pendente").length;

          return (
            <button
              key={repo.id}
              onClick={() => onSelectRepo(repo.id)}
              className={`w-full text-left rounded-xl p-3 transition-all flex flex-col gap-2 group ${
                isSelected
                  ? "bg-slate-800/90 border border-indigo-500/40 shadow-lg shadow-indigo-950/20 text-slate-100"
                  : "hover:bg-slate-800/50 border border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isSelected ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    {getRepoIcon(repo.icone)}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-slate-200 truncate group-hover:text-white">
                        {repo.nome}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{total} imagens registradas</div>
                    </div>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60 text-[10px]">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3 h-3" />
                    <span>{pendentes} pend.</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{confirmados} conf.</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{corrigidos} corr.</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/80">
        {!isCollapsed ? (
          <>
            <button
              onClick={onOpenUploadModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs transition-colors shadow-md shadow-indigo-900/30"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Adicionar Fotos ao Lote</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenNewRepoModal}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Novo Lote</span>
              </button>

              <button
                onClick={onOpenExportModal}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={onOpenUploadModal}
              className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              title="Adicionar Fotos"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewRepoModal}
              className="p-2.5 bg-slate-800 text-indigo-400 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              title="Novo Repositório"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenExportModal}
              className="p-2.5 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              title="Exportar Dados"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
