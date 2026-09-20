/** Copy into a standalone ArrayBuffer-backed Uint8Array (TS 5.7 + DOM Blob typing). */
export function copyBytes(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.byteLength);
  out.set(data);
  return out;
}

export function asBlobPart(data: Uint8Array): BlobPart {
  return copyBytes(data);
}
