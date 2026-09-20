import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Layers, c as Download, i as LoaderCircle, l as Box, n as Triangle, o as Image, r as TriangleAlert, s as FileBox, t as Upload, u as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as encode, t as decode } from "../_libs/msgpack__msgpack.mjs";
import { n as unzipSync, r as zipSync, t as strFromU8 } from "../_libs/fflate.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DTRyfBYf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-transform transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-elevated text-fg border border-border hover:border-border-strong",
			ghost: "text-muted hover:text-fg hover:bg-elevated",
			outline: "border border-border bg-transparent text-fg hover:bg-elevated"
		},
		size: {
			default: "h-11 rounded-md px-4 text-sm",
			sm: "h-9 rounded-sm px-3 text-sm",
			lg: "h-12 rounded-md px-5 text-base",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function looksLikeZip(data) {
	return data.length >= 4 && data[1] === 75 && data[2] === 3 && data[3] === 4;
}
/** Prisma 3.3.5 sometimes XORs the first ZIP byte (`\x60K` instead of `PK`). */
function repairZipMagic(data) {
	if (!looksLikeZip(data)) return data;
	if (data[0] === 80) return data;
	const copy = new Uint8Array(data);
	copy[0] = 80;
	return copy;
}
function unzipPrisma(data) {
	const candidates = [data];
	if (looksLikeZip(data) && data[0] !== 80) candidates.unshift(repairZipMagic(data));
	else if (data[0] !== 80) candidates.push(repairZipMagic(data));
	let lastError;
	for (const buf of candidates) try {
		const raw = unzipSync(buf);
		const out = {};
		for (const [name, bytes] of Object.entries(raw)) {
			if (!name || name.endsWith("/")) continue;
			if (name.startsWith("__MACOSX") || name.split("/").includes(".DS_Store")) continue;
			out[name.replace(/\\/g, "/")] = bytes;
		}
		if (Object.keys(out).length === 0) throw new Error("empty archive");
		return out;
	} catch (err) {
		lastError = err;
	}
	throw new Error(lastError instanceof Error ? `Не удалось открыть .prisma: ${lastError.message}` : "Не удалось открыть .prisma — это не ZIP-архив Prisma 3D.");
}
function zipPrisma(entries) {
	const input = {};
	for (const [name, bytes] of Object.entries(entries)) input[name] = bytes;
	return zipSync(input, { level: 6 });
}
function decodeText(data) {
	return strFromU8(data);
}
function basename(path) {
	const parts = path.replace(/\\/g, "/").split("/");
	return parts[parts.length - 1] ?? path;
}
var LEGACY_HEADER = new Uint8Array([
	38,
	32,
	0,
	0
]);
var INT_MIN = -2147483648;
var UUID_RE = /^[0-9a-f]{32}$/i;
var DROP_PROPS = /* @__PURE__ */ new Set(["normalBreakAngle"]);
function asArr$1(v) {
	return Array.isArray(v) ? v : [];
}
function asStr$1(v, fallback = "") {
	return typeof v === "string" ? v : fallback;
}
function asBool(v, fallback = false) {
	return typeof v === "boolean" ? v : fallback;
}
function headerOf(data) {
	return data.subarray(0, Math.min(4, data.length));
}
function unpackRoot(data) {
	if (data.length <= 4) throw new Error("Файл .proj слишком короткий");
	return decode(data.subarray(4));
}
function packRoot(header, root) {
	const body = encode(root, { useFloat32: true });
	const out = new Uint8Array(header.length + body.length);
	out.set(header, 0);
	out.set(body, header.length);
	return out;
}
function headerEquals(a, b) {
	return a.length === b.length && a.every((v, i) => v === b[i]);
}
function looksUuid(v) {
	return typeof v === "string" && UUID_RE.test(v);
}
function defaultSettings() {
	return [
		1280,
		720,
		30,
		INT_MIN,
		INT_MIN,
		-1,
		[
			1.2,
			1.2,
			1.2,
			1
		],
		[
			.3764705955982208,
			.3843137323856354,
			.4,
			1
		],
		1
	];
}
function sanitizeName(name) {
	return name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "Converted";
}
function findBySuffix(entries, suffix) {
	const lower = suffix.toLowerCase();
	return Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(lower));
}
function parseMetaName(entries) {
	for (const [name, data] of Object.entries(entries)) {
		if (basename(name) !== ".meta") continue;
		try {
			const meta = JSON.parse(decodeText(data));
			if (typeof meta.projectName === "string" && meta.projectName.trim()) return meta.projectName.trim();
		} catch {}
	}
	return null;
}
function folderHint(entries) {
	const keys = Object.keys(entries);
	if (keys.length === 0) return null;
	const first = keys[0]?.split("/")[0];
	if (first && !/^[0-9a-f]{32}$/i.test(first)) return first;
	return null;
}
function countTriangles(meshes) {
	let n = 0;
	for (const mesh of meshes) {
		const indices = asArr$1(mesh[4]);
		n += Math.floor(indices.length / 3);
	}
	return n;
}
function statsOf(project) {
	return {
		objects: project.objects.length,
		meshes: project.meshes.length,
		materials: project.materials.length,
		textures: project.textures.length,
		triangles: countTriangles(project.meshes)
	};
}
function parseProjBlob(data) {
	const header = headerOf(data);
	const arr = asArr$1(unpackRoot(data));
	if (arr.length < 2) throw new Error("Неизвестный формат .proj");
	return {
		header,
		settings: asArr$1(arr[0]),
		objects: asArr$1(arr[1]),
		materials: asArr$1(arr[2]),
		meshes: asArr$1(arr[3]),
		extra: arr.slice(4)
	};
}
function detectKind(opts) {
	if (headerEquals(opts.header, LEGACY_HEADER)) return "2.1";
	const firstId = opts.objects[0]?.[0];
	if (typeof firstId === "number") return "2.1";
	if (opts.hasPobject || opts.hasMeta || looksUuid(firstId) || opts.extraLen > 0) return "3.3";
	if (typeof firstId === "string") return "3.3";
	return "unknown";
}
function parsePrisma(data, fileName = "project.prisma") {
	const entries = unzipPrisma(data);
	const warnings = [];
	const notes = [];
	const projFiles = [...findBySuffix(entries, "project.proj"), ...Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(".proj"))];
	const uniqueProj = new Map(projFiles);
	const pobjects = findBySuffix(entries, ".pobject");
	const hasMeta = Object.keys(entries).some((n) => basename(n) === ".meta");
	const textures = [];
	for (const [path, bytes] of Object.entries(entries)) {
		const lower = path.toLowerCase();
		if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) continue;
		if (basename(path).toLowerCase() === "screenshot.png") continue;
		textures.push({
			path,
			name: basename(path),
			data: bytes
		});
	}
	let settings = defaultSettings();
	let objects = [];
	let materials = [];
	let meshes = [];
	let header = new Uint8Array([
		0,
		0,
		0,
		0
	]);
	if (uniqueProj.size > 0) {
		const [, blob] = [...uniqueProj][0];
		const parsed = parseProjBlob(blob);
		header = parsed.header;
		settings = parsed.settings.length ? parsed.settings : settings;
		objects = parsed.objects;
		materials = parsed.materials;
		meshes = parsed.meshes;
	}
	const pobjectScenes = [];
	const pobjectMeshes = [];
	for (const [, blob] of pobjects) {
		const root = asArr$1(unpackRoot(blob));
		if (root.length >= 3 && Array.isArray(root[1])) {
			pobjectScenes.push(...root[1]);
			pobjectMeshes.push(...asArr$1(root[2]));
		} else if (root.length >= 4 && Array.isArray(root[1]) && Array.isArray(root[3])) {
			pobjectScenes.push(...root[1]);
			if (asArr$1(root[2]).length && materials.length === 0) materials = root[2];
			pobjectMeshes.push(...root[3]);
		}
	}
	if (pobjectScenes.length > 0) objects = pobjectScenes;
	if (pobjectMeshes.length > 0) meshes = pobjectMeshes;
	const kind = detectKind({
		header,
		objects,
		hasPobject: pobjects.length > 0,
		hasMeta,
		extraLen: uniqueProj.size ? 0 : 0
	});
	const metaName = parseMetaName(entries);
	const nameFromFile = fileName.replace(/\.prisma$/i, "");
	const name = sanitizeName(metaName || folderHint(entries) || nameFromFile || "Converted");
	if (objects.length === 0 && meshes.length === 0) throw new Error("В архиве нет сцены Prisma 3D (объекты/меши не найдены).");
	if (kind === "3.3") notes.push("Исходник: Prisma 3D 3.x (UUID, .pobject, отдельно материалы).");
	else if (kind === "2.1") notes.push("Файл уже в формате Prisma 3D 2.1 — можно переупаковать или скачать как есть.");
	return {
		kind: kind === "unknown" && looksUuid(objects[0]?.[0]) ? "3.3" : kind,
		name,
		settings,
		objects,
		materials,
		meshes,
		textures,
		warnings,
		notes
	};
}
function collectMaps(project) {
	const objMap = /* @__PURE__ */ new Map();
	const meshMap = /* @__PURE__ */ new Map();
	const matMap = /* @__PURE__ */ new Map();
	project.objects.forEach((o, i) => {
		if (looksUuid(o[0])) objMap.set(o[0].toLowerCase(), i);
	});
	project.meshes.forEach((m, i) => {
		if (looksUuid(m[0])) meshMap.set(m[0].toLowerCase(), i);
	});
	project.materials.forEach((m, i) => {
		if (looksUuid(m[0])) matMap.set(m[0].toLowerCase(), i + 1);
	});
	return {
		objMap,
		meshMap,
		matMap
	};
}
function remapId(uid, kind, maps) {
	if (typeof uid === "number") return uid;
	if (!looksUuid(uid)) return uid;
	const key = uid.toLowerCase();
	if (kind === "mesh" || kind === "any") {
		const hit = maps.meshMap.get(key);
		if (hit !== void 0) return hit;
	}
	if (kind === "mat" || kind === "any") {
		const hit = maps.matMap.get(key);
		if (hit !== void 0) return hit;
	}
	if (kind === "obj" || kind === "any") {
		const hit = maps.objMap.get(key);
		if (hit !== void 0) return hit;
	}
	return uid;
}
function remapJsonValue(val, propName, maps) {
	if (typeof val !== "string") return val;
	const s = val.trim();
	if (!(s.startsWith("{") || s.startsWith("["))) return val;
	try {
		const data = JSON.parse(s);
		if (!data || typeof data !== "object") return val;
		let changed = false;
		const obj = data;
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
function convertComp(comp, maps) {
	const arr = asArr$1(comp);
	if (arr.length < 2) return null;
	const name = asStr$1(arr[0]);
	const propsIn = asArr$1(arr[1]);
	const props = [];
	for (const prop of propsIn) {
		const p = asArr$1(prop);
		const key = asStr$1(p[0]);
		if (!key || DROP_PROPS.has(key)) continue;
		props.push([
			key,
			remapJsonValue(p[1], key, maps),
			null
		]);
	}
	return [name, props];
}
function convertObject(obj, index, maps, warnings) {
	const comps = asArr$1(obj[2]).map((c) => convertComp(c, maps)).filter((c) => Boolean(c));
	let parent = obj[3];
	let parentId = -1;
	if (typeof parent === "number") parentId = parent;
	else if (parent == null) parentId = -1;
	else if (looksUuid(parent)) {
		const hit = maps.objMap.get(parent.toLowerCase());
		parentId = hit === void 0 ? -1 : hit;
	}
	const known = /* @__PURE__ */ new Set([
		"PTransform",
		"PMeshRenderer",
		"PCamera",
		"PLight",
		"PAnimator"
	]);
	for (const c of comps) {
		const n = asStr$1(c[0]);
		if (n && !known.has(n)) warnings.push(`Компонент «${n}» на «${asStr$1(obj[1], "object")}» перенесён как есть.`);
	}
	return [
		typeof obj[0] === "number" ? obj[0] : index,
		asStr$1(obj[1], `Object ${index}`),
		comps,
		parentId,
		asBool(obj[4], true),
		asBool(obj[8] ?? obj[5], false)
	];
}
function convertMaterial(mat, index) {
	if (typeof mat[0] === "number" && mat.length === 3) return [
		typeof mat[0] === "number" ? mat[0] : index + 1,
		mat[1] ?? null,
		asArr$1(mat[2])
	];
	const propsIn = asArr$1(mat[2]);
	const byName = /* @__PURE__ */ new Map();
	for (const prop of propsIn) {
		const p = asArr$1(prop);
		byName.set(asStr$1(p[0]), p[1]);
	}
	const props = [
		[
			"name",
			asStr$1(mat[1], "Material") || "Material",
			null
		],
		[
			"color",
			byName.get("color") ?? "{\"r\":1.0,\"g\":1.0,\"b\":1.0,\"a\":1.0}",
			null
		],
		[
			"texture",
			byName.get("texture") ?? null,
			null
		],
		[
			"glossiness",
			byName.get("glossiness") ?? "0.5",
			null
		],
		[
			"specular",
			byName.get("specular") ?? "0",
			null
		],
		[
			"alpha",
			byName.get("alpha") ?? "1",
			null
		],
		[
			"pixelBlending",
			byName.get("pixelBlending") ?? "False",
			null
		]
	];
	return [
		index + 1,
		null,
		props
	];
}
function convertMesh(mesh, index) {
	if (mesh.length >= 11) return [
		index,
		mesh[1],
		mesh[2],
		mesh[3],
		mesh[4],
		mesh[5],
		mesh[8],
		mesh[9],
		mesh[10]
	];
	if (mesh.length >= 9) return [
		index,
		mesh[1],
		mesh[2],
		mesh[3],
		mesh[4],
		mesh[5],
		mesh[6],
		mesh[7],
		mesh[8]
	];
	return [
		index,
		[],
		[],
		[],
		[],
		[],
		[],
		[],
		[]
	];
}
function convertSettings(settings) {
	const s = settings.length ? settings : defaultSettings();
	return [
		typeof s[0] === "number" ? s[0] : 1280,
		typeof s[1] === "number" ? s[1] : 720,
		typeof s[2] === "number" ? s[2] : 30,
		INT_MIN,
		INT_MIN,
		-1,
		Array.isArray(s[6]) ? s[6] : [
			1.2,
			1.2,
			1.2,
			1
		],
		Array.isArray(s[7]) ? s[7] : [
			.38,
			.38,
			.4,
			1
		],
		typeof s[8] === "number" ? s[8] : 1
	];
}
function toLegacy21(source) {
	if (source.kind === "2.1") return {
		...source,
		kind: "2.1",
		name: sanitizeName(source.name),
		settings: convertSettings(source.settings)
	};
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
			"Меши упакованы в .proj, текстуры — в папку res/."
		]
	};
}
function makePlaceholderPng(label) {
	return Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKUlEQVQYV2NkYGD4z0AEYGRgYPiPrJgRJQ+WQeaiK8blDFIMYcQNAgQAAP//C6wD/U1nYdYAAAAASUVORK5CYII="), (c) => c.charCodeAt(0));
}
function packLegacyZip(legacy, screenshot) {
	const name = sanitizeName(legacy.name);
	const proj = packRoot(LEGACY_HEADER, [
		legacy.settings,
		legacy.objects,
		legacy.materials,
		legacy.meshes
	]);
	const entries = {
		[`${name}/${name}.proj`]: proj,
		[`${name}/screenshot.png`]: screenshot && screenshot.length > 80 ? screenshot : makePlaceholderPng(name)
	};
	const used = /* @__PURE__ */ new Set();
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
function downloadBlob(data, fileName, mime) {
	const copy = new Uint8Array(data.byteLength);
	copy.set(data);
	const blob = new Blob([copy], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function downloadBytes(data, fileName, mime = "application/octet-stream") {
	downloadBlob(data, fileName, mime);
}
function asArr(v) {
	return Array.isArray(v) ? v : [];
}
function asStr(v) {
	return typeof v === "string" ? v : "";
}
function parseVec3(raw, fallback = [
	0,
	0,
	0
]) {
	if (typeof raw !== "string") return fallback;
	try {
		const o = JSON.parse(raw);
		return [
			Number(o.x) || 0,
			Number(o.y) || 0,
			Number(o.z) || 0
		];
	} catch {
		return fallback;
	}
}
function parseColor(raw) {
	if (typeof raw !== "string") return [
		1,
		1,
		1,
		1
	];
	try {
		const o = JSON.parse(raw);
		return [
			Number(o.r) || 0,
			Number(o.g) || 0,
			Number(o.b) || 0,
			Number(o.a) ?? 1
		];
	} catch {
		return [
			1,
			1,
			1,
			1
		];
	}
}
function parseIdJson(raw) {
	if (typeof raw === "number") return raw;
	if (typeof raw !== "string") return null;
	try {
		const o = JSON.parse(raw);
		if (typeof o.id === "number") return o.id;
	} catch {}
	return null;
}
function parseIdsJson(raw) {
	if (typeof raw !== "string") return [];
	try {
		const o = JSON.parse(raw);
		if (Array.isArray(o.ids)) return o.ids.filter((x) => typeof x === "number");
	} catch {}
	return [];
}
function propMap(comp) {
	const map = /* @__PURE__ */ new Map();
	const props = asArr(asArr(comp)[1]);
	for (const p of props) {
		const a = asArr(p);
		map.set(asStr(a[0]), a[1]);
	}
	return map;
}
function flattenMesh(mesh) {
	const indices = asArr(mesh[4]);
	const uvsPerIndex = asArr(mesh[5]);
	const verts = asArr(mesh[6]);
	const faceNormals = asArr(mesh[3]);
	if (!indices.length || !verts.length) return null;
	const positions = new Float32Array(indices.length * 3);
	const normals = new Float32Array(indices.length * 3);
	const uvs = new Float32Array(indices.length * 2);
	for (let i = 0; i < indices.length; i++) {
		const vert = asArr(verts[indices[i] ?? 0]);
		positions[i * 3] = Number(vert[0]) || 0;
		positions[i * 3 + 1] = Number(vert[1]) || 0;
		positions[i * 3 + 2] = Number(vert[2]) || 0;
		const n = asArr(faceNormals[Math.floor(i / 3)]);
		normals[i * 3] = Number(n[0]) || 0;
		normals[i * 3 + 1] = Number(n[1]) || 0;
		normals[i * 3 + 2] = Number(n[2]) || 1;
		const uv = asArr(uvsPerIndex[i]);
		uvs[i * 2] = Number(uv[0]) || 0;
		uvs[i * 2 + 1] = Number(uv[1]) || 0;
	}
	return {
		positions,
		normals,
		uvs
	};
}
function textureBasename(raw) {
	if (typeof raw !== "string" || !raw) return null;
	const trimmed = raw.trim();
	if (!trimmed || trimmed === "null") return null;
	const parts = trimmed.replace(/\\/g, "/").split("/");
	return parts[parts.length - 1] || null;
}
function buildPreviewNodes(project) {
	const matById = /* @__PURE__ */ new Map();
	project.materials.forEach((mat, i) => {
		const id = typeof mat[0] === "number" ? mat[0] : i + 1;
		const props = asArr(mat[2]);
		const by = /* @__PURE__ */ new Map();
		for (const p of props) {
			const a = asArr(p);
			by.set(asStr(a[0]), a[1]);
		}
		matById.set(id, {
			color: parseColor(by.get("color")),
			texture: textureBasename(by.get("texture")),
			pixelBlend: asStr(by.get("pixelBlending")) !== "False"
		});
	});
	const meshById = /* @__PURE__ */ new Map();
	project.meshes.forEach((m, idx) => {
		const id = typeof m[0] === "number" ? m[0] : idx;
		meshById.set(id, m);
	});
	return project.objects.map((obj, i) => {
		const id = typeof obj[0] === "number" ? obj[0] : i;
		const parent = typeof obj[3] === "number" ? obj[3] : -1;
		const comps = asArr(obj[2]);
		let position = [
			0,
			0,
			0
		];
		let rotationDeg = [
			0,
			0,
			0
		];
		let scale = [
			1,
			1,
			1
		];
		let meshId = null;
		let matIds = [];
		for (const c of comps) {
			const name = asStr(asArr(c)[0]);
			const props = propMap(c);
			if (name === "PTransform") {
				position = parseVec3(props.get("localPosition"));
				rotationDeg = parseVec3(props.get("localEulerAnglesHint"));
				scale = parseVec3(props.get("localScale"), [
					1,
					1,
					1
				]);
			}
			if (name === "PMeshRenderer") {
				meshId = parseIdJson(props.get("pMesh"));
				matIds = parseIdsJson(props.get("materials"));
			}
		}
		let geom = null;
		if (meshId != null) {
			const mesh = meshById.get(meshId);
			const flat = mesh ? flattenMesh(mesh) : null;
			if (flat) {
				const mat = matById.get(matIds[0] ?? -1);
				geom = {
					...flat,
					color: mat?.color ?? [
						1,
						1,
						1,
						1
					],
					textureName: mat?.texture ?? null,
					pixelBlend: mat?.pixelBlend ?? true
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
			geom
		};
	});
}
var DEG = Math.PI / 180;
var ScenePreview = (0, import_react.forwardRef)(function ScenePreview({ project, hint }, ref) {
	const hostRef = (0, import_react.useRef)(null);
	const captureRef = (0, import_react.useRef)(null);
	(0, import_react.useImperativeHandle)(ref, () => ({ capturePng: () => captureRef.current?.() ?? Promise.resolve(null) }));
	(0, import_react.useEffect)(() => {
		const host = hostRef.current;
		if (!host) return;
		let disposed = false;
		let stop = () => {};
		(async () => {
			const THREE = await import("../_libs/three.mjs").then((n) => n.n);
			const { OrbitControls } = await import("../_libs/three.mjs").then((n) => n.t);
			if (disposed || !hostRef.current) return;
			const scene = new THREE.Scene();
			scene.background = new THREE.Color(1184536);
			scene.fog = new THREE.Fog(1184536, 80, 420);
			const renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: false,
				preserveDrawingBuffer: true
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.shadowMap.enabled = false;
			host.appendChild(renderer.domElement);
			const camera = new THREE.PerspectiveCamera(45, 1, .1, 5e3);
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = .08;
			scene.add(new THREE.HemisphereLight(15264496, 2763828, 1.15));
			const key = new THREE.DirectionalLight(16777215, 1.35);
			key.position.set(18, 28, 12);
			scene.add(key);
			const fill = new THREE.DirectionalLight(12963288, .35);
			fill.position.set(-12, 8, -16);
			scene.add(fill);
			const texCache = /* @__PURE__ */ new Map();
			const loader = new THREE.TextureLoader();
			async function loadTexture(file, pixelBlend) {
				const hit = texCache.get(file.name);
				if (hit) return hit;
				const blob = new Blob([file.data], { type: "image/png" });
				const url = URL.createObjectURL(blob);
				const texture = await new Promise((resolve, reject) => {
					loader.load(url, resolve, void 0, reject);
				});
				URL.revokeObjectURL(url);
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				if (!pixelBlend) {
					texture.magFilter = THREE.NearestFilter;
					texture.minFilter = THREE.NearestFilter;
					texture.generateMipmaps = false;
				}
				texCache.set(file.name, texture);
				return texture;
			}
			const nodes = buildPreviewNodes(project);
			const groups = /* @__PURE__ */ new Map();
			const box = new THREE.Box3();
			let hasMesh = false;
			for (const node of nodes) {
				const g = new THREE.Group();
				g.name = node.name;
				g.position.set(node.position[0], node.position[1], node.position[2]);
				g.rotation.order = "ZXY";
				g.rotation.set(node.rotationDeg[0] * DEG, node.rotationDeg[1] * DEG, node.rotationDeg[2] * DEG);
				g.scale.set(node.scale[0], node.scale[1], node.scale[2]);
				g.visible = node.active;
				groups.set(node.id, g);
				if (node.geom) {
					const geo = new THREE.BufferGeometry();
					geo.setAttribute("position", new THREE.BufferAttribute(node.geom.positions, 3));
					geo.setAttribute("normal", new THREE.BufferAttribute(node.geom.normals, 3));
					geo.setAttribute("uv", new THREE.BufferAttribute(node.geom.uvs, 2));
					const mat = new THREE.MeshStandardMaterial({
						color: new THREE.Color(node.geom.color[0], node.geom.color[1], node.geom.color[2]),
						roughness: .72,
						metalness: .05,
						transparent: node.geom.color[3] < .999,
						opacity: node.geom.color[3],
						side: THREE.DoubleSide
					});
					if (node.geom.textureName) {
						const file = project.textures.find((t) => t.name === node.geom.textureName);
						if (file) try {
							mat.map = await loadTexture(file, node.geom.pixelBlend);
							mat.needsUpdate = true;
						} catch {}
					}
					const mesh = new THREE.Mesh(geo, mat);
					g.add(mesh);
					geo.computeBoundingBox();
					hasMesh = true;
				}
			}
			for (const node of nodes) {
				const g = groups.get(node.id);
				if (!g) continue;
				const parent = groups.get(node.parent);
				if (parent) parent.add(g);
				else scene.add(g);
			}
			scene.updateMatrixWorld(true);
			box.makeEmpty();
			scene.traverse((obj) => {
				const mesh = obj;
				if (mesh.isMesh) {
					const b = new THREE.Box3().setFromObject(mesh);
					box.union(b);
				}
			});
			const size = new THREE.Vector3();
			const center = new THREE.Vector3();
			if (hasMesh && !box.isEmpty()) {
				box.getSize(size);
				box.getCenter(center);
			} else {
				size.set(4, 4, 4);
				center.set(0, 1, 0);
			}
			const radius = Math.max(size.length() * .55, 2);
			controls.target.copy(center);
			camera.position.copy(center).add(new THREE.Vector3(radius, radius * .7, radius * 1.15));
			camera.near = Math.max(radius / 200, .05);
			camera.far = radius * 40;
			camera.updateProjectionMatrix();
			controls.update();
			function resize() {
				const el = hostRef.current;
				if (!el) return;
				const w = el.clientWidth || 1;
				const h = el.clientHeight || 1;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h, false);
			}
			resize();
			const ro = new ResizeObserver(resize);
			ro.observe(host);
			let raf = 0;
			const loop = () => {
				controls.update();
				renderer.render(scene, camera);
				raf = requestAnimationFrame(loop);
			};
			loop();
			captureRef.current = async () => {
				renderer.render(scene, camera);
				const url = renderer.domElement.toDataURL("image/png");
				const res = await fetch(url);
				return new Uint8Array(await res.arrayBuffer());
			};
			stop = () => {
				cancelAnimationFrame(raf);
				ro.disconnect();
				controls.dispose();
				renderer.dispose();
				scene.traverse((obj) => {
					const mesh = obj;
					if (mesh.geometry) mesh.geometry.dispose();
					const m = mesh.material;
					if (Array.isArray(m)) m.forEach((x) => x.dispose());
					else if (m) m.dispose();
				});
				texCache.forEach((t) => t.dispose());
				renderer.domElement.remove();
			};
		})().catch((err) => {
			console.error(err);
		});
		return () => {
			disposed = true;
			captureRef.current = null;
			stop();
		};
	}, [project]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-full min-h-[240px] w-full overflow-hidden rounded-md bg-elevated",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: hostRef,
			className: "absolute inset-0"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pointer-events-none absolute bottom-3 left-3 right-3 text-xs tracking-wide text-subtle",
			children: hint
		})]
	});
});
var copy = {
	ru: {
		brand: "Prismback",
		tag: "3.3.5 → 2.1",
		headline: "Верни проект Prisma 3D в Legacy 2.1",
		sub: "Файлы .prisma из версии 3.3.5 нельзя открыть в 2.1. Этот конвертер пересобирает сцену, меши и текстуры в старый формат — прямо в браузере, ничего не уходит на сервер.",
		dropTitle: "Перетащите файл .prisma",
		dropHint: "или нажмите, чтобы выбрать Backup из Prisma 3D 3.3.5",
		demo: "Попробовать на примере",
		converting: "Читаю проект…",
		download: "Скачать для Prisma 3D 2.1",
		again: "Другой файл",
		objects: "Объекты",
		meshes: "Меши",
		materials: "Материалы",
		textures: "Текстуры",
		triangles: "Треугольники",
		source: "Исходник",
		preview: "Превью сцены",
		howTitle: "Как пользоваться",
		how: [
			"В Prisma 3D 3.3.5: три точки на проекте → Backup и сохраните .prisma.",
			"Загрузите файл сюда. Геометрия, иерархия и текстуры переедут в формат 2.1.",
			"В Prisma 3D 2.1 / Legacy: Import и выберите скачанный .prisma."
		],
		noteTitle: "Что переносится",
		noteBody: "Объекты, трансформации, меши, материалы и PNG-текстуры. Анимации, риггинг и новые компоненты 3.x могут приехать не полностью — формат 2.1 их просто не знает. Проверьте сцену в приложении после импорта.",
		already21: "Этот файл уже в формате 2.1. Можно переупаковать и скачать.",
		lang: "EN",
		orbit: "ЛКМ — вращение, колесо — масштаб, ПКМ — сдвиг",
		error: "Не получилось прочитать файл",
		ready: "Готово к экспорту"
	},
	en: {
		brand: "Prismback",
		tag: "3.3.5 → 2.1",
		headline: "Take a Prisma 3D project back to Legacy 2.1",
		sub: "3.3.5 .prisma files will not open in 2.1. This converter rebuilds the scene, meshes and textures into the old format — entirely in your browser.",
		dropTitle: "Drop a .prisma file",
		dropHint: "or click to choose a Backup from Prisma 3D 3.3.5",
		demo: "Try the sample project",
		converting: "Reading project…",
		download: "Download for Prisma 3D 2.1",
		again: "Another file",
		objects: "Objects",
		meshes: "Meshes",
		materials: "Materials",
		textures: "Textures",
		triangles: "Triangles",
		source: "Source",
		preview: "Scene preview",
		howTitle: "How to use",
		how: [
			"In Prisma 3D 3.3.5: project ⋮ → Backup and save the .prisma file.",
			"Drop it here. Hierarchy, meshes and textures are rewritten for 2.1.",
			"In Prisma 3D 2.1 / Legacy: Import the downloaded .prisma."
		],
		noteTitle: "What survives",
		noteBody: "Objects, transforms, meshes, materials and PNG textures. Animations, rigs and newer 3.x components may not round-trip — 2.1 simply has no slot for them. Always sanity-check the scene after import.",
		already21: "This file is already 2.1. You can re-pack and download it.",
		lang: "RU",
		orbit: "LMB orbit · wheel zoom · RMB pan",
		error: "Could not read this file",
		ready: "Ready to export"
	}
};
function loadLang() {
	if (typeof window === "undefined") return "ru";
	return window.localStorage.getItem("prismback-lang") === "en" ? "en" : "ru";
}
function ConverterApp() {
	const [lang, setLang] = (0, import_react.useState)(loadLang);
	const t = copy[lang];
	const [drag, setDrag] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(null);
	const inputRef = (0, import_react.useRef)(null);
	const previewRef = (0, import_react.useRef)(null);
	function toggleLang() {
		const next = lang === "ru" ? "en" : "ru";
		setLang(next);
		window.localStorage.setItem("prismback-lang", next);
	}
	async function ingest(file) {
		setBusy(true);
		setError(null);
		try {
			const source = parsePrisma(new Uint8Array(await file.arrayBuffer()), file.name);
			const legacy = toLegacy21(source);
			setReady({
				source,
				legacy,
				fileName: file.name
			});
		} catch (err) {
			setReady(null);
			setError(err instanceof Error ? err.message : t.error);
		} finally {
			setBusy(false);
		}
	}
	async function ingestDemo() {
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/samples/demo-335.prisma");
			if (!res.ok) throw new Error(t.error);
			const source = parsePrisma(new Uint8Array(await res.arrayBuffer()), "Новый проект 1.prisma");
			const legacy = toLegacy21(source);
			setReady({
				source,
				legacy,
				fileName: "Новый проект 1.prisma"
			});
		} catch (err) {
			setReady(null);
			setError(err instanceof Error ? err.message : t.error);
		} finally {
			setBusy(false);
		}
	}
	async function onDownload() {
		if (!ready) return;
		setBusy(true);
		try {
			let shot = null;
			try {
				shot = await previewRef.current?.capturePng() ?? null;
			} catch {
				shot = null;
			}
			downloadBytes(packLegacyZip(ready.legacy, shot), `${ready.legacy.name} 2.1.prisma`);
		} catch (err) {
			setError(err instanceof Error ? err.message : t.error);
		} finally {
			setBusy(false);
		}
	}
	const stats = ready ? statsOf(ready.legacy) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-0 ambient-wash",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-8 sm:pt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-9 place-items-center rounded-sm border border-border bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBox, {
							className: "size-4 text-accent",
							strokeWidth: 1.75
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-sm font-semibold tracking-tight",
						children: t.brand
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs uppercase tracking-caps text-subtle",
						children: t.tag
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: toggleLang,
					className: "font-mono tracking-wide",
					children: t.lang
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "max-w-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl font-semibold leading-tight tracking-display text-balance sm:text-5xl",
							children: t.headline
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted sm:text-base",
							children: t.sub
						})]
					}),
					!ready && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => inputRef.current?.click(),
								onDragEnter: (e) => {
									e.preventDefault();
									setDrag(true);
								},
								onDragOver: (e) => {
									e.preventDefault();
									setDrag(true);
								},
								onDragLeave: () => setDrag(false),
								onDrop: (e) => {
									e.preventDefault();
									setDrag(false);
									const file = e.dataTransfer.files?.[0];
									if (file) ingest(file);
								},
								className: cn("flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-200", drag ? "border-accent bg-elevated" : "border-border bg-surface hover:border-border-strong"),
								children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-8 animate-spin text-muted" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
									className: "size-8 text-muted",
									strokeWidth: 1.5
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-lg font-medium",
									children: busy ? t.converting : t.dropTitle
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: t.dropHint
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								type: "file",
								accept: ".prisma,application/zip",
								className: "sr-only",
								onChange: (e) => {
									const file = e.target.files?.[0];
									if (file) ingest(file);
									e.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									onClick: () => void ingestDemo(),
									disabled: busy,
									children: t.demo
								}), error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-start gap-2 text-sm text-danger",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }), error]
								})]
							})
						]
					}),
					ready && stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-h-[320px] flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:min-h-[420px] sm:p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3 px-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: t.preview
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-subtle",
									children: ready.legacy.name
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-h-0 flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScenePreview, {
									ref: previewRef,
									project: ready.legacy,
									hint: t.orbit
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4 rounded-xl border border-border bg-surface p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase tracking-caps text-subtle",
										children: t.ready
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-1 font-display text-xl font-semibold tracking-tight",
										children: ready.legacy.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-xs text-muted",
										children: ready.source.kind === "2.1" ? t.already21 : `${t.source} Prisma 3.3.5`
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "grid grid-cols-2 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											icon: Box,
											label: t.objects,
											value: stats.objects
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											icon: Layers,
											label: t.meshes,
											value: stats.meshes
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											icon: Image,
											label: t.textures,
											value: stats.textures
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
											icon: Triangle,
											label: t.triangles,
											value: stats.triangles
										})
									]
								}),
								ready.source.kind === "2.1" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "rounded-md bg-elevated px-3 py-2 text-sm text-muted",
									children: t.already21
								}),
								ready.legacy.warnings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1.5 text-sm text-warn",
									children: ready.legacy.warnings.slice(0, 4).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: w })]
									}, w))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-auto flex flex-col gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										onClick: () => void onDownload(),
										disabled: busy,
										className: "w-full",
										children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), t.download]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => {
											setReady(null);
											setError(null);
										},
										children: t.again
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-16 grid gap-10 border-t border-border pt-10 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-semibold",
							children: t.howTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 space-y-3",
							children: t.how.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 text-sm leading-relaxed text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-subtle",
									children: String(i + 1).padStart(2, "0")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-pretty",
									children: step
								})]
							}, step))
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-semibold",
								children: t.noteTitle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-pretty text-sm leading-relaxed text-muted",
								children: t.noteBody
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 flex items-center gap-2 text-xs uppercase tracking-caps text-subtle",
								children: [
									"3.3.5",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" }),
									"2.1 Legacy"
								]
							})
						] })]
					})
				]
			})
		]
	});
}
function Stat({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-elevated px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5 text-subtle",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-3.5",
				strokeWidth: 1.75
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-xs uppercase tracking-caps",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-mono text-lg tabular-nums",
			children: value.toLocaleString()
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConverterApp, {});
}
//#endregion
export { Home as component };
