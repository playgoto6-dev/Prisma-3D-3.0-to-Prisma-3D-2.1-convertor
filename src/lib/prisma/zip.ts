import { unzipSync, zipSync, strFromU8 } from "fflate";
import { copyBytes } from "./bytes.ts";

export type ZipEntries = Record<string, Uint8Array>;

function looksLikeZip(data: Uint8Array): boolean {
  return data.length >= 4 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04;
}

/** Prisma 3.3.5 sometimes XORs the first ZIP byte (`\x60K` instead of `PK`). */
export function repairZipMagic(data: Uint8Array): Uint8Array {
  if (!looksLikeZip(data)) return data;
  if (data[0] === 0x50) return data;
  const copy = new Uint8Array(data);
  copy[0] = 0x50;
  return copy;
}

export function unzipPrisma(data: Uint8Array): ZipEntries {
  const candidates = [data];
  if (looksLikeZip(data) && data[0] !== 0x50) {
    candidates.unshift(repairZipMagic(data));
  } else if (data[0] !== 0x50) {
    candidates.push(repairZipMagic(data));
  }

  let lastError: unknown;
  for (const buf of candidates) {
    try {
      const raw = unzipSync(buf);
      const out: ZipEntries = {};
      for (const [name, bytes] of Object.entries(raw)) {
        if (!name || name.endsWith("/")) continue;
        if (name.startsWith("__MACOSX") || name.split("/").includes(".DS_Store")) continue;
        out[name.replace(/\\/g, "/")] = copyBytes(bytes);
      }
      if (Object.keys(out).length === 0) {
        throw new Error("empty archive");
      }
      return out;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    lastError instanceof Error
      ? `Не удалось открыть .prisma: ${lastError.message}`
      : "Не удалось открыть .prisma — это не ZIP-архив Prisma 3D.",
  );
}

export function zipPrisma(entries: ZipEntries): Uint8Array {
  const input: Record<string, Uint8Array> = {};
  for (const [name, bytes] of Object.entries(entries)) {
    input[name] = bytes;
  }
  return zipSync(input, { level: 6 });
}

export function decodeText(data: Uint8Array): string {
  return strFromU8(data);
}

export function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? path;
}
