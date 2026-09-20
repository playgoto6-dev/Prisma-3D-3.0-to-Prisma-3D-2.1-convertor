import { decode, encode } from "@msgpack/msgpack";
import { basename, decodeText, unzipPrisma, zipPrisma, type ZipEntries } from "./zip.ts";
import { asBlobPart, copyBytes } from "./bytes.ts";

export const LEGACY_HEADER = new Uint8Array([0x26, 0x20, 0x00, 0x00]);
const INT_MIN = -2147483648;
const UUID_RE = /^[0-9a-f]{32}$/i;

const DROP_PROPS = new Set(["normalBreakAngle"]);

export type PrismaKind = "3.3" | "2.1" | "unknown";

export type TextureFile = {
  path: string;
  name: string;
  data: Uint8Array;
};

export type ParsedPrisma = {
  kind: PrismaKind;
  name: string;
  settings: unknown[];
  objects: unknown[][];
  materials: unknown[][];
  meshes: unknown[][];
  textures: TextureFile[];
  warnings: string[];
  notes: string[];
};

export type ConvertResult = {
  source: ParsedPrisma;
  legacy: ParsedPrisma;
  zip: Uint8Array;
  fileName: string;
};

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function headerOf(data: Uint8Array): Uint8Array {
  return copyBytes(data.subarray(0, Math.min(4, data.length)));
}

function unpackRoot(data: Uint8Array): unknown {
  if (data.length <= 4) throw new Error("Файл .proj слишком короткий");
  return decode(data.subarray(4));
}

function packRoot(header: Uint8Array, root: unknown): Uint8Array {
  const body = encode(root, { forceFloat32: true });
  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body, header.length);
  return out;
}

function headerEquals(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function looksUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function defaultSettings(): unknown[] {
  return [
    1280,
    720,
    30,
    INT_MIN,
    INT_MIN,
    -1,
    [1.2, 1.2, 1.2, 1],
    [0.3764705955982208, 0.3843137323856354, 0.4, 1],
    1.0,
  ];
}

function sanitizeName(name: string): string {
  const trimmed = name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return trimmed || "Converted";
}

function findBySuffix(entries: ZipEntries, suffix: string): Array<[string, Uint8Array]> {
  const lower = suffix.toLowerCase();
  return Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(lower));
}

