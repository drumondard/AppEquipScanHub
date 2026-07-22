export type NivelConfianca = "Alto" | "Médio" | "Baixo";

export type StatusValidacao = "Pendente" | "Confirmado" | "Corrigido" | "Rejeitado";

export type CategoriaEquipamento =
  | "Switch"
  | "Roteador"
  | "OLT"
  | "Placa / Módulo de Serviço"
  | "Placa de Controle / CPU"
  | "Placa de Fonte / Energia"
  | "Placa Mãe / Circuit Board"
  | "Patch Panel"
  | "Servidor"
  | "Nobreak/UPS"
  | "DIO (Fibra)"
  | "Retificador 48V"
  | "Gabinete/Rack"
  | "Antena 5G"
  | "Outro";

export interface BoundingBox {
  ymin: number; // 0 - 100%
  xmin: number; // 0 - 100%
  ymax: number; // 0 - 100%
  xmax: number; // 0 - 100%
}

export interface EquipamentoItem {
  id: string;
  repositoryId: string;
  filename: string;
  imageUrl: string;
  thumbnailUrl?: string;
  uploadDate: string;
  
  // Dynamic AI Suggestions
  sugestaoIa: {
    equipamentoIdentificado: string;
    fabricante?: string;
    numeroSerie?: string;
    categoria?: CategoriaEquipamento;
    nivelConfianca: NivelConfianca;
    observacoesTecnicas: string;
    especificacoesDetectadas?: string[];
    boundingBox?: BoundingBox;
    timestampAnalise?: string;
  };

  // Human Validation State
  validacaoHumana: {
    status: StatusValidacao;
    equipamentoConfirmado: string;
    fabricanteConfirmado: string;
    numeroSerieConfirmado?: string;
    categoriaConfirmada: CategoriaEquipamento;
    nivelConfiancaFinal: NivelConfianca;
    observacoesFinais: string;
    operador?: string;
    dataValidacao?: string;
    editadoPeloOperador: boolean;
  };
}

export interface RepositorioData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  dataCriacao: string;
  itens: EquipamentoItem[];
}

export interface StatisticsSummary {
  total: number;
  pendentes: number;
  confirmados: number;
  corrigidos: number;
  rejeitados: number;
  porcentagemConcluido: number;
}
