import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parsePrisma, toLegacy21, packLegacyZip, statsOf } from "./convert.ts";
import { unzipPrisma } from "./zip.ts";
import { decode } from "@msgpack/msgpack";

const SAMPLE = "/workspace/public/samples/demo-335.prisma";

describe("prisma 3.3.5 → 2.1", () => {
  it("parses the sample and remaps ids", () => {
    const buf = new Uint8Array(readFileSync(SAMPLE));
    const source = parsePrisma(buf, "Новый проект 1.prisma");
    assert.equal(source.kind, "3.3");
    assert.equal(source.name, "Новый проект 1");
    assert.equal(source.objects.length, 64);
    assert.equal(source.meshes.length, 50);
    assert.equal(source.materials.length, 50);
    assert.equal(source.textures.length, 50);

    const legacy = toLegacy21(source);
    assert.equal(legacy.kind, "2.1");
    assert.equal(legacy.objects[0]?.[0], 0);
    assert.equal(legacy.objects[1]?.[3], 0);
    assert.equal(legacy.meshes[0]?.[0], 0);
    assert.equal(legacy.materials[0]?.[0], 1);
    assert.equal(legacy.meshes[0]?.length, 9);
    assert.equal(legacy.objects[0]?.length, 6);

    const renderer = (legacy.objects[9]?.[2] as unknown[][])?.find((c) => c[0] === "PMeshRenderer");
    const props = (renderer?.[1] as unknown[][]) ?? [];
    const pMesh = props.find((p) => p[0] === "pMesh")?.[1];
    const mats = props.find((p) => p[0] === "materials")?.[1];
    assert.equal(pMesh, '{"id":0}');
    assert.equal(mats, '{"ids":[1]}');

    const zip = packLegacyZip(legacy);
    const entries = unzipPrisma(zip);
    const names = Object.keys(entries);
    assert.ok(names.some((n) => n.endsWith(".proj")));
    assert.ok(names.some((n) => n.includes("/res/")));
    const proj = entries[names.find((n) => n.endsWith(".proj"))!];
    assert.ok(proj);
    assert.deepEqual([...proj.subarray(0, 4)], [0x26, 0x20, 0x00, 0x00]);
    const root = decode(proj.subarray(4)) as unknown[];
    assert.equal((root[1] as unknown[]).length, 64);
    assert.equal((root[3] as unknown[]).length, 50);
    const s = statsOf(legacy);
    assert.ok(s.triangles > 0);
  });
});
