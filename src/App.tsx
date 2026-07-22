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

export default function App() {
  // Session Persistence (localStorage initialized)
  const [repositories, setRepositories] = useState<RepositorioData[]>(() => {
    const saved = localStorage.getItem("appequipscan_repos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Erro ao carregar dados salvos da sessão:", e);
      }
    }
    return SAMPLE_REPOSITORIES;
  });

  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    repositories[0]?.id || "repo-sp-spo-est14"
  );
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

  // Save session state to localStorage on update
  useEffect(() => {
    localStorage.setItem("appequipscan_repos", JSON.stringify(repositories));
  }, [repositories]);

  // Current active repository
  const currentRepo = useMemo(() => {
    return repositories.find((r) => r.id === selectedRepoId) || repositories[0] || {
      id: "repo-default",
      nome: "SP-SPO-EST01",
      descricao: "Lote técnico de equipamentos",
      icone: "Server",
      dataCriacao: new Date().toISOString().slice(0, 10),
      itens: [],
    };
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

  // Update item validation in session state
  const handleUpdateValidation = (
    updatedFields: Partial<EquipamentoItem["validacaoHumana"]>
  ) => {
    if (!activeItem) return;

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
  };

  // Live re-analysis with Gemini AI Server
  const handleReanalyzeWithAi = async () => {
    if (!activeItem) return;
    setIsLoadingIa(true);

    try {
      const res = await fetch("/api/identify-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: activeItem.imageUrl,
          customPrompt: `Análise técnica de equipamento no arquivo ${activeItem.filename}`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const aiData = json.data;

          setRepositories((prev) =>
            prev.map((repo) => {
              if (repo.id !== currentRepo.id) return repo;
              return {
                ...repo,
                itens: repo.itens.map((item) => {
                  if (item.id !== activeItem.id) return item;
                  return {
                    ...item,
                    sugestaoIa: {
                      equipamentoIdentificado: aiData.equipamentoIdentificado,
                      fabricante: aiData.fabricante,
                      categoria: aiData.categoria,
                      nivelConfianca: aiData.nivelConfianca,
                      observacoesTecnicas: aiData.observacoesTecnicas,
                      especificacoesDetectadas: aiData.especificacoesDetectadas,
                      boundingBox: aiData.boundingBox,
                      timestampAnalise: new Date().toLocaleString("pt-BR"),
                    },
                    validacaoHumana: {
                      ...item.validacaoHumana,
                      equipamentoConfirmado: aiData.equipamentoIdentificado,
                      fabricanteConfirmado: aiData.fabricante || "",
                      categoriaConfirmada: aiData.categoria || "Outro",
                      nivelConfiancaFinal: aiData.nivelConfianca || "Alto",
                      observacoesFinais: aiData.observacoesTecnicas,
                    },
                  };
                }),
              };
            })
          );
        }
      }
    } catch (error) {
      console.error("Erro na reanálise com Gemini AI:", error);
    } finally {
      setIsLoadingIa(false);
    }
  };

  // Update Bounding Box for the active item
  const handleUpdateBoundingBox = (newBox: BoundingBox) => {
    if (!activeItem) return;

    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== currentRepo.id) return repo;
        return {
          ...repo,
          itens: repo.itens.map((item) => {
            if (item.id !== activeItem.id) return item;
            return {
              ...item,
              sugestaoIa: {
                ...item.sugestaoIa,
                boundingBox: newBox,
              },
              validacaoHumana: {
                ...item.validacaoHumana,
                editadoPeloOperador: true,
              },
            };
          }),
        };
      })
    );
  };

  // Add new repository handler
  const handleCreateRepo = (nome: string, descricao: string, icone: string) => {
    const newRepo: RepositorioData = {
      id: `repo-custom-${Date.now()}`,
      nome,
      descricao,
      icone,
      dataCriacao: new Date().toISOString().slice(0, 10),
      itens: [],
    };

    setRepositories((prev) => [newRepo, ...prev]);
    setSelectedRepoId(newRepo.id);
  };

  // Clear items from a specific repository
  const handleClearRepoItems = (repoId: string) => {
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
  };

  // Delete a repository completely
  const handleDeleteRepo = (repoId: string) => {
    setRepositories((prev) => {
      const remaining = prev.filter((r) => r.id !== repoId);
      if (remaining.length === 0) {
        return SAMPLE_REPOSITORIES;
      }
      return remaining;
    });

    const remainingRepos = repositories.filter((r) => r.id !== repoId);
    if (remainingRepos.length > 0) {
      setSelectedRepoId(remainingRepos[0].id);
    } else {
      setSelectedRepoId(SAMPLE_REPOSITORIES[0].id);
    }
    setActiveItemId(null);
  };

  // Reset all repositories to sample data
  const handleResetAllRepos = () => {
    setRepositories(SAMPLE_REPOSITORIES);
    setSelectedRepoId(SAMPLE_REPOSITORIES[0].id);
    setActiveItemId(null);
  };

  // Add uploaded images handler
  const handleAddImages = (newItems: EquipamentoItem[]) => {
    setRepositories((prev) =>
      prev.map((repo) => {
        if (repo.id !== currentRepo.id) return repo;
        return {
          ...repo,
          itens: [...repo.itens, ...newItems],
        };
      })
    );

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
        selectedRepoId={currentRepo.id}
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
        repoId={currentRepo.id}
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
