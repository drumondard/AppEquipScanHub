import React, { useState, useEffect, useMemo } from "react";
import { RepositorioData, EquipamentoItem, BoundingBox } from "./types";
import { SAMPLE_REPOSITORIES } from "./data/sampleRepositories";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { StatsBar } from "./components/StatsBar";
import { ImageViewer } from "./components/ImageViewer";
import { ValidationForm } from "./components/ValidationForm";
import { ExportModal } from "./components/ExportModal";
import { NewRepoModal } from "./components/NewRepoModal";
import { UploadModal } from "./components/UploadModal";
import { ClearRepoModal } from "./components/ClearRepoModal";
import { getCroppedImageBase64 } from "./utils/imageCropper";

export default function App() {
  // Real-time server sync state
  const [repositories, setRepositories] = useState<RepositorioData[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLoadingIa, setIsLoadingIa] = useState<boolean>(false);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewRepoModalOpen, setIsNewRepoModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Fetch initial repositories from server (/AppEquipScanHub/repositories.json)
  const fetchRepositoriesFromServer = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch("/api/repositories");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.repositories)) {
          setRepositories(data.repositories);
          if (!selectedRepoId && data.repositories.length > 0) {
            setSelectedRepoId(data.repositories[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar dados do servidor /AppEquipScanHub/:", err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchRepositoriesFromServer();

    // Background interval to keep multiple users/browsers synced every 10 seconds
    const interval = setInterval(() => {
      fetchRepositoriesFromServer(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Current active repository
  const currentRepo = useMemo(() => {
    if (repositories.length === 0) return null;
    return repositories.find((r) => r.id === selectedRepoId) || repositories[0] || null;
  }, [repositories, selectedRepoId]);

  // Filter items in current repository
  const filteredItems = useMemo(() => {
    if (!currentRepo) return [];
    return currentRepo.itens.filter((item) => {
      const matchStatus =
        filterStatus === "Todos" || item.validacaoHumana.status === filterStatus;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sugestaoIa.equipamentoIdentificado
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.validacaoHumana.equipamentoConfirmado &&
          item.validacaoHumana.equipamentoConfirmado
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [currentRepo, filterStatus, searchQuery]);

  // Ensure activeItemId points to a valid item in filtered list
  useEffect(() => {
    if (filteredItems.length > 0) {
      if (!activeItemId || !filteredItems.some((i) => i.id === activeItemId)) {
        setActiveItemId(filteredItems[0].id);
      }
    } else {
      setActiveItemId(null);
    }
  }, [filteredItems, activeItemId]);

  const currentItemIndex = useMemo(() => {
    if (!activeItemId) return 0;
    const idx = filteredItems.findIndex((i) => i.id === activeItemId);
    return idx >= 0 ? idx : 0;
  }, [filteredItems, activeItemId]);

  const activeItem = useMemo(() => {
    return filteredItems[currentItemIndex] || null;
  }, [filteredItems, currentItemIndex]);

  // Navigation handlers
  const handlePrevious = () => {
    if (filteredItems.length <= 1) return;
    const prevIdx = (currentItemIndex - 1 + filteredItems.length) % filteredItems.length;
    setActiveItemId(filteredItems[prevIdx].id);
  };

  const handleNext = () => {
    if (filteredItems.length <= 1) return;
    const nextIdx = (currentItemIndex + 1) % filteredItems.length;
    setActiveItemId(filteredItems[nextIdx].id);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, currentItemIndex]);

  // Update item validation in session state & persist on server
  const handleUpdateValidation = async (
    updatedFields: Partial<EquipamentoItem["validacaoHumana"]>
  ) => {
    if (!activeItem || !currentRepo) return;

    // Optimistic local update
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== currentRepo.id) return repo;
        return {
          ...repo,
          itens: repo.itens.map((item) => {
            if (item.id !== activeItem.id) return item;
            return {
              ...item,
              validacaoHumana: {
                ...item.validacaoHumana,
                ...updatedFields,
              },
            };
          }),
        };
      })
    );

    try {
      await fetch(`/api/items/${activeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: currentRepo.id,
          validacaoHumana: updatedFields,
        }),
      });
    } catch (err) {
      console.error("Erro ao atualizar validação no servidor:", err);
    }
  };

  // Live re-analysis with Gemini AI Server using cropped bounding box
  const handleReanalyzeWithAi = async () => {
    if (!activeItem || !currentRepo) return;
    setIsLoadingIa(true);

    try {
      const bbox = activeItem.sugestaoIa.boundingBox;
      
      // Crop image based on bounding box
      const { croppedBase64, mimeType } = await getCroppedImageBase64(
        activeItem.imageUrl,
        bbox
      );

      const boxPrompt = bbox
        ? `Análise focada na placa/componente na área delimitada (X: ${bbox.xmin}%-${bbox.xmax}%, Y: ${bbox.ymin}%-${bbox.ymax}%). Identifique o modelo exato da placa/equipamento, fabricante, número de série (S/N), hostname/tag de rede (ex: DT_9876_RJO_OIPB.R1S3N42H3) e categoria.`
        : `Análise técnica de equipamento/placa no arquivo ${activeItem.filename}. Extraia modelo, fabricante, número de série (S/N), hostname/tag de rede (ex: DT_9876_RJO_OIPB.R1S3N42H3) e categoria.`;

      const res = await fetch("/api/identify-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: croppedBase64,
          mimeType,
          customPrompt: boxPrompt,
          boundingBox: bbox,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const aiData = json.data;

          const updatedSugestao = {
            equipamentoIdentificado: aiData.equipamentoIdentificado,
            fabricante: aiData.fabricante,
            numeroSerie: aiData.numeroSerie,
            hostname: aiData.hostname,
            categoria: aiData.categoria,
            nivelConfianca: aiData.nivelConfianca,
            observacoesTecnicas: aiData.observacoesTecnicas,
            especificacoesDetectadas: aiData.especificacoesDetectadas,
            boundingBox: aiData.boundingBox || activeItem.sugestaoIa.boundingBox,
            timestampAnalise: new Date().toLocaleString("pt-BR"),
          };

          const updatedValidacao = {
            ...activeItem.validacaoHumana,
            equipamentoConfirmado: aiData.equipamentoIdentificado,
            fabricanteConfirmado: aiData.fabricante || "",
            numeroSerieConfirmado: aiData.numeroSerie || "",
            hostnameConfirmado: aiData.hostname || "",
            categoriaConfirmada: aiData.categoria || "Outro",
            nivelConfiancaFinal: aiData.nivelConfianca || "Alto",
            observacoesFinais: aiData.observacoesTecnicas,
          };

          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== currentRepo.id) return repo;
              return {
                ...repo,
                itens: repo.itens.map((item) => {
                  if (item.id !== activeItem.id) return item;
                  return {
                    ...item,
                    sugestaoIa: updatedSugestao,
                    validacaoHumana: updatedValidacao,
                  };
                }),
              };
            })
          );

          // Save on server
          fetch(`/api/items/${activeItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repositoryId: currentRepo.id,
              sugestaoIa: updatedSugestao,
              validacaoHumana: updatedValidacao,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Erro na reanálise com Gemini AI:", error);
    } finally {
      setIsLoadingIa(false);
    }
  };

  // Update Bounding Box for the active item
  const handleUpdateBoundingBox = async (newBox: BoundingBox) => {
    if (!activeItem || !currentRepo) return;

    const updatedSugestao = {
      ...activeItem.sugestaoIa,
      boundingBox: newBox,
    };

    const updatedValidacao = {
      ...activeItem.validacaoHumana,
      editadoPeloOperador: true,
    };

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== currentRepo.id) return repo;
        return {
          ...repo,
          itens: repo.itens.map((item) => {
            if (item.id !== activeItem.id) return item;
            return {
              ...item,
              sugestaoIa: updatedSugestao,
              validacaoHumana: updatedValidacao,
            };
          }),
        };
      })
    );

    try {
      await fetch(`/api/items/${activeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: currentRepo.id,
          sugestaoIa: updatedSugestao,
          validacaoHumana: updatedValidacao,
        }),
      });
    } catch (err) {
      console.error("Erro ao atualizar Bounding Box no servidor:", err);
    }
  };

  // Add new repository handler (creates repo & folder at /AppEquipScanHub/<NOME>)
  const handleCreateRepo = async (nome: string, descricao: string, icone: string) => {
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, icone }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.repositories) {
          setRepositories(data.repositories);
          if (data.repository?.id) {
            setSelectedRepoId(data.repository.id);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao criar repositório no servidor /AppEquipScanHub/:", err);
    }
  };

  // Delete a single photo from active repo
  const handleDeleteSinglePhoto = async (itemId: string) => {
    if (!currentRepo) return;

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== currentRepo.id) return repo;
        return {
          ...repo,
          itens: repo.itens.filter((item) => item.id !== itemId),
        };
      })
    );
    setActiveItemId(null);

    try {
      await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Erro ao deletar item no servidor:", err);
    }
  };

  // Clear items from a specific repository
  const handleClearRepoItems = async (repoId: string) => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== repoId) return repo;
        return {
          ...repo,
          itens: [],
        };
      })
    );
    setActiveItemId(null);

    try {
      await fetch(`/api/repositories/clear/${repoId}`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Erro ao limpar lote no servidor:", err);
    }
  };

  // Delete a repository completely
  const handleDeleteRepo = async (repoId: string) => {
    const remainingRepos = repositories.filter((r) => r.id !== repoId);
    setRepositories(remainingRepos);

    if (remainingRepos.length > 0) {
      setSelectedRepoId(remainingRepos[0].id);
    } else {
      setSelectedRepoId("");
    }
    setActiveItemId(null);

    try {
      await fetch(`/api/repositories/${repoId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Erro ao excluir repositório no servidor:", err);
    }
  };

  // Reset all repositories to sample data explicitly on request
  const handleResetAllRepos = async () => {
    try {
      const res = await fetch("/api/repositories/reset", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.repositories) {
          setRepositories(data.repositories);
          if (data.repositories.length > 0) {
            setSelectedRepoId(data.repositories[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao resetar dados no servidor:", err);
    }
    setActiveItemId(null);
  };

  // Add uploaded images handler
  const handleAddImages = (newItems: EquipamentoItem[]) => {
    fetchRepositoriesFromServer(true);
    if (newItems.length > 0) {
      setActiveItemId(newItems[0].id);
    }
  };

  // Statistics counts for active repository
  const counts = useMemo(() => {
    if (!currentRepo) {
      return { total: 0, pendentes: 0, confirmados: 0, corrigidos: 0, rejeitados: 0 };
    }
    const total = currentRepo.itens.length;
    const confirmados = currentRepo.itens.filter(
      (i) => i.validacaoHumana.status === "Confirmado"
    ).length;
    const corrigidos = currentRepo.itens.filter(
      (i) => i.validacaoHumana.status === "Corrigido"
    ).length;
    const rejeitados = currentRepo.itens.filter(
      (i) => i.validacaoHumana.status === "Rejeitado"
    ).length;
    const pendentes = total - (confirmados + corrigidos + rejeitados);

    return { total, pendentes, confirmados, corrigidos, rejeitados };
  }, [currentRepo]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Dynamic Repository Selection Sidebar */}
      <Sidebar
        repositories={repositories}
        selectedRepoId={currentRepo ? currentRepo.id : ""}
        onSelectRepo={(id) => {
          setSelectedRepoId(id);
          setFilterStatus("Todos");
          setSearchQuery("");
        }}
        onOpenNewRepoModal={() => setIsNewRepoModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Operational Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          repoName={currentRepo ? currentRepo.nome : "AppEquipScanHub"}
          currentIndex={currentItemIndex}
          totalItems={filteredItems.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />

        {/* Batch Operational Statistics Bar */}
        <StatsBar
          total={counts.total}
          pendentes={counts.pendentes}
          confirmados={counts.confirmados}
          corrigidos={counts.corrigidos}
          rejeitados={counts.rejeitados}
        />

        {/* Validation Panel: Side-by-side Layout (Image Viewer vs Form) */}
        <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left: Image Viewer & Interactive Inspector */}
          <ImageViewer
            item={activeItem}
            allFilteredItems={filteredItems}
            onSelectThumbnail={(id) => setActiveItemId(id)}
            isLoadingIa={isLoadingIa}
            onUpdateBoundingBox={handleUpdateBoundingBox}
          />

          {/* Right: Human Validation & AI Suggestion Form */}
          {activeItem && (
            <ValidationForm
              item={activeItem}
              onUpdateValidation={handleUpdateValidation}
              onConfirmAndNext={() => {
                handleNext();
              }}
              onReanalyzeWithAi={handleReanalyzeWithAi}
              isLoadingIa={isLoadingIa}
              onUpdateBoundingBox={handleUpdateBoundingBox}
              onDeletePhoto={handleDeleteSinglePhoto}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {currentRepo && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          repository={currentRepo}
        />
      )}

      <NewRepoModal
        isOpen={isNewRepoModalOpen}
        onClose={() => setIsNewRepoModalOpen(false)}
        onCreateRepo={handleCreateRepo}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddImages={handleAddImages}
        repoId={currentRepo ? currentRepo.id : ""}
      />

      {currentRepo && (
        <ClearRepoModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          currentRepo={currentRepo}
          onClearItems={handleClearRepoItems}
          onDeleteRepo={handleDeleteRepo}
          onResetAllRepos={handleResetAllRepos}
        />
      )}
    </div>
  );
}
