import { EquipamentoItem, RepositorioData } from "../types";

export function exportToJson(repository: RepositorioData) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(repository, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `appequipscan_${repository.nome.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsv(repository: RepositorioData) {
  const headers = [
    "ID Item",
    "Repositório",
    "Arquivo Imagem",
    "Status Validação",
    "Equipamento Confirmado",
    "Fabricante",
    "Categoria",
    "Nível Confiança",
    "Observações Finais",
    "Operador",
    "Data Validação",
    "Sugestão IA Original",
  ];

  const rows = repository.itens.map((item) => [
    item.id,
    repository.nome,
    item.filename,
    item.validacaoHumana.status,
    `"${(item.validacaoHumana.equipamentoConfirmado || item.sugestaoIa.equipamentoIdentificado || "").replace(/"/g, '""')}"`,
    `"${(item.validacaoHumana.fabricanteConfirmado || item.sugestaoIa.fabricante || "").replace(/"/g, '""')}"`,
    item.validacaoHumana.categoriaConfirmada || item.sugestaoIa.categoria || "Outro",
    item.validacaoHumana.nivelConfiancaFinal || item.sugestaoIa.nivelConfianca,
    `"${(item.validacaoHumana.observacoesFinais || item.sugestaoIa.observacoesTecnicas || "").replace(/"/g, '""')}"`,
    item.validacaoHumana.operador || "Não especificado",
    item.validacaoHumana.dataValidacao || "-",
    `"${(item.sugestaoIa.equipamentoIdentificado || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `appequipscan_relatorio_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function generateBigQueryScript(repository: RepositorioData): string {
  const createTableSql = `-- Script de Criação de Tabela BigQuery para o AppEquipScan
CREATE TABLE IF NOT EXISTS \`telecom_infra_dataset.equipamentos_validados\` (
  id_item STRING OPTIONS(description="Identificador único da foto de equipamento"),
  repositorio_id STRING OPTIONS(description="Identificador do repositório"),
  nome_repositorio STRING OPTIONS(description="Nome do lote/repositório"),
  nome_arquivo STRING OPTIONS(description="Nome do arquivo de imagem"),
  url_imagem STRING OPTIONS(description="Link público ou URL do repositório Cloud Storage"),
  status_validacao STRING OPTIONS(description="Status da revisão humana: Pendente, Confirmado, Corrigido, Rejeitado"),
  equipamento_confirmado STRING OPTIONS(description="Nome técnico/modelo validado pelo operador"),
  fabricante STRING OPTIONS(description="Marca/Fabricante do equipamento"),
  categoria STRING OPTIONS(description="Categoria do equipamento de infraestrutura"),
  nivel_confianca STRING OPTIONS(description="Nível de confiança da análise IA (Alto, Médio, Baixo)"),
  observacoes_tecnicas STRING OPTIONS(description="Justificativa visual e notas do operador"),
  operador_validador STRING OPTIONS(description="Identificação do engenheiro/técnico de campo"),
  data_validacao TIMESTAMP OPTIONS(description="Data e hora da confirmação humana"),
  editado_pelo_operador BOOL OPTIONS(description="Flag indicando se houve alteração em relação à IA"),
  sugestao_ia_original JSON OPTIONS(description="Payload original gerado pelo componente Gemini IA")
);

-- Registros Inseridos na Sessão Atual (${repository.itens.length} itens)
`;

  const insertStatements = repository.itens.map((item) => {
    const eq = (item.validacaoHumana.equipamentoConfirmado || item.sugestaoIa.equipamentoIdentificado || "").replace(/'/g, "\\'");
    const fab = (item.validacaoHumana.fabricanteConfirmado || item.sugestaoIa.fabricante || "").replace(/'/g, "\\'");
    const obs = (item.validacaoHumana.observacoesFinais || item.sugestaoIa.observacoesTecnicas || "").replace(/'/g, "\\'");
    const op = (item.validacaoHumana.operador || "Sistema AppEquipScan").replace(/'/g, "\\'");
    const dateStr = item.validacaoHumana.dataValidacao ? `'${item.validacaoHumana.dataValidacao}'` : "CURRENT_TIMESTAMP()";

    return `INSERT INTO \`telecom_infra_dataset.equipamentos_validados\` (
  id_item, repositorio_id, nome_repositorio, nome_arquivo, url_imagem, status_validacao,
  equipamento_confirmado, fabricante, categoria, nivel_confianca, observacoes_tecnicas,
  operador_validador, data_validacao, editado_pelo_operador, sugestao_ia_original
) VALUES (
  '${item.id}', '${repository.id}', '${repository.nome.replace(/'/g, "\\'")}', '${item.filename.replace(/'/g, "\\'")}', '${item.imageUrl.replace(/'/g, "\\'")}', '${item.validacaoHumana.status}',
  '${eq}', '${fab}', '${item.validacaoHumana.categoriaConfirmada || "Outro"}', '${item.validacaoHumana.nivelConfiancaFinal}', '${obs}',
  '${op}', ${dateStr}, ${item.validacaoHumana.editadoPeloOperador ? "TRUE" : "FALSE"},
  JSON '${JSON.stringify(item.sugestaoIa).replace(/'/g, "\\'")}'
);`;
  });

  return createTableSql + "\n" + insertStatements.join("\n\n");
}
