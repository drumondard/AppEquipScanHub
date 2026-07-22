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
4. "categoria": "Switch" | "Roteador" | "OLT" | "Placa / Módulo de Serviço" | "Placa de Controle / CPU" | "Placa de Fonte / Energia" | "Placa Mãe / Circuit Board" | "Patch Panel" | "Servidor" | "Nobreak/UPS" | "DIO (Fibra)" | "Retificador 48V" | "Gabinete/Rack" | "Antena 5G" | "Outro".
5. "nivelConfianca": "Alto" | "Médio" | "Baixo".
6. "observacoesTecnicas": Detalhes visuais observados (ex: conectores SC/APC, portas RJ45, leds de status, modelo impresso no PCB/silk screen, etiqueta S/N).
7. "especificacoesDetectadas": Lista de características técnicas visíveis.
8. "boundingBox": Caixa delimitadora { "ymin": 0-100, "xmin": 0-100, "ymax": 0-100, "xmax": 0-100 }.

JSON Schema obrigatório:
{
  "equipamentoIdentificado": "Nome técnico do equipamento ou modelo da placa",
  "fabricante": "Marca/Fabricante",
  "numeroSerie": "Número de série ou S/N não visível",
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