function parseMetaName(entries: ZipEntries): string | null {
  for (const [name, data] of Object.entries(entries)) {
    if (basename(name) !== ".meta") continue;
    try {
      const meta = JSON.parse(decodeText(data)) as { projectName?: unknown };
      if (typeof meta.projectName === "string" && meta.projectName.trim()) {
        return meta.projectName.trim();
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function folderHint(entries: ZipEntries): string | null {
  const keys = Object.keys(entries);
  if (keys.length === 0) return null;
  const first = keys[0]?.split("/")[0];
  if (first && !/^[0-9a-f]{32}$/i.test(first)) return first;
  return null;
}

function countTriangles(meshes: unknown[][]): number {
  let n = 0;
  for (const mesh of meshes) {
    const indices = asArr(mesh[4]);
    n += Math.floor(indices.length / 3);
  }
  return n;
}

export function statsOf(project: ParsedPrisma) {
  return {
    objects: project.objects.length,
    meshes: project.meshes.length,
    materials: project.materials.length,
    textures: project.textures.length,
    triangles: countTriangles(project.meshes),
  };
}

function parseProjBlob(data: Uint8Array): {
  header: Uint8Array;
  settings: unknown[];
  objects: unknown[][];
  materials: unknown[][];
  meshes: unknown[][];
  extra: unknown[];
} {
  const header = headerOf(data);
  const root = unpackRoot(data);
  const arr = asArr(root);
  if (arr.length < 2) {
    throw new Error("Неизвестный формат .proj");
  }
  return {
    header,
    settings: asArr(arr[0]),
    objects: asArr(arr[1]) as unknown[][],
    materials: asArr(arr[2]) as unknown[][],
    meshes: asArr(arr[3]) as unknown[][],
    extra: arr.slice(4),
  };
}

function detectKind(opts: {
  header: Uint8Array;
  objects: unknown[][];
  hasPobject: boolean;
  hasMeta: boolean;
  extraLen: number;
}): PrismaKind {
  if (headerEquals(opts.header, LEGACY_HEADER)) return "2.1";
  const firstId = opts.objects[0]?.[0];
  if (typeof firstId === "number") return "2.1";
  if (opts.hasPobject || opts.hasMeta || looksUuid(firstId) || opts.extraLen > 0) return "3.3";
  if (typeof firstId === "string") return "3.3";
  return "unknown";
}

export function parsePrisma(data: Uint8Array, fileName = "project.prisma"): ParsedPrisma {
  const entries = unzipPrisma(data);
  const warnings: string[] = [];
  const notes: string[] = [];

  const projFiles = [
    ...findBySuffix(entries, "project.proj"),
    ...Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(".proj")),
  ];
  const uniqueProj = new Map(projFiles);
  const pobjects = findBySuffix(entries, ".pobject");
  const hasMeta = Object.keys(entries).some((n) => basename(n) === ".meta");

  const textures: TextureFile[] = [];
  for (const [path, bytes] of Object.entries(entries)) {
    const lower = path.toLowerCase();
    if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) continue;
    if (basename(path).toLowerCase() === "screenshot.png") continue;
    textures.push({ path, name: basename(path), data: bytes });
  }

  let settings = defaultSettings();
  let objects: unknown[][] = [];
  let materials: unknown[][] = [];
  let meshes: unknown[][] = [];
  let header = new Uint8Array([0, 0, 0, 0]);

  if (uniqueProj.size > 0) {
    const [, blob] = [...uniqueProj][0]!;
    const parsed = parseProjBlob(blob);
    header = parsed.header;
    settings = parsed.settings.length ? parsed.settings : settings;
    objects = parsed.objects;
    materials = parsed.materials;
    meshes = parsed.meshes;
  }

  const pobjectScenes: unknown[][] = [];
  const pobjectMeshes: unknown[][] = [];
  for (const [, blob] of pobjects) {
    const root = asArr(unpackRoot(blob));
    // pobject: [uuid, objects, meshes]
    if (root.length >= 3 && Array.isArray(root[1])) {
      pobjectScenes.push(...(root[1] as unknown[][]));
      pobjectMeshes.push(...asArr(root[2]) as unknown[][]);
    } else if (root.length >= 4 && Array.isArray(root[1]) && Array.isArray(root[3])) {
      // already a full project root stored as pobject
      pobjectScenes.push(...(root[1] as unknown[][]));
      if (asArr(root[2]).length && materials.length === 0) {
        materials = root[2] as unknown[][];
      }
      pobjectMeshes.push(...(root[3] as unknown[][]));
    }
  }

  if (pobjectScenes.length > 0) {
    objects = pobjectScenes;
  }
  if (pobjectMeshes.length > 0) {
    meshes = pobjectMeshes;
  }

  const kind = detectKind({
    header,
    objects,
    hasPobject: pobjects.length > 0,
    hasMeta,
    extraLen: uniqueProj.size ? 0 : 0,
  });

  const metaName = parseMetaName(entries);
  const nameFromFile = fileName.replace(/\.prisma$/i, "");
  const name = sanitizeName(metaName || folderHint(entries) || nameFromFile || "Converted");

  if (objects.length === 0 && meshes.length === 0) {
    throw new Error("В архиве нет сцены Prisma 3D (объекты/меши не найдены).");
  }

  if (kind === "3.3") {
    notes.push("Исходник: Prisma 3D 3.x (UUID, .pobject, отдельно материалы).");
  } else if (kind === "2.1") {
    notes.push("Файл уже в формате Prisma 3D 2.1 — можно переупаковать или скачать как есть.");
  }

  return {
    kind: kind === "unknown" && looksUuid(objects[0]?.[0]) ? "3.3" : kind,
    name,
    settings,
    objects,
    materials,
    meshes,
    textures,
    warnings,
    notes,
  };
}

function collectMaps(project: ParsedPrisma) {
  const objMap = new Map<string, number>();
  const meshMap = new Map<string, number>();
  const matMap = new Map<string, number>();

  project.objects.forEach((o, i) => {
    if (looksUuid(o[0])) objMap.set(o[0].toLowerCase(), i);
  });
  project.meshes.forEach((m, i) => {
    if (looksUuid(m[0])) meshMap.set(m[0].toLowerCase(), i);
  });
  project.materials.forEach((m, i) => {
    if (looksUuid(m[0])) matMap.set(m[0].toLowerCase(), i + 1);
  });

  return { objMap, meshMap, matMap };
}

function remapId(
  uid: unknown,
  kind: "mesh" | "mat" | "obj" | "any",
  maps: ReturnType<typeof collectMaps>,
): unknown {
  if (typeof uid === "number") return uid;
  if (!looksUuid(uid)) return uid;
  const key = uid.toLowerCase();
  if (kind === "mesh" || kind === "any") {
    const hit = maps.meshMap.get(key);
    if (hit !== undefined) return hit;
  }
  if (kind === "mat" || kind === "any") {
    const hit = maps.matMap.get(key);
    if (hit !== undefined) return hit;
  }
  if (kind === "obj" || kind === "any") {
    const hit = maps.objMap.get(key);
    if (hit !== undefined) return hit;
  }
  return uid;
}

function remapJsonValue(val: unknown, propName: string, maps: ReturnType<typeof collectMaps>): unknown {
  if (typeof val !== "string") return val;
  const s = val.trim();
  if (!(s.startsWith("{") || s.startsWith("["))) return val;
  try {
    const data = JSON.parse(s) as unknown;
    if (!data || typeof data !== "object") return val;
    let changed = false;
    const obj = data as Record<string, unknown>;
    if ("id" in obj) {
      const kind = propName === "pMesh" ? "mesh" : "any";
      const next = remapId(obj.id, kind, maps);
      if (next !== obj.id) {
        obj.id = next;
        changed = true;
      }
    }
    if (Array.isArray(obj.ids)) {
      const kind = propName === "materials" ? "mat" : "obj";
      obj.ids = obj.ids.map((id) => {
        const next = remapId(id, kind, maps);
        if (next !== id) changed = true;
        return next;
      });
    }
    if (!changed) return val;
    return JSON.stringify(obj);
  } catch {
    return val;
  }
}

function convertComp(comp: unknown, maps: ReturnType<typeof collectMaps>): unknown[] | null {
  const arr = asArr(comp);
  if (arr.length < 2) return null;
  const name = asStr(arr[0]);
  const propsIn = asArr(arr[1]);
  const props: unknown[][] = [];
  for (const prop of propsIn) {
    const p = asArr(prop);
    const key = asStr(p[0]);
    if (!key || DROP_PROPS.has(key)) continue;
    props.push([key, remapJsonValue(p[1], key, maps), null]);
  }
  return [name, props];
}

function convertObject(
  obj: unknown[],
  index: number,
  maps: ReturnType<typeof collectMaps>,
  warnings: string[],
): unknown[] {
  const comps = asArr(obj[2])
    .map((c) => convertComp(c, maps))
    .filter((c): c is unknown[] => Boolean(c));

  let parent = obj[3];
  let parentId = -1;
  if (typeof parent === "number") {
    parentId = parent;
  } else if (parent == null) {
    parentId = -1;
  } else if (looksUuid(parent)) {
    const hit = maps.objMap.get(parent.toLowerCase());
    parentId = hit === undefined ? -1 : hit;
  }

  const known = new Set(["PTransform", "PMeshRenderer", "PCamera", "PLight", "PAnimator"]);
  for (const c of comps) {
    const n = asStr(c[0]);
    if (n && !known.has(n)) {
      warnings.push(`Компонент «${n}» на «${asStr(obj[1], "object")}» перенесён как есть.`);
    }
  }

  return [
    typeof obj[0] === "number" ? obj[0] : index,
    asStr(obj[1], `Object ${index}`),
    comps,
    parentId,
    asBool(obj[4], true),
    asBool(obj[8] ?? obj[5], false),
  ];
}

function convertMaterial(mat: unknown[], index: number): unknown[] {
  if (typeof mat[0] === "number" && mat.length === 3) {
    // already 2.1-shaped
    return [typeof mat[0] === "number" ? mat[0] : index + 1, mat[1] ?? null, asArr(mat[2])];
  }
  const propsIn = asArr(mat[2]);
  const byName = new Map<string, unknown>();
  for (const prop of propsIn) {
    const p = asArr(prop);
    byName.set(asStr(p[0]), p[1]);
  }
  const displayName = asStr(mat[1], "Material") || "Material";
  const props: unknown[][] = [
    ["name", displayName, null],
    ["color", byName.get("color") ?? '{"r":1.0,"g":1.0,"b":1.0,"a":1.0}', null],
    ["texture", byName.get("texture") ?? null, null],
    ["glossiness", byName.get("glossiness") ?? "0.5", null],
    ["specular", byName.get("specular") ?? "0", null],
    ["alpha", byName.get("alpha") ?? "1", null],
    ["pixelBlending", byName.get("pixelBlending") ?? "False", null],
  ];
  return [index + 1, null, props];
}

function convertMesh(mesh: unknown[], index: number): unknown[] {
  if (mesh.length >= 11) {
    return [index, mesh[1], mesh[2], mesh[3], mesh[4], mesh[5], mesh[8], mesh[9], mesh[10]];
  }
  if (mesh.length >= 9) {
    return [index, mesh[1], mesh[2], mesh[3], mesh[4], mesh[5], mesh[6], mesh[7], mesh[8]];
  }
  return [index, [], [], [], [], [], [], [], []];
}

function convertSettings(settings: unknown[]): unknown[] {
  const s = settings.length ? settings : defaultSettings();
  const resX = typeof s[0] === "number" ? s[0] : 1280;
  const resY = typeof s[1] === "number" ? s[1] : 720;
  const fps = typeof s[2] === "number" ? s[2] : 30;
  const bg1 = Array.isArray(s[6]) ? s[6] : [1.2, 1.2, 1.2, 1];
  const bg2 = Array.isArray(s[7]) ? s[7] : [0.38, 0.38, 0.4, 1];
  const intensity = typeof s[8] === "number" ? s[8] : 1.0;
  return [resX, resY, fps, INT_MIN, INT_MIN, -1, bg1, bg2, intensity];
}

export function toLegacy21(source: ParsedPrisma): ParsedPrisma {
  if (source.kind === "2.1") {
    return {
      ...source,
      kind: "2.1",
      name: sanitizeName(source.name),
      settings: convertSettings(source.settings),
    };
  }

  const maps = collectMaps(source);
  const warnings = [...source.warnings];
  const objects = source.objects.map((o, i) => convertObject(o, i, maps, warnings));
  const materials = source.materials.map((m, i) => convertMaterial(m, i));
  const meshes = source.meshes.map((m, i) => convertMesh(m, i));

  const uniqueWarnings = [...new Set(warnings)];

  return {
    kind: "2.1",
    name: sanitizeName(source.name),
    settings: convertSettings(source.settings),
    objects,
    materials,
    meshes,
    textures: source.textures,
    warnings: uniqueWarnings,
    notes: [
      ...source.notes,
      "Идентификаторы UUID заменены на числовые ID Prisma 2.1.",
      "Меши упакованы в .proj, текстуры — в папку res/.",
    ],
  };
}

function makePlaceholderPng(label: string): Uint8Array {
  // Minimal 1×1 PNG is too small for Prisma; build a tiny uncompressed truecolor PNG 512×512 is huge
  // without a canvas. Callers should pass a screenshot. This 8×8 placeholder is a last resort.
  const png8 = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKUlEQVQYV2NkYGD4z0AEYGRgYPiPrJgRJQ+WQeaiK8blDFIMYcQNAgQAAP//C6wD/U1nYdYAAAAASUVORK5CYII=",
    ),
    (c) => c.charCodeAt(0),
  );
  void label;
  return png8;
}

