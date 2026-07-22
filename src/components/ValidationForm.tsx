import React, { useState, useEffect } from "react";
import {
  EquipamentoItem,
  CategoriaEquipamento,
  NivelConfianca,
  StatusValidacao,
  BoundingBox,
} from "../types";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  Save,
  ArrowRight,
  RefreshCw,
  Copy,
  Edit3,
  UserCheck,
  ShieldAlert,
  Sliders,
  Tag,
  Building,
  Crop,
  Barcode,
  Cpu,
} from "lucide-react";

interface ValidationFormProps {
  item: EquipamentoItem;
  onUpdateValidation: (
    updatedFields: Partial<EquipamentoItem["validacaoHumana"]>
  ) => void;
  onConfirmAndNext: () => void;
  onReanalyzeWithAi: () => void;
  isLoadingIa: boolean;
  onUpdateBoundingBox?: (newBox: BoundingBox) => void;
}

export const ValidationForm: React.FC<ValidationFormProps> = ({
  item,
  onUpdateValidation,
  onConfirmAndNext,
  onReanalyzeWithAi,
  isLoadingIa,
  onUpdateBoundingBox,
}) => {
  // Retrieve persistent operator name or item operator or empty
  const getInitialOperator = () => {
    return item.validacaoHumana.operador || localStorage.getItem("appequipscan_operador") || "";
  };

  // Local Form state synced with active item
  const [equipamentoInput, setEquipamentoInput] = useState(
    item.validacaoHumana.equipamentoConfirmado || item.sugestaoIa.equipamentoIdentificado
  );
  const [fabricanteInput, setFabricanteInput] = useState(
    item.validacaoHumana.fabricanteConfirmado || item.sugestaoIa.fabricante || ""
  );
  const [numeroSerieInput, setNumeroSerieInput] = useState(
    item.validacaoHumana.numeroSerieConfirmado || item.sugestaoIa.numeroSerie || ""
  );
  const [categoriaInput, setCategoriaInput] = useState<CategoriaEquipamento>(
    item.validacaoHumana.categoriaConfirmada || item.sugestaoIa.categoria || "Outro"
  );
  const [confiancaInput, setConfiancaInput] = useState<NivelConfianca>(
    item.validacaoHumana.nivelConfiancaFinal || item.sugestaoIa.nivelConfianca || "Alto"
  );
  const [observacoesInput, setObservacoesInput] = useState(
    item.validacaoHumana.observacoesFinais || item.sugestaoIa.observacoesTecnicas
  );
  const [operadorInput, setOperadorInput] = useState(getInitialOperator());
  const [operadorError, setOperadorError] = useState(false);

  // Local Bounding Box state
  const bbox = item.sugestaoIa.boundingBox || { ymin: 20, xmin: 15, ymax: 80, xmax: 85 };
  const [ymin, setYmin] = useState(bbox.ymin);
  const [xmin, setXmin] = useState(bbox.xmin);
  const [ymax, setYmax] = useState(bbox.ymax);
  const [xmax, setXmax] = useState(bbox.xmax);

  // Sync state whenever selected item changes
  useEffect(() => {
    setEquipamentoInput(
      item.validacaoHumana.equipamentoConfirmado || item.sugestaoIa.equipamentoIdentificado
    );
    setFabricanteInput(
      item.validacaoHumana.fabricanteConfirmado || item.sugestaoIa.fabricante || ""
    );
    setNumeroSerieInput(
      item.validacaoHumana.numeroSerieConfirmado || item.sugestaoIa.numeroSerie || ""
    );
    setCategoriaInput(
      item.validacaoHumana.categoriaConfirmada || item.sugestaoIa.categoria || "Outro"
    );
    setConfiancaInput(
      item.validacaoHumana.nivelConfiancaFinal || item.sugestaoIa.nivelConfianca || "Alto"
    );
    setObservacoesInput(
      item.validacaoHumana.observacoesFinais || item.sugestaoIa.observacoesTecnicas
    );
    setOperadorInput(getInitialOperator());
    setOperadorError(false);

    if (item.sugestaoIa.boundingBox) {
      setYmin(item.sugestaoIa.boundingBox.ymin);
      setXmin(item.sugestaoIa.boundingBox.xmin);
      setYmax(item.sugestaoIa.boundingBox.ymax);
      setXmax(item.sugestaoIa.boundingBox.xmax);
    }
  }, [item]);

  const handleOperatorChange = (val: string) => {
    setOperadorInput(val);
    setOperadorError(false);
    if (val.trim()) {
      localStorage.setItem("appequipscan_operador", val.trim());
    }
  };

  const validateOperator = () => {
    if (!operadorInput.trim()) {
      setOperadorError(true);
      return false;
    }
    setOperadorError(false);
    return true;
  };

  const handleCopyFromAi = () => {
    setEquipamentoInput(item.sugestaoIa.equipamentoIdentificado);
    if (item.sugestaoIa.fabricante) setFabricanteInput(item.sugestaoIa.fabricante);
    if (item.sugestaoIa.numeroSerie) setNumeroSerieInput(item.sugestaoIa.numeroSerie);
    if (item.sugestaoIa.categoria) setCategoriaInput(item.sugestaoIa.categoria);
    setConfiancaInput(item.sugestaoIa.nivelConfianca);
    setObservacoesInput(item.sugestaoIa.observacoesTecnicas);
  };

  const handleBboxChange = (newYmin: number, newXmin: number, newYmax: number, newXmax: number) => {
    setYmin(newYmin);
    setXmin(newXmin);
    setYmax(newYmax);
    setXmax(newXmax);
    const newBox: BoundingBox = {
      ymin: Math.max(0, Math.min(100, newYmin)),
      xmin: Math.max(0, Math.min(100, newXmin)),
      ymax: Math.max(0, Math.min(100, newYmax)),
      xmax: Math.max(0, Math.min(100, newXmax)),
    };
    if (onUpdateBoundingBox) {
      onUpdateBoundingBox(newBox);
    }
  };

  const handleConfirmAndAdvance = () => {
    if (!validateOperator()) return;

    onUpdateValidation({
      status: "Confirmado",
      equipamentoConfirmado: equipamentoInput,
      fabricanteConfirmado: fabricanteInput,
      numeroSerieConfirmado: numeroSerieInput,
      categoriaConfirmada: categoriaInput,
      nivelConfiancaFinal: confiancaInput,
      observacoesFinais: observacoesInput,
      operador: operadorInput.trim(),
      dataValidacao: new Date().toLocaleString("pt-BR"),
      editadoPeloOperador: false,
    });
    onConfirmAndNext();
  };

  const handleSaveCorrection = () => {
    if (!validateOperator()) return;

    onUpdateValidation({
      status: "Corrigido",
      equipamentoConfirmado: equipamentoInput,
      fabricanteConfirmado: fabricanteInput,
      numeroSerieConfirmado: numeroSerieInput,
      categoriaConfirmada: categoriaInput,
      nivelConfiancaFinal: confiancaInput,
      observacoesFinais: observacoesInput,
      operador: operadorInput.trim(),
      dataValidacao: new Date().toLocaleString("pt-BR"),
      editadoPeloOperador: true,
    });
  };

  const handleReject = () => {
    if (!validateOperator()) return;

    onUpdateValidation({
      status: "Rejeitado",
      equipamentoConfirmado: equipamentoInput,
      fabricanteConfirmado: fabricanteInput,
      numeroSerieConfirmado: numeroSerieInput,
      categoriaConfirmada: categoriaInput,
      nivelConfiancaFinal: confiancaInput,
      observacoesFinais: observacoesInput,
      operador: operadorInput.trim(),
      dataValidacao: new Date().toLocaleString("pt-BR"),
      editadoPeloOperador: true,
    });
  };

  const isEdited =
    equipamentoInput !== item.sugestaoIa.equipamentoIdentificado ||
    numeroSerieInput !== (item.sugestaoIa.numeroSerie || "") ||
    observacoesInput !== item.sugestaoIa.observacoesTecnicas;

  return (
    <div className="w-full lg:w-[440px] xl:w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto">
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">Painel de Validação</h2>
              <p className="text-[11px] text-slate-400">Validação Humana Lado a Lado</p>
            </div>
          </div>

          <button
            onClick={onReanalyzeWithAi}
            disabled={isLoadingIa}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 rounded-lg text-xs font-medium transition-colors border border-indigo-500/30 shadow-sm"
            title="Executar análise Gemini Vision IA novamente"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIa ? "animate-spin" : ""}`} />
            <span>{isLoadingIa ? "Analisando..." : "Reanalisar IA"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Operator Mandatory Banner Warning */}
        {operadorError && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-start gap-2 text-xs text-rose-200 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção: Operador Obrigatório</p>
              <p className="text-[11px] text-rose-300">
                Por favor, preencha o campo <strong>"Operador Responsável"</strong> abaixo para registrar quem validou a imagem.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Sugestão Automática da IA */}
        <div className="rounded-xl bg-slate-950 border border-indigo-900/40 p-3.5 space-y-3 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sugestão Automática Gemini IA</span>
            </div>
            <button
              onClick={handleCopyFromAi}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Copiar dados da IA para o formulário"
            >
              <Copy className="w-3 h-3" />
              <span>Copiar para Formulário</span>
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 font-sans font-semibold">- Equipamento/Placa: </span>
              <span className="text-indigo-200 font-bold">
                {item.sugestaoIa.equipamentoIdentificado}
              </span>
            </div>

            {item.sugestaoIa.fabricante && (
              <div>
                <span className="text-slate-500 font-sans font-semibold">- Fabricante: </span>
                <span className="text-slate-200 font-bold">{item.sugestaoIa.fabricante}</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 font-sans font-semibold">- Número de Série (S/N): </span>
              <span className="text-amber-300 font-bold">
                {item.sugestaoIa.numeroSerie || "S/N não detectado"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-sans font-semibold">- Nível de Confiança: </span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  item.sugestaoIa.nivelConfianca === "Alto"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : item.sugestaoIa.nivelConfianca === "Médio"
                    ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                    : "bg-rose-950 text-rose-400 border border-rose-800/60"
                }`}
              >
                {item.sugestaoIa.nivelConfianca}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-sans font-semibold">- Observações Técnicas: </span>
              <p className="text-slate-300 font-sans leading-relaxed text-[11px] mt-1 p-2 bg-slate-900/90 rounded border border-slate-800">
                {item.sugestaoIa.observacoesTecnicas}
              </p>
            </div>

            {item.sugestaoIa.especificacoesDetectadas && (
              <div className="pt-1 flex flex-wrap gap-1 font-sans">
                {item.sugestaoIa.especificacoesDetectadas.map((spec, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full"
                  >
                    ✓ {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Ajuste de Bounding Box IA pelo Usuário */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Crop className="w-3.5 h-3.5 text-amber-400" />
              <span>Ajustar Área de Identificação (Bounding Box)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Y:{ymin}%-{ymax}% | X:{xmin}%-{xmax}%
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Você pode desenhar a caixa diretamente na foto usando o botão <strong>"Ajustar Caixa IA"</strong> no topo da imagem, ou ajustar as porcentagens abaixo:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">X Mín - Máx (Largura %)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={xmin}
                  onChange={(e) => handleBboxChange(ymin, Number(e.target.value), ymax, xmax)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-100 font-mono"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={xmax}
                  onChange={(e) => handleBboxChange(ymin, xmin, ymax, Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Y Mín - Máx (Altura %)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={ymin}
                  onChange={(e) => handleBboxChange(Number(e.target.value), xmin, ymax, xmax)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-100 font-mono"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={ymax}
                  onChange={(e) => handleBboxChange(ymin, xmin, Number(e.target.value), xmax)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleBboxChange(10, 10, 90, 90)}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-medium"
            >
              Expandir Toda
            </button>
            <button
              type="button"
              onClick={() => handleBboxChange(25, 20, 75, 80)}
              className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-medium"
            >
              Centralizar 50%
            </button>
          </div>
        </div>

        {/* Section 3: Formulário de Confirmação e Correção Humana */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Formulário de Validação Humana</span>
            </h3>
            {isEdited && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-medium">
                Alterado pelo Operador
              </span>
            )}
          </div>

          {/* Input: Operador Responsável (MANDATORY) */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
            <label className="block text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Operador Responsável</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={operadorInput}
              onChange={(e) => handleOperatorChange(e.target.value)}
              placeholder="Digite seu nome (Ex: Carlos Silva, João Souza)"
              className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                operadorError
                  ? "border-rose-500/90 ring-2 ring-rose-500/30 bg-rose-950/20"
                  : "border-indigo-500/50 focus:border-indigo-400"
              }`}
            />
            {operadorError && (
              <p className="text-[11px] text-rose-400 font-medium">
                Por favor, informe seu nome para registrar a validação do operador.
              </p>
            )}
          </div>

          {/* Input 1: Equipamento / Placa Identificada */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Equipamento ou Modelo de Placa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={equipamentoInput}
              onChange={(e) => setEquipamentoInput(e.target.value)}
              placeholder="Ex: Placa GPON 16 Portas H805GPFD ou Switch C9300-48P"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            />
          </div>

          {/* Input 2: Número de Série (S/N) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-amber-400" />
              <span>Número de Série (S/N / Serial Number)</span>
            </label>
            <input
              type="text"
              value={numeroSerieInput}
              onChange={(e) => setNumeroSerieInput(e.target.value)}
              placeholder="Ex: 210235048210D4001234 ou S/N impresso na etiqueta"
              className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono font-semibold"
            />
          </div>

          {/* Input 3 & 4: Fabricante e Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Fabricante</span>
              </label>
              <input
                type="text"
                value={fabricanteInput}
                onChange={(e) => setFabricanteInput(e.target.value)}
                placeholder="Ex: Cisco, Huawei, ZTE"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Categoria</span>
              </label>
              <select
                value={categoriaInput}
                onChange={(e) => setCategoriaInput(e.target.value as CategoriaEquipamento)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Placa / Módulo de Serviço">Placa / Módulo de Serviço</option>
                <option value="Placa de Controle / CPU">Placa de Controle / CPU</option>
                <option value="Placa de Fonte / Energia">Placa de Fonte / Energia</option>
                <option value="Placa Mãe / Circuit Board">Placa Mãe / Circuit Board</option>
                <option value="Switch">Switch</option>
                <option value="Roteador">Roteador</option>
                <option value="OLT">OLT</option>
                <option value="Patch Panel">Patch Panel</option>
                <option value="Servidor">Servidor</option>
                <option value="Nobreak/UPS">Nobreak/UPS</option>
                <option value="DIO (Fibra)">DIO (Fibra)</option>
                <option value="Retificador 48V">Retificador 48V</option>
                <option value="Gabinete/Rack">Gabinete/Rack</option>
                <option value="Antena 5G">Antena 5G</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Input 4: Nível de Confiança */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Nível de Confiança Final</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Alto", "Médio", "Baixo"] as NivelConfianca[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfiancaInput(level)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                    confiancaInput === level
                      ? level === "Alto"
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                        : level === "Médio"
                        ? "bg-amber-600 border-amber-500 text-white shadow-sm"
                        : "bg-rose-600 border-rose-500 text-white shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Input 5: Observações Técnicas */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações Técnicas / Justificativa
            </label>
            <textarea
              rows={3}
              value={observacoesInput}
              onChange={(e) => setObservacoesInput(e.target.value)}
              placeholder="Breve justificativa visual de 1 ou 2 linhas explicando os elementos identificados..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 4: Status Actions & Confirmation */}
        <div className="pt-2 space-y-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">Ação de Validação</div>

          <button
            onClick={handleConfirmAndAdvance}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Próxima Imagem</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveCorrection}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Correção</span>
            </button>

            <button
              onClick={handleReject}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejeitar / Inconclusivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
