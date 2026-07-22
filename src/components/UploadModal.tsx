import React, { useState } from "react";
import { EquipamentoItem } from "../types";
import { ImagePlus, X, Upload, Sparkles, Check } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImages: (newItems: EquipamentoItem[]) => void;
  repoId: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddImages,
  repoId,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const processAndAddFiles = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    const newItems: EquipamentoItem[] = [];

    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index];

      // Convert file to base64
      const base64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call Gemini Vision AI Server Route for dynamic detection!
      let aiResponseData = {
        equipamentoIdentificado: `Equipamento de Rede (Foto #${index + 1})`,
        fabricante: "Não Detectado",
        categoria: "Outro" as const,
        nivelConfianca: "Médio" as const,
        observacoesTecnicas: "Imagem carregada pelo operador. Processamento inicial visual.",
      };

      try {
        const res = await fetch("/api/identify-equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || "image/jpeg",
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            aiResponseData = json.data;
          }
        }
      } catch (err) {
        console.warn("Análise IA automática em background falhou, utilizando fallback.", err);
      }

      const item: EquipamentoItem = {
        id: `upload-${Date.now()}-${index}`,
        repositoryId: repoId,
        filename: file.name,
        imageUrl: base64,
        uploadDate: new Date().toLocaleString("pt-BR"),
        sugestaoIa: {
          equipamentoIdentificado: aiResponseData.equipamentoIdentificado,
          fabricante: aiResponseData.fabricante,
          categoria: aiResponseData.categoria as any,
          nivelConfianca: aiResponseData.nivelConfianca as any,
          observacoesTecnicas: aiResponseData.observacoesTecnicas,
          especificacoesDetectadas: ["Upload Direto do Operador"],
          boundingBox: { ymin: 15, xmin: 15, ymax: 85, xmax: 85 },
          timestampAnalise: new Date().toLocaleString("pt-BR"),
        },
        validacaoHumana: {
          status: "Pendente",
          equipamentoConfirmado: aiResponseData.equipamentoIdentificado,
          fabricanteConfirmado: aiResponseData.fabricante || "",
          categoriaConfirmada: (aiResponseData.categoria as any) || "Outro",
          nivelConfiancaFinal: (aiResponseData.nivelConfianca as any) || "Médio",
          observacoesFinais: aiResponseData.observacoesTecnicas,
          editadoPeloOperador: false,
        },
      };

      newItems.push(item);
    }

    onAddImages(newItems);
    setIsProcessing(false);
    setSelectedFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ImagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Adicionar Fotos ao Lote</h2>
              <p className="text-xs text-slate-400">Upload de imagens para análise Gemini IA</p>
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
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/50 transition-colors">
            <Upload className="w-8 h-8 text-indigo-400 mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-slate-200">Arraste ou selecione imagens de equipamentos</p>
            <p className="text-[11px] text-slate-500 mt-1">Formatos suportados: JPG, PNG, WEBP</p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            <label
              htmlFor="file-upload-input"
              className="mt-3 cursor-pointer py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
            >
              Selecionar Arquivos
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedFiles.length} foto(s) selecionada(s)</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-0.5 max-h-24 overflow-y-auto">
                {selectedFiles.map((f, i) => (
                  <li key={i} className="truncate">
                    • {f.name} ({(f.size / 1024).toFixed(0)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={processAndAddFiles}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Analisando com IA..." : "Importar & Analisar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
