import React, { useState, useEffect } from "react";
import { FolderPlus, X, Server, Radio, TowerControl, Folder, AlertCircle, Sparkles, Check } from "lucide-react";

interface NewRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRepo: (nome: string, descricao: string, icone: string) => void;
}

const ESTADOS_UF = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
];

export const NewRepoModal: React.FC<NewRepoModalProps> = ({
  isOpen,
  onClose,
  onCreateRepo,
}) => {
  const [uf, setUf] = useState("SP");
  const [loc, setLoc] = useState("SPO");
  const [est, setEst] = useState("EST01");

  const [nomeCustomizado, setNomeCustomizado] = useState("SP-SPO-EST01");
  const [useCompositeBuilder, setUseCompositeBuilder] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("Server");
  const [formatError, setFormatError] = useState(false);

  // Auto update nomeCustomizado when composite fields change
  useEffect(() => {
    if (useCompositeBuilder) {
      const cleanUf = uf.trim().toUpperCase() || "UF";
      const cleanLoc = loc.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "LOC";
      const cleanEst = est.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "EST";
      setNomeCustomizado(`${cleanUf}-${cleanLoc}-${cleanEst}`);
      setFormatError(false);
    }
  }, [uf, loc, est, useCompositeBuilder]);

  if (!isOpen) return null;

  // Validate pattern UF-LOC-EST (ex: SP-SPO-EST01)
  const validateFormat = (value: string) => {
    const parts = value.split("-");
    if (parts.length < 3) return false;
    if (parts[0].length !== 2) return false;
    if (parts[1].length < 2) return false;
    if (parts[2].length < 2) return false;
    return true;
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setNomeCustomizado(val);
    setFormatError(!validateFormat(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nomeCustomizado.trim().toUpperCase();

    if (!finalName) return;

    if (!validateFormat(finalName)) {
      setFormatError(true);
      return;
    }

    onCreateRepo(
      finalName,
      descricao.trim() || `Lote técnico de equipamentos da estação ${finalName}`,
      icone
    );

    // Reset default form state
    setUf("SP");
    setLoc("SPO");
    setEst("EST01");
    setDescricao("");
    setFormatError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Criar Novo Repositório / Lote</h2>
              <p className="text-xs text-indigo-400 font-mono">Padrão Obrigatório: UF-LOC-EST</p>
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
          {/* Builder Selector Tabs */}
          <div className="flex items-center justify-between bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setUseCompositeBuilder(true)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                useCompositeBuilder
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Assistente UF-LOC-EST
            </button>
            <button
              type="button"
              onClick={() => setUseCompositeBuilder(false)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                !useCompositeBuilder
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Digitação Livre
            </button>
          </div>

          {useCompositeBuilder ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                Compor Código do Lote <span className="text-rose-400">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* UF */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">UF (Estado)</label>
                  <select
                    value={uf || "SP"}
                    onChange={(e) => setUf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ESTADOS_UF.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LOC */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">LOC (Cidade/Site)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={loc || ""}
                    onChange={(e) => setLoc(e.target.value.toUpperCase())}
                    placeholder="Ex: SPO"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono font-bold uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* EST */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">EST (Estação/Pop)</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={est || ""}
                    onChange={(e) => setEst(e.target.value.toUpperCase())}
                    placeholder="Ex: EST01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono font-bold uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Nome do Repositório / Lote <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nomeCustomizado || ""}
                onChange={handleCustomNameChange}
                placeholder="Ex: SP-SPO-EST01 ou RJ-RJO-POP04"
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none ${
                  formatError
                    ? "border-rose-500/80 focus:border-rose-500"
                    : "border-slate-800 focus:border-indigo-500"
                }`}
              />
              {formatError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  O nome deve seguir o padrão UF-LOC-EST (Ex: SP-SPO-EST01).
                </p>
              )}
            </div>
          )}

          {/* Resulting Preview Name Badge */}
          <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Nome Gerado Padronizado:</span>
            <span className="font-mono font-bold text-indigo-300 text-sm bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/40">
              {nomeCustomizado}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={descricao || ""}
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
              disabled={formatError || !nomeCustomizado.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-950/40"
            >
              Criar Lote ({nomeCustomizado})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
