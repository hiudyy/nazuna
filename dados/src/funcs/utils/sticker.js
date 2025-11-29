import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webp from 'node-webpmux';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório temporário
function ensureTmpDir() {
  const tmpDir = path.join(path.dirname(__filename), "../../../database/tmp");
  if (!fsSync.existsSync(tmpDir)) {
    fsSync.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}
function generateTempFileName(ext) {
  const dir = ensureTmpDir();
  return path.join(dir, `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`);
}

// Download para buffer
async function getBuffer(url) {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  if (!data || data.length === 0) throw new Error("Download vazio");
  return Buffer.from(data);
}

// Detecção mínima só para imagens
function detectImageExtension(buf) {
  if (buf.length >= 12) {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "png";
    if (buf[0] === 0xFF && buf[1] === 0xD8) return "jpg";
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
  }
  return "jpg";
}

// Converter para WebP (sempre .mp4 para vídeo)
async function convertToWebp(mediaBuffer, isVideo = false, forceSquare = false) {
  // Se já for webp estático e não for vídeo, retorna direto
  if (!isVideo &&
      mediaBuffer.slice(0, 4).toString() === "RIFF" &&
      mediaBuffer.slice(8, 12).toString() === "WEBP") {
    return mediaBuffer;
  }

  // Arquivo de entrada temporário
  const inExt = isVideo ? "mp4" : detectImageExtension(mediaBuffer);
  const tmpIn = generateTempFileName(isVideo ? "mp4" : inExt);

  await fs.writeFile(tmpIn, mediaBuffer);
  const st = await fs.stat(tmpIn);
  if (st.size === 0) throw new Error("Arquivo temporário de entrada vazio");

  const vfBase = forceSquare
    ? "scale=320:320"
    : "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba";

  const filters = isVideo ? `${vfBase},fps=15` : vfBase;

  // Limites de tamanho e qualidade
  const MAX_SIZE = 990000; // Menos de 1MB com margem de segurança (~966KB)
  const MIN_QUALITY = isVideo ? 15 : 25;
  let quality = isVideo ? 45 : 75;
  let outBuffer = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 8;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    const tmpOut = generateTempFileName("webp");

    const cmdOptions = [
      "-vf", filters,
      "-c:v", "libwebp",
      "-lossless", "0",
      "-compression_level", "6",
      "-preset", "default",
      ...(isVideo
        ? ["-q:v", String(quality), "-loop", "0", "-an", "-vsync", "0", "-t", "8"]
        : ["-q:v", String(quality)])
    ];

    await new Promise((resolve, reject) => {
      ffmpeg(tmpIn)
        .outputOptions(cmdOptions)
        .format("webp")
        .on("error", err => reject(err))
        .on("end", () => resolve())
        .save(tmpOut);
    });

    const outStat = await fs.stat(tmpOut).catch(() => null);
    if (!outStat || outStat.size === 0) {
      await fs.unlink(tmpOut).catch(()=>{});
      throw new Error("Conversão falhou: saída vazia");
    }

    outBuffer = await fs.readFile(tmpOut);
    await fs.unlink(tmpOut).catch(()=>{});

    // Verifica se está dentro do limite
    if (outBuffer.length <= MAX_SIZE) {
      break;
    }

    // Se ainda está grande, reduz qualidade
    if (quality <= MIN_QUALITY) {
      break;
    }

    // Reduz qualidade progressivamente
    const reductionFactor = outBuffer.length / MAX_SIZE;
    if (reductionFactor > 1.5) {
      quality = Math.max(MIN_QUALITY, Math.floor(quality * 0.6));
    } else if (reductionFactor > 1.2) {
      quality = Math.max(MIN_QUALITY, Math.floor(quality * 0.75));
    } else {
      quality = Math.max(MIN_QUALITY, quality - 10);
    }
  }

  // Limpeza
  await fs.unlink(tmpIn).catch(()=>{});

  return outBuffer;
}

// Escrever EXIF
async function writeExif(webpBuffer, metadata) {
  try {
    const img = new webp.Image();
    await img.load(webpBuffer);
    const json = {
      "sticker-pack-id": "https://github.com/hiudyy",
      "sticker-pack-name": metadata.packname || "",
      "sticker-pack-publisher": metadata.author || "",
      "emojis": ["NazuninhaBot"]
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
  } catch (e) {
    return webpBuffer;
  }
}

// Resolver input
async function resolveInputToBuffer(input) {
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === "string") {
    if (/^data:.*?;base64,/i.test(input)) {
      return Buffer.from(input.split(",")[1], "base64");
    }
    if (/^https?:\/\//i.test(input)) {
      return await getBuffer(input);
    }
    return await fs.readFile(input);
  }
  if (input && typeof input === "object" && input.url) {
    return await getBuffer(input.url);
  }
  throw new Error("Entrada de sticker inválida");
}

/**
 * Envia sticker
 */
const sendSticker = async (nazu, jid, {
  sticker: input,
  type = "image",
  packname = "",
  author = "",
  forceSquare = false
}, { quoted } = {}) => {
  if (!["image", "video"].includes(type)) {
    throw new Error('Tipo deve ser "image" ou "video"');
  }
  const buffer = await resolveInputToBuffer(input);
  if (!buffer || buffer.length < 10) {
    throw new Error("Buffer inválido/vazio");
  }

  let webpBuffer = await convertToWebp(buffer, type === "video", forceSquare);

  if (packname || author) {
    webpBuffer = await writeExif(webpBuffer, { packname, author });
  }

  await nazu.sendMessage(jid, { sticker: webpBuffer }, { quoted });
  return webpBuffer;
};

export { sendSticker };
