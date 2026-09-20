import type { ParsedPrisma } from "./convert.ts";

export type Vec3 = [number, number, number];

export type PreviewGeom = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  color: [number, number, number, number];
  textureName: string | null;
  pixelBlend: boolean;
};

export type PreviewNode = {
  id: number;
  parent: number;
  name: string;
  position: Vec3;
  rotationDeg: Vec3;
  scale: Vec3;
  active: boolean;
  geom: PreviewGeom | null;
};

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseVec3(raw: unknown, fallback: Vec3 = [0, 0, 0]): Vec3 {
  if (typeof raw !== "string") return fallback;
  try {
    const o = JSON.parse(raw) as { x?: unknown; y?: unknown; z?: unknown };
    return [Number(o.x) || 0, Number(o.y) || 0, Number(o.z) || 0];
  } catch {
    return fallback;
  }
}

function parseColor(raw: unknown): [number, number, number, number] {
  if (typeof raw !== "string") return [1, 1, 1, 1];
  try {
    const o = JSON.parse(raw) as { r?: unknown; g?: unknown; b?: unknown; a?: unknown };
    return [Number(o.r) || 0, Number(o.g) || 0, Number(o.b) || 0, Number(o.a) ?? 1];
  } catch {
    return [1, 1, 1, 1];
  }
}

function parseIdJson(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return null;
  try {
    const o = JSON.parse(raw) as { id?: unknown };
    if (typeof o.id === "number") return o.id;
  } catch {
    /* ignore */
  }
  return null;
}

function parseIdsJson(raw: unknown): number[] {
  if (typeof raw !== "string") return [];
  try {
    const o = JSON.parse(raw) as { ids?: unknown };
    if (Array.isArray(o.ids)) {
      return o.ids.filter((x): x is number => typeof x === "number");
    }
  } catch {
    /* ignore */
  }
  return [];
}

function propMap(comp: unknown): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const props = asArr(asArr(comp)[1]);
  for (const p of props) {
    const a = asArr(p);
    map.set(asStr(a[0]), a[1]);
  }
  return map;
}

function flattenMesh(mesh: unknown[]): { positions: Float32Array; normals: Float32Array; uvs: Float32Array } | null {
  const indices = asArr(mesh[4]) as number[];
  const uvsPerIndex = asArr(mesh[5]);
  const verts = asArr(mesh[6]);
  const faceNormals = asArr(mesh[3]);
  if (!indices.length || !verts.length) return null;

  const positions = new Float32Array(indices.length * 3);
  const normals = new Float32Array(indices.length * 3);
  const uvs = new Float32Array(indices.length * 2);

  for (let i = 0; i < indices.length; i++) {
    const vi = indices[i] ?? 0;
    const vert = asArr(verts[vi]);
    positions[i * 3] = Number(vert[0]) || 0;
    positions[i * 3 + 1] = Number(vert[1]) || 0;
    positions[i * 3 + 2] = Number(vert[2]) || 0;

    const face = Math.floor(i / 3);
    const n = asArr(faceNormals[face]);
    normals[i * 3] = Number(n[0]) || 0;
    normals[i * 3 + 1] = Number(n[1]) || 0;
    normals[i * 3 + 2] = Number(n[2]) || 1;

    const uv = asArr(uvsPerIndex[i]);
    uvs[i * 2] = Number(uv[0]) || 0;
    uvs[i * 2 + 1] = Number(uv[1]) || 0;
  }

  return { positions, normals, uvs };
}

function textureBasename(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null") return null;
  const parts = trimmed.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || null;
}

export function buildPreviewNodes(project: ParsedPrisma): PreviewNode[] {
  const matById = new Map<
    number,
    { color: [number, number, number, number]; texture: string | null; pixelBlend: boolean }
  >();
  project.materials.forEach((mat, i) => {
    const id = typeof mat[0] === "number" ? mat[0] : i + 1;
    const props = asArr(mat[2]);
    const by = new Map<string, unknown>();
    for (const p of props) {
      const a = asArr(p);
      by.set(asStr(a[0]), a[1]);
    }
    matById.set(id, {
      color: parseColor(by.get("color")),
      texture: textureBasename(by.get("texture")),
      pixelBlend: asStr(by.get("pixelBlending")) !== "False",
    });
  });

  const meshById = new Map<number, unknown[]>();
  project.meshes.forEach((m, idx) => {
    const id = typeof m[0] === "number" ? m[0] : idx;
    meshById.set(id, m);
  });

  return project.objects.map((obj, i) => {
    const id = typeof obj[0] === "number" ? obj[0] : i;
    const parent = typeof obj[3] === "number" ? obj[3] : -1;
    const comps = asArr(obj[2]);
    let position: Vec3 = [0, 0, 0];
    let rotationDeg: Vec3 = [0, 0, 0];
    let scale: Vec3 = [1, 1, 1];
    let meshId: number | null = null;
    let matIds: number[] = [];

    for (const c of comps) {
      const name = asStr(asArr(c)[0]);
      const props = propMap(c);
      if (name === "PTransform") {
        position = parseVec3(props.get("localPosition"));
        rotationDeg = parseVec3(props.get("localEulerAnglesHint"));
        scale = parseVec3(props.get("localScale"), [1, 1, 1]);
      }
      if (name === "PMeshRenderer") {
        meshId = parseIdJson(props.get("pMesh"));
        matIds = parseIdsJson(props.get("materials"));
      }
    }

    let geom: PreviewGeom | null = null;
    if (meshId != null) {
      const mesh = meshById.get(meshId);
      const flat = mesh ? flattenMesh(mesh) : null;
      if (flat) {
        const mat = matById.get(matIds[0] ?? -1);
        geom = {
          ...flat,
          color: mat?.color ?? [1, 1, 1, 1],
          textureName: mat?.texture ?? null,
          pixelBlend: mat?.pixelBlend ?? true,
        };
      }
    }

    return {
      id,
      parent,
      name: asStr(obj[1]) || `object-${id}`,
      position,
      rotationDeg,
      scale,
      active: obj[4] !== false,
      geom,
    };
  });
}
