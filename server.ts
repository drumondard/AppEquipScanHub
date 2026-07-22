import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client Lazily or securely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no ambiente.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Route for Infrastructure Equipment Identification
app.post("/api/identify-equipment", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", customPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem fornecida em formato base64." });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const ai = getGeminiClient();

    const systemInstruction = `Você é o componente de IA especializado em visão computacional e identificação de equipamentos de infraestrutura e telecomunicações para o aplicativo AppEquipScan.

Sua função é analisar imagens de equipamentos de rede, telecomunicações e infraestrutura enviadas pelo sistema (como switches, roteadores, OLTs, patch panels, servidore, nobreaks/UPS, gabinetes outdoor, DIOs de fibra, retificadores, etc.), identificar o tipo exato do equipamento com base em características visuais (como modelo, painéis de portas RJ45/SFP, conectores de fibra, gabinetes, ventilação ou marcações físicas) e retornar a resposta estritamente estruturada para validação humana.

Regras de Resposta:
1. Analise a imagem fornecida com foco em detalhes técnicos e carcaças de equipamentos.
2. Forneça o nome técnico mais provável do equipamento identificado (incluindo marca e modelo se visível).
3. Se houver incerteza, forneça a sua melhor estimativa técnica e indique o nível de confiança (Alto, Médio, Baixo).
4. Sua resposta deve ser direta, concisa e orientada para que um operador possa confirmar ou corrigir rapidamente na interface.
5. Indique as coordenadas estimadas [ymin, xmin, ymax, xmax] do equipamento na imagem em formato percentual (0 a 100) para desenhar a caixa delimitadora (bounding box).`;

    const userPromptText = customPrompt
      ? `Analise este equipamento com atenção aos detalhes do operador: ${customPrompt}`
      : "Analise a imagem e identifique o equipamento de rede/telecom/infraestrutura com detalhes técnicos visíveis.";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: userPromptText,
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            equipamentoIdentificado: {
              type: Type.STRING,
              description: "Nome técnico ou modelo exato do equipamento identificado",
            },
            fabricante: {
              type: Type.STRING,
              description: "Marca ou fabricante do equipamento (ex: Cisco, Huawei, MikroTik, APC, Dell, Furukawa)",
            },
            categoria: {
              type: Type.STRING,
              description: "Categoria do equipamento (Switch, Roteador, OLT, Patch Panel, Servidor, Nobreak/UPS, DIO, Retificador, Outro)",
            },
            nivelConfianca: {
              type: Type.STRING,
              description: "Nível de confiança da análise: 'Alto', 'Médio' ou 'Baixo'",
            },
            observacoesTecnicas: {
              type: Type.STRING,
              description: "Breve justificativa visual de 1 ou 2 linhas explicando os elementos identificados na imagem (ex: quantidade de portas, tipo de rack, marca visível)",
            },
            especificacoesDetectadas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de características visuais destacadas (ex: '48 Portas Gigabit RJ45', '4 Uplinks SFP+ 10G', 'Alimentação redundante')",
            },
            boundingBox: {
              type: Type.OBJECT,
              description: "Coordenadas normalizadas em porcentagem 0-100 para destacar o equipamento no viewer",
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

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);

    return res.json({
      success: true,
      data,
      rawFormattedText: `- **Equipamento Identificado**: ${data.equipamentoIdentificado}\n- **Nível de Confiança**: ${data.nivelConfianca}\n- **Observações Técnicas**: ${data.observacoesTecnicas}`,
    });
  } catch (error: any) {
    console.error("Erro no processamento da imagem pelo Gemini:", error);
    return res.status(500).json({
      error: "Falha na análise da imagem.",
      details: error.message || String(error),
    });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "AppEquipScan API" });
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