export function packLegacyZip(legacy: ParsedPrisma, screenshot?: Uint8Array | null): Uint8Array {
  const name = sanitizeName(legacy.name);
  const root: unknown[] = [legacy.settings, legacy.objects, legacy.materials, legacy.meshes];
  const proj = packRoot(LEGACY_HEADER, root);
  const entries: ZipEntries = {
    [`${name}/${name}.proj`]: proj,
    [`${name}/screenshot.png`]: screenshot && screenshot.length > 80 ? screenshot : makePlaceholderPng(name),
  };
  const used = new Set<string>();
  for (const tex of legacy.textures) {
    let fileName = tex.name || "texture.png";
    if (used.has(fileName)) {
      const stem = fileName.replace(/(\.[^.]+)$/, "");
      const ext = fileName.slice(stem.length) || ".png";
      let i = 2;
      while (used.has(`${stem}_${i}${ext}`)) i += 1;
      fileName = `${stem}_${i}${ext}`;
    }
    used.add(fileName);
    entries[`${name}/res/${fileName}`] = tex.data;
  }
  return zipPrisma(entries);
}

export function convertPrismaFile(data: Uint8Array, fileName: string, screenshot?: Uint8Array | null): ConvertResult {
  const source = parsePrisma(data, fileName);
  const legacy = toLegacy21(source);
  const zip = packLegacyZip(legacy, screenshot);
  return {
    source,
    legacy,
    zip,
    fileName: `${legacy.name} 2.1.prisma`,
  };
}

function downloadBlob(data: Uint8Array, fileName: string, mime: string) {
  const blob = new Blob([asBlobPart(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBytes(data: Uint8Array, fileName: string, mime = "application/octet-stream") {
  downloadBlob(data, fileName, mime);
}
