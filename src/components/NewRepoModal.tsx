import React, { useState } from "react";
import { FolderPlus, X, Server, Radio, TowerControl, Folder } from "lucide-react";

interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRepo: (nome: string, descricao: string, icone: string) => void;
}

export const NewRepoModal: React.FC<NewRepoModalProps> = ({
  isOpen,
  onClose,
  onCreateRepo,
}) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("Server");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onCreateRepo(nome.trim(), descricao.trim() || "Repositório personalizado de equipamentos", icone);
    setNome("");
    setDescricao("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Criar Novo Repositório</h2>
              <p className="text-xs text-slate-400">Novo Lote Local de Equipamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Repositório / Lote <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pop Telecom Zona Norte - Gabinete 02"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição dos equipamentos ou localização..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ícone Visual</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "Server", label: "Datacenter", icon: Server },
                { id: "Radio", label: "Telecom", icon: Radio },
                { id: "TowerControl", label: "Rádio ERB", icon: TowerControl },
                { id: "Folder", label: "Geral", icon: Folder },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcone(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      icone === item.id
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-950/40"
            >
              Criar Lote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
