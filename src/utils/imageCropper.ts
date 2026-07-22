import { BoundingBox } from "../types";

/**
 * Recorta a região especificada pelo BoundingBox (porcentagens 0-100) de uma imagem em base64.
 * Retorna o base64 da imagem focada/cortada para envio otimizado à IA Gemini / LiteLLM.
 */
export async function getCroppedImageBase64(
  imageUrl: string,
  bbox?: BoundingBox
): Promise<{ croppedBase64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const cleanOrig = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const origMime = imageUrl.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    if (!bbox || typeof bbox.xmin !== "number" || typeof bbox.ymin !== "number") {
      resolve({ croppedBase64: cleanOrig, mimeType: origMime });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const x = Math.max(0, (bbox.xmin / 100) * img.width);
        const y = Math.max(0, (bbox.ymin / 100) * img.height);
        const w = Math.min(img.width - x, ((bbox.xmax - bbox.xmin) / 100) * img.width);
        const h = Math.min(img.height - y, ((bbox.ymax - bbox.ymin) / 100) * img.height);

        if (w <= 10 || h <= 10) {
          resolve({ croppedBase64: cleanOrig, mimeType: origMime });
          return;
        }

        canvas.width = Math.round(w);
        canvas.height = Math.round(h);

        if (ctx) {
          ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          const cleanCropped = dataUrl.replace(/^data:image\/\w+;base64,/, "");
          resolve({ croppedBase64: cleanCropped, mimeType: "image/jpeg" });
        } else {
          resolve({ croppedBase64: cleanOrig, mimeType: origMime });
        }
      } catch (err) {
        console.warn("Erro ao cortar canvas da imagem:", err);
        resolve({ croppedBase64: cleanOrig, mimeType: origMime });
      }
    };

    img.onerror = () => {
      resolve({ croppedBase64: cleanOrig, mimeType: origMime });
    };

    img.src = imageUrl;
  });
}
