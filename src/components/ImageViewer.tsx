import React, { useState, useRef } from "react";
import { EquipamentoItem } from "../types";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Scan,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface ImageViewerProps {
  item: EquipamentoItem | null;
  allFilteredItems: EquipamentoItem[];
  onSelectThumbnail: (id: string) => void;
  isLoadingIa: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  item,
  allFilteredItems,
  onSelectThumbnail,
  isLoadingIa,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!item) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Scan className="w-12 h-12 stroke-[1.5] text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-400">Nenhum equipamento selecionado</h3>
        <p className="text-xs text-slate-600 mt-1">Selecione ou crie um lote no menu lateral.</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const bbox = item.sugestaoIa.boundingBox;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmado":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmado</span>
          </div>
        );
      case "Corrigido":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Corrigido</span>
          </div>
        );
      case "Rejeitado":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejeitado</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendente de Validação</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`flex-1 bg-slate-950 flex flex-col relative overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950" : ""
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Badge: Filename and Status */}
        <div className="pointer-events-auto flex items-center gap-2">
          {getStatusBadge(item.validacaoHumana.status)}
          <span className="hidden md:inline-block px-2.5 py-1 bg-slate-900/80 border border-slate-800 text-slate-300 rounded-full text-xs font-mono backdrop-blur-md">
            {item.filename}
          </span>
        </div>

        {/* Right Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl shadow-lg backdrop-blur-md">
          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              showBoundingBox
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            title={showBoundingBox ? "Ocultar Bounding Box IA" : "Exibir Bounding Box IA"}
          >
            {showBoundingBox ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              showCrosshair
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            title="Grade de Inspeção Tática"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Rotacionar Imagem 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors"
            title="Redefinir Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 overflow-hidden relative"
      >
        {/* Loading Spinner Overlay when AI is re-analyzing */}
        {isLoadingIa && (
          <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-100">Analisando imagem com Visão Computacional Gemini IA...</p>
            <p className="text-xs text-slate-400 mt-1">Identificando portas, chassi e detalhes de marcações técnicas</p>
          </div>
        )}

        {/* Tactical Crosshair Grid */}
        {showCrosshair && (
          <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
            <div className="w-full h-full grid grid-cols-6 grid-rows-6">
              {Array.from({ length: 36 }).map((_, idx) => (
                <div key={idx} className="border border-indigo-500/40 flex items-center justify-center text-[9px] font-mono text-indigo-400">
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render Image with Transformations */}
        <div
          className="relative transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={item.imageUrl}
            alt={item.sugestaoIa.equipamentoIdentificado}
            className="max-h-[70vh] w-auto object-contain rounded-lg border border-slate-800 shadow-2xl"
          />

          {/* AI Bounding Box Overlay */}
          {showBoundingBox && bbox && (
            <div
              className="absolute border-2 border-cyan-400/90 bg-cyan-500/10 rounded pointer-events-none transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              style={{
                top: `${bbox.ymin}%`,
                left: `${bbox.xmin}%`,
                width: `${Math.max(bbox.xmax - bbox.xmin, 5)}%`,
                height: `${Math.max(bbox.ymax - bbox.ymin, 5)}%`,
              }}
            >
              <div className="absolute -top-7 left-0 bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Scan className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>
                  {item.validacaoHumana.equipamentoConfirmado || item.sugestaoIa.equipamentoIdentificado}
                </span>
                <span className="text-[9px] px-1 bg-cyan-950 text-cyan-400 rounded">
                  {item.sugestaoIa.nivelConfianca}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Bottom Thumbnail Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-2 overflow-x-auto flex items-center gap-2 z-20">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 flex-shrink-0">
          Navegação Rápida ({allFilteredItems.length})
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
          {allFilteredItems.map((thumb) => {
            const isCurrent = thumb.id === item.id;
            const status = thumb.validacaoHumana.status;

            return (
              <button
                key={thumb.id}
                onClick={() => onSelectThumbnail(thumb.id)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  isCurrent
                    ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-105"
                    : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={thumb.imageUrl} alt="" className="w-full h-full object-cover" />
                
                {/* Small Status Corner Dot */}
                <div
                  className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                    status === "Confirmado"
                      ? "bg-emerald-500"
                      : status === "Corrigido"
                      ? "bg-cyan-500"
                      : status === "Rejeitado"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
