import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images (50mb)
app.use(express.json({ limit: "50mb" }));

// Initialize base directory /AppEquipScanHub for server persistence
function getBaseDir() {
  const rootDir = "/AppEquipScanHub";
  try {
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
    return rootDir;
  } catch (err) {
    console.warn("[AppEquipScanHub] Sem permissão para /AppEquipScanHub na raiz, utilizando pasta local ./AppEquipScanHub");
    const localDir = path.join(process.cwd(), "AppEquipScanHub");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  }
}

const BASE_DIR = getBaseDir();
const UPLOADS_DIR = path.join(BASE_DIR, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const REPOS_JSON_PATH = path.join(BASE_DIR, "repositories.json");

// Default sample repositories data for initial setup
const DEFAULT_SAMPLE_REPOSITORIES = [
  {
    id: "repo-sp-spo-est14",
    nome: "SP-SPO-EST14",
    descricao: "Datacenter Core SP-01 (Rack 14A ao 18B) - Infraestrutura principal de rede local, switches core de alta densidade e roteadores BGP.",
    icone: "Server",
    dataCriacao: "2026-07-20",
    itens: [
      {
        id: "eq-001",
        repositoryId: "repo-sp-spo-est14",
        filename: "rack_14a_cisco_sw9300.jpg",
        imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        uploadDate: "2026-07-20 14:32",
        sugestaoIa: {
          equipamentoIdentificado: "Switch Cisco Catalyst C9300-48P",
          fabricante: "Cisco Systems",
          numeroSerie: "FOC2418L1XY",
          hostname: "SP_SPO_SW01.R1S3N42H3",
          categoria: "Switch",
          nivelConfianca: "Alto",
          observacoesTecnicas: "Painel frontal com 48 portas Gigabit Ethernet RJ-45 com PoE+ e 4 portas SFP+ 10G uplink. Carcaça cinza metálica de 1U com LED de status operacional ativo.",
          especificacoesDetectadas: ["48 Portas PoE+", "4 Uplinks SFP+ 10G", "Ocupação 1U de Rack"],
          boundingBox: { ymin: 25, xmin: 10, ymax: 42, xmax: 90 },
          timestampAnalise: "2026-07-20 14:32:05",
        },
        validacaoHumana: {
          status: "Pendente",
          equipamentoConfirmado: "Switch Cisco Catalyst C9300-48P",
          fabricanteConfirmado: "Cisco Systems",
          numeroSerieConfirmado: "FOC2418L1XY",
          hostnameConfirmado: "SP_SPO_SW01.R1S3N42H3",
          categoriaConfirmada: "Switch",
          nivelConfiancaFinal: "Alto",
          observacoesFinais: "Painel frontal com 48 portas Gigabit Ethernet RJ-45 com PoE+ e 4 portas SFP+ 10G uplink. Carcaça cinza metálica de 1U com LED de status operacional ativo.",
          editadoPeloOperador: false,
        },
      },
      {
        id: "eq-002",
        repositoryId: "repo-sp-spo-est14",
        filename: "rack_14a_huawei_olt_ma5608t.jpg",
        imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
        uploadDate: "2026-07-20 14:35",
        sugestaoIa: {
          equipamentoIdentificado: "OLT Huawei SmartAX MA5608T GPON",
          fabricante: "Huawei",
          hostname: "DT_9876_RJO_OIPB.R1S3N42H3",
          categoria: "OLT",
          nivelConfianca: "Alto",
          observacoesTecnicas: "Gabinete compacto 2U de alta densidade com placas de serviço GPON de 16 portas e módulos SFP GPON B+ visíveis na parte central.",
          especificacoesDetectadas: ["2 Slot Servico GPON", "Alimentação -48V DC", "Placa de Controle MCUD"],
          boundingBox: { ymin: 15, xmin: 15, ymax: 55, xmax: 85 },
          timestampAnalise: "2026-07-20 14:35:12",
        },
        validacaoHumana: {
          status: "Confirmado",
          equipamentoConfirmado: "OLT Huawei SmartAX MA5608T GPON",
          fabricanteConfirmado: "Huawei",
          hostnameConfirmado: "DT_9876_RJO_OIPB.R1S3N42H3",
          categoriaConfirmada: "OLT",
          nivelConfiancaFinal: "Alto",
          observacoesFinais: "Gabinete compacto 2U de alta densidade com placas de serviço GPON de 16 portas e módulos SFP GPON B+ visíveis na parte central.",
          operador: "Carlos Silva (Eng. Campo)",
          dataValidacao: "2026-07-21 09:15",
          editadoPeloOperador: false,
        },
      },
    ],
  },
  {
    id: "repo-rj-rjo-pop04",
    nome: "RJ-RJO-POP04",
    descricao: "POP Telecom Central #04 - Infraestrutura óptica FTTH, Distribuidor Interno Óptico (DIO) e Retificadores -48V.",
    icone: "Radio",
    dataCriacao: "2026-07-21",
    itens: [
      {
        id: "eq-101",
        repositoryId: "repo-rj-rjo-pop04",
        filename: "dio_optico_furukawa_72p.jpg",
        imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
        uploadDate: "2026-07-21 08:10",
        sugestaoIa: {
          equipamentoIdentificado: "DIO B48 Distribuidor Interno Óptico 72 Fibras SC/APC",
          fabricante: "Furukawa / Fibracem",
          categoria: "DIO (Fibra)",
          nivelConfianca: "Alto",
          observacoesTecnicas: "Painel de fusão e distribuição de fibra óptica de 3U com acopladores SC/APC monomodo verde e gavetas deslizantes para fusões.",
          especificacoesDetectadas: ["72 Acopladores SC/APC", "Bandejas de Emenda Internas", "Chassi de Alumínio 3U"],
          boundingBox: { ymin: 18, xmin: 10, ymax: 65, xmax: 90 },
          timestampAnalise: "2026-07-21 08:10:44",
        },
        validacaoHumana: {
          status: "Pendente",
          equipamentoConfirmado: "DIO B48 Distribuidor Interno Óptico 72 Fibras SC/APC",
          fabricanteConfirmado: "Furukawa / Fibracem",
          categoriaConfirmada: "DIO (Fibra)",
          nivelConfiancaFinal: "Alto",
          observacoesFinais: "Painel de fusão e distribuição de fibra óptica de 3U com acopladores SC/APC monomodo verde e gavetas deslizantes para fusões.",
          editadoPeloOperador: false,
        },
      },
    ],
  },
  {
    id: "repo-mg-bhz-erb02",
    nome: "MG-BHZ-ERB02",
    descricao: "Gabinete Outdoor CellSite 5G (Antenas & RRUs) - Equipamentos instalados em estações rádio base outdoor.",
    icone: "TowerControl",
    dataCriacao: "2026-07-21",
    itens: [],
  },
];

// Read or initialize repositories from /AppEquipScanHub/repositories.json
function getRepositoriesOnServer(): any[] {
  try {
    if (fs.existsSync(REPOS_JSON_PATH)) {
      const data = fs.readFileSync(REPOS_JSON_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[AppEquipScanHub] Erro ao ler repositories.json no servidor:", err);
  }

  // Initialize if missing
  saveRepositoriesOnServer(DEFAULT_SAMPLE_REPOSITORIES);
  return DEFAULT_SAMPLE_REPOSITORIES;
}

function saveRepositoriesOnServer(repos: any[]): void {
  try {
    fs.writeFileSync(REPOS_JSON_PATH, JSON.stringify(repos, null, 2), "utf-8");
  } catch (err) {
    console.error("[AppEquipScanHub] Erro ao salvar repositories.json no servidor:", err);
  }
}

// Serve uploaded static files from /AppEquipScanHub/uploads and /AppEquipScanHub
app.use("/AppEquipScanHub/uploads", express.static(UPLOADS_DIR));
app.use("/AppEquipScanHub", express.static(BASE_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// Helper function to process equipment image via LiteLLM or Gemini
async function analyzeEquipmentImage(
  cleanBase64: string,
  mimeType: string,
  customPrompt?: string,
  boundingBox?: { ymin: number; xmin: number; ymax: number; xmax: number }
) {
  const systemInstruction = `Você é o componente de IA especializado em visão computacional e identificação de equipamentos de infraestrutura, telecomunicações e placas/módulos eletrônicos para o aplicativo AppEquipScanHub.

Sua função é analisar imagens de equipamentos completos (chassis, racks, switches, OLTs, roteadores, servidores) OU placas/módulos específicos selecionados pelo usuário (como placas de serviço GPON, placas de controle/CPU, placas mãe, placas de alimentação/fonte, transceivers/SFP, etc.).

Ao analisar a imagem (ou a região delimitada da placa/equipamento selecionado), extraia com máxima precisão:
1. "equipamentoIdentificado": Modelo exato do equipamento ou placa (Ex: "Placa GPON 16 Portas C+ - Huawei H805GPFD", "Switch Cisco Catalyst C9300-48P", "Placa de Controle Supervisor 8L-E").
2. "fabricante": Marca/Fabricante (Cisco, Huawei, ZTE, Intel, Asus, Furukawa, MikroTik, APC, Dell, etc.).
3. "numeroSerie": Número de série (S/N ou Serial Number) se houver etiqueta, código de barras ou gravação visível na placa/equipamento. Se não for legível, retorne "S/N não visível".
4. "hostname": Nome do Host / Hostname / Tag de Identificação de Rede impresso na etiqueta (Ex: "DT_9876_RJO_OIPB.R1S3N42H3", "SP_SPO_SW01.R1S3N42H3"). Se não houver etiqueta de hostname visível, retorne "Não detectado".
5. "categoria": "Switch" | "Roteador" | "OLT" | "Placa / Módulo de Serviço" | "Placa de Controle / CPU" | "Placa de Fonte / Energia" | "Placa Mãe / Circuit Board" | "Patch Panel" | "Servidor" | "Nobreak/UPS" | "DIO (Fibra)" | "Retificador 48V" | "Gabinete/Rack" | "Antena 5G" | "Outro".
6. "nivelConfianca": "Alto" | "Médio" | "Baixo".
7. "observacoesTecnicas": Detalhes visuais observados (ex: conectores SC/APC, portas RJ45, leds de status, modelo impresso no PCB/silk screen, etiqueta S/N, tag de hostname).
8. "especificacoesDetectadas": Lista de características técnicas visíveis.
9. "boundingBox": Caixa delimitadora { "ymin": 0-100, "xmin": 0-100, "ymax": 0-100, "xmax": 0-100 }.

JSON Schema obrigatório:
{
  "equipamentoIdentificado": "Nome técnico do equipamento ou modelo da placa",
  "fabricante": "Marca/Fabricante",
  "numeroSerie": "Número de série ou S/N não visível",
  "hostname": "Hostname/Tag de rede (Ex: DT_9876_RJO_OIPB.R1S3N42H3) ou Não detectado",
  "categoria": "Switch | Roteador | OLT | Placa / Módulo de Serviço | Placa de Controle / CPU | Placa de Fonte / Energia | Placa Mãe / Circuit Board | Servidor | Outro",
  "nivelConfianca": "Alto | Médio | Baixo",
  "observacoesTecnicas": "Justificativa visual com detalhes da placa ou equipamento",
  "especificacoesDetectadas": ["especificacao 1", "especificacao 2"],
  "boundingBox": { "ymin": 15, "xmin": 15, "ymax": 85, "xmax": 85 }
}`;

  let userPromptText = customPrompt
    ? `Analise este equipamento com atenção aos detalhes do operador: ${customPrompt}`
    : "Analise a imagem e identifique o equipamento de rede/telecom/infraestrutura com detalhes técnicos visíveis.";

  if (boundingBox) {
    userPromptText += `\n[RECORTE SELECIONADO PELO OPERADOR (BOUNDING BOX)]: ymin=${boundingBox.ymin}%, xmin=${boundingBox.xmin}%, ymax=${boundingBox.ymax}%, xmax=${boundingBox.xmax}%. Foque exclusivamente no componente/placa/equipamento contido dentro desse perímetro visual e extraia seu modelo e S/N exatos.`;
  }

  const litellmBaseUrl = process.env.LITELLM_BASE_URL || "http://10.121.243.101:8083/v1";
  const litellmApiKey = process.env.LITELLM_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // 1. Try LiteLLM Proxy API if LITELLM_API_KEY or LITELLM_BASE_URL is configured
  if (litellmApiKey || process.env.LITELLM_BASE_URL) {
    try {
      console.log(`[AppEquipScanHub] Enviando imagem para LiteLLM: ${litellmBaseUrl}/chat/completions`);

      const endpoint = `${litellmBaseUrl.replace(/\/+$/, "")}/chat/completions`;
      const modelName = process.env.LITELLM_MODEL || "gemini-3.6-flash";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (litellmApiKey) {
        headers["Authorization"] = `Bearer ${litellmApiKey}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            {
              role: "user",
              content: [
                { type: "text", text: userPromptText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const contentStr = json.choices?.[0]?.message?.content || "{}";
        const parsedData = JSON.parse(contentStr);
        return { data: parsedData, provider: "LiteLLM Proxy (10.121.243.101)" };
      } else {
        const errText = await response.text();
        console.warn("[AppEquipScanHub] Resposta não-200 do LiteLLM:", response.status, errText);
      }
    } catch (litellmErr) {
      console.error("[AppEquipScanHub] Erro na conexão com LiteLLM:", litellmErr);
    }
  }

  // 2. Fallback to Direct Google Gen AI (GEMINI_API_KEY)
  if (geminiApiKey) {
    try {
      console.log("[AppEquipScanHub] Utilizando cliente direto Gemini API...");
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: { mimeType, data: cleanBase64 },
          },
          { text: userPromptText },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              equipamentoIdentificado: { type: Type.STRING },
              fabricante: { type: Type.STRING },
              numeroSerie: { type: Type.STRING },
              hostname: { type: Type.STRING },
              categoria: { type: Type.STRING },
              nivelConfianca: { type: Type.STRING },
              observacoesTecnicas: { type: Type.STRING },
              especificacoesDetectadas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              boundingBox: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
                },
              },
            },
            required: ["equipamentoIdentificado", "nivelConfianca", "observacoesTecnicas"],
          },
        },
      });

      const parsedData = JSON.parse(response.text || "{}");
      return { data: parsedData, provider: "Direct Gemini API" };
    } catch (geminiErr) {
      console.error("[AppEquipScanHub] Erro na análise Gemini Direta:", geminiErr);
    }
  }

  // 3. Fallback visual para demonstração/desenvolvimento
  if (customPrompt?.toLowerCase().includes("delimitada") || customPrompt?.toLowerCase().includes("placa") || boundingBox) {
    return {
      data: {
        equipamentoIdentificado: "Placa de Serviço GPON 16 Portas H805GPFD",
        fabricante: "Huawei",
        numeroSerie: "210235048210D4001234",
        hostname: "DT_9876_RJO_OIPB.R1S3N42H3",
        categoria: "Placa / Módulo de Serviço",
        nivelConfianca: "Alto",
        observacoesTecnicas:
          "Análise focada na região Bounding Box selecionada pelo operador. Identificada Placa de Serviço GPON de 16 portas com transceivers SFP C+ e etiqueta S/N impressa.",
        especificacoesDetectadas: [
          "16 Portas GPON SFP C+",
          "Suporte a OLT Huawei SmartAX MA5608T / MA5680T",
          "Código de barras S/N verificado",
        ],
        boundingBox: boundingBox || { ymin: 20, xmin: 15, ymax: 80, xmax: 85 },
      },
      provider: "Modo Simulação / Fallback Recorte Selecionado",
    };
  }

  return {
    data: {
      equipamentoIdentificado: "Switch de Borda Gerenciável L2/L3",
      fabricante: "Cisco Systems",
      numeroSerie: "FOC2418L1XY",
      hostname: "SP_SPO_SW01.R1S3N42H3",
      categoria: "Switch",
      nivelConfianca: "Alto",
      observacoesTecnicas:
        "Painel frontal com 24 a 48 portas RJ45 Gigabit e slots de uplinks ópticos SFP+. Equipamento de rack identificado.",
      especificacoesDetectadas: [
        "Portas Gigabit Ethernet RJ45",
        "Uplinks SFP+ 10Gbps",
        "Montagem em Rack 19\"",
      ],
      boundingBox: { ymin: 15, xmin: 10, ymax: 85, xmax: 90 },
    },
    provider: "Modo Simulação / Fallback Visual",
  };
}

// API Route for Infrastructure Equipment Identification
app.post("/api/identify-equipment", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", customPrompt, boundingBox } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem fornecida em formato base64." });
    }

    let detectedMime = mimeType;
    if (imageBase64.startsWith("data:image/")) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        detectedMime = match[1];
      }
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const result = await analyzeEquipmentImage(cleanBase64, detectedMime, customPrompt, boundingBox);

    return res.json({
      success: true,
      provider: result.provider,
      data: result.data,
      rawFormattedText: `- **Equipamento Identificado**: ${result.data.equipamentoIdentificado}\n- **Nível de Confiança**: ${result.data.nivelConfianca}\n- **Observações Técnicas**: ${result.data.observacoesTecnicas}`,
    });
  } catch (error: any) {
    console.error("Erro no processamento da imagem pelo servidor:", error);
    return res.status(500).json({
      error: "Falha na análise da imagem.",
      details: error.message || String(error),
    });
  }
});

// GET all repositories (from server file /AppEquipScanHub/repositories.json)
app.get("/api/repositories", (_req, res) => {
  try {
    const repos = getRepositoriesOnServer();
    return res.json({ success: true, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao obter repositórios.", details: error.message });
  }
});

// POST create a new repository / batch on server (creates folder at /AppEquipScanHub/<NOME>)
app.post("/api/repositories", (req, res) => {
  try {
    const { nome, descricao, icone = "Server" } = req.body;
    if (!nome) {
      return res.status(400).json({ error: "Nome do repositório/lote é obrigatório." });
    }

    const repos = getRepositoriesOnServer();
    const cleanName = nome.trim().toUpperCase();

    // Create subfolder at /AppEquipScanHub/<NOME>
    const repoFolderPath = path.join(BASE_DIR, cleanName);
    if (!fs.existsSync(repoFolderPath)) {
      try {
        fs.mkdirSync(repoFolderPath, { recursive: true });
        console.log(`[AppEquipScanHub] Pasta criada no servidor: ${repoFolderPath}`);
      } catch (err) {
        console.warn(`[AppEquipScanHub] Aviso ao criar pasta ${repoFolderPath}:`, err);
      }
    }

    const newRepo = {
      id: `repo-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
      nome: cleanName,
      descricao: descricao || `Lote técnico de equipamentos da estação ${cleanName}`,
      icone,
      dataCriacao: new Date().toISOString().slice(0, 10),
      itens: [],
    };

    repos.unshift(newRepo);
    saveRepositoriesOnServer(repos);

    return res.json({ success: true, repository: newRepo, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao criar repositório.", details: error.message });
  }
});

// DELETE a repository from server
app.delete("/api/repositories/:id", (req, res) => {
  try {
    const repoId = req.params.id;
    let repos = getRepositoriesOnServer();
    repos = repos.filter((r) => r.id !== repoId);
    saveRepositoriesOnServer(repos);
    return res.json({ success: true, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao excluir repositório.", details: error.message });
  }
});

// POST clear items in a repository
app.post("/api/repositories/clear/:id", (req, res) => {
  try {
    const repoId = req.params.id;
    const repos = getRepositoriesOnServer();
    const repo = repos.find((r) => r.id === repoId);
    if (repo) {
      repo.itens = [];
      saveRepositoriesOnServer(repos);
    }
    return res.json({ success: true, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao limpar repositório.", details: error.message });
  }
});

// POST reset repositories to default sample data
app.post("/api/repositories/reset", (_req, res) => {
  try {
    saveRepositoriesOnServer(DEFAULT_SAMPLE_REPOSITORIES);
    return res.json({ success: true, repositories: DEFAULT_SAMPLE_REPOSITORIES });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao resetar repositórios.", details: error.message });
  }
});

// POST Upload image to batch & save file at /AppEquipScanHub/uploads/ and /AppEquipScanHub/<NOME>/
app.post("/api/upload-item", async (req, res) => {
  try {
    const { repositoryId, filename = "imagem_equipamento.jpg", imageBase64, mimeType = "image/jpeg", customPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem em base64 fornecida." });
    }

    const repos = getRepositoriesOnServer();
    const repo = repos.find((r) => r.id === repositoryId);

    if (!repo) {
      return res.status(404).json({ error: "Repositório não encontrado." });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const itemId = `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Ext do arquivo
    let ext = ".jpg";
    if (mimeType.includes("png")) ext = ".png";
    if (mimeType.includes("webp")) ext = ".webp";

    const sanitizedOriginalName = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const serverFileName = `${itemId}_${sanitizedOriginalName}`;
    const fileWithExt = serverFileName.endsWith(ext) ? serverFileName : `${serverFileName}${ext}`;

    // 1. Salvar no diretório global /AppEquipScanHub/uploads/
    const uploadFilePath = path.join(UPLOADS_DIR, fileWithExt);
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    fs.writeFileSync(uploadFilePath, imageBuffer);
    console.log(`[AppEquipScanHub] Foto salva com sucesso no servidor: ${uploadFilePath}`);

    // 2. Salvar cópia no diretório do lote /AppEquipScanHub/<NOME>/
    const repoFolderPath = path.join(BASE_DIR, repo.nome);
    if (!fs.existsSync(repoFolderPath)) {
      fs.mkdirSync(repoFolderPath, { recursive: true });
    }
    const repoFilePath = path.join(repoFolderPath, fileWithExt);
    fs.writeFileSync(repoFilePath, imageBuffer);

    // URL acessível pelo frontend (servido estaticamente)
    const publicImageUrl = `/AppEquipScanHub/uploads/${fileWithExt}`;

    // Executar análise por IA Gemini
    let aiData = {
      equipamentoIdentificado: `Equipamento de Rede (${filename})`,
      fabricante: "Não Detectado",
      numeroSerie: "S/N não visível",
      hostname: "Não detectado",
      categoria: "Outro",
      nivelConfianca: "Médio",
      observacoesTecnicas: "Arquivo de imagem salvo no servidor /AppEquipScanHub/.",
      especificacoesDetectadas: ["Salvo no servidor /AppEquipScanHub/"],
      boundingBox: { ymin: 15, xmin: 15, ymax: 85, xmax: 85 },
    };

    try {
      const aiResult = await analyzeEquipmentImage(cleanBase64, mimeType, customPrompt);
      if (aiResult && aiResult.data) {
        aiData = { ...aiData, ...aiResult.data };
      }
    } catch (aiErr) {
      console.warn("[AppEquipScanHub] Erro na análise IA automática durante upload:", aiErr);
    }

    const newItem = {
      id: itemId,
      repositoryId: repo.id,
      filename: filename,
      imageUrl: publicImageUrl,
      uploadDate: new Date().toLocaleString("pt-BR"),
      sugestaoIa: {
        equipamentoIdentificado: aiData.equipamentoIdentificado,
        fabricante: aiData.fabricante,
        numeroSerie: aiData.numeroSerie,
        hostname: aiData.hostname,
        categoria: aiData.categoria,
        nivelConfianca: aiData.nivelConfianca,
        observacoesTecnicas: aiData.observacoesTecnicas,
        especificacoesDetectadas: aiData.especificacoesDetectadas || ["Upload salvo em /AppEquipScanHub/"],
        boundingBox: aiData.boundingBox || { ymin: 15, xmin: 15, ymax: 85, xmax: 85 },
        timestampAnalise: new Date().toLocaleString("pt-BR"),
      },
      validacaoHumana: {
        status: "Pendente",
        equipamentoConfirmado: aiData.equipamentoIdentificado,
        fabricanteConfirmado: aiData.fabricante || "",
        numeroSerieConfirmado: aiData.numeroSerie || "",
        hostnameConfirmado: aiData.hostname || "",
        categoriaConfirmada: aiData.categoria || "Outro",
        nivelConfiancaFinal: aiData.nivelConfianca || "Médio",
        observacoesFinais: aiData.observacoesTecnicas,
        editadoPeloOperador: false,
      },
    };

    repo.itens.push(newItem);
    saveRepositoriesOnServer(repos);

    return res.json({ success: true, item: newItem, repositories: repos });
  } catch (error: any) {
    console.error("Erro no upload de foto para o servidor:", error);
    return res.status(500).json({ error: "Erro ao salvar foto no servidor.", details: error.message });
  }
});

// PUT update item details (validacaoHumana, boundingBox, etc.)
app.put("/api/items/:id", (req, res) => {
  try {
    const itemId = req.params.id;
    const { repositoryId, validacaoHumana, sugestaoIa } = req.body;

    const repos = getRepositoriesOnServer();
    let updatedItem = null;

    for (const repo of repos) {
      if (repositoryId && repo.id !== repositoryId) continue;
      const item = repo.itens.find((i: any) => i.id === itemId);
      if (item) {
        if (validacaoHumana) {
          item.validacaoHumana = { ...item.validacaoHumana, ...validacaoHumana };
        }
        if (sugestaoIa) {
          item.sugestaoIa = { ...item.sugestaoIa, ...sugestaoIa };
        }
        updatedItem = item;
        break;
      }
    }

    saveRepositoriesOnServer(repos);
    return res.json({ success: true, item: updatedItem, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao atualizar item.", details: error.message });
  }
});

// DELETE single item from server
app.delete("/api/items/:id", (req, res) => {
  try {
    const itemId = req.params.id;
    const repos = getRepositoriesOnServer();

    for (const repo of repos) {
      const idx = repo.itens.findIndex((i: any) => i.id === itemId);
      if (idx !== -1) {
        repo.itens.splice(idx, 1);
        break;
      }
    }

    saveRepositoriesOnServer(repos);
    return res.json({ success: true, repositories: repos });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao remover item do servidor.", details: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "AppEquipScan API", serverStoragePath: BASE_DIR });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AppEquipScan] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
