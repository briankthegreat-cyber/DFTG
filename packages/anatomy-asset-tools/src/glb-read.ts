/** GLB container reader: extracts and lightly types the JSON chunk for validation. */

export interface GlbNodeJson {
  name?: string;
  mesh?: number;
  children?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
  matrix?: number[];
}

export interface GlbPrimitiveJson {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
  mode?: number;
}

export interface GlbMeshJson {
  name?: string;
  primitives: GlbPrimitiveJson[];
}

export interface GlbMaterialJson {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: number[];
    metallicFactor?: number;
    roughnessFactor?: number;
  };
}

export interface GlbAccessorJson {
  bufferView?: number;
  componentType?: number;
  count?: number;
  type?: string;
  min?: number[];
  max?: number[];
}

export interface GlbSceneJson {
  name?: string;
  nodes?: number[];
}

export interface GlbJson {
  asset?: { version?: string; generator?: string };
  nodes: GlbNodeJson[];
  meshes: GlbMeshJson[];
  materials?: GlbMaterialJson[];
  accessors?: GlbAccessorJson[];
  scenes: GlbSceneJson[];
  scene: number;
}

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;

export function parseGlbJson(bytes: Uint8Array): { json: GlbJson } {
  if (bytes.byteLength < 12) {
    throw new Error(`GLB too short: ${bytes.byteLength} bytes, need at least a 12-byte header`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = view.getUint32(0, true);
  if (magic !== GLB_MAGIC) {
    throw new Error(
      `not a GLB file: magic 0x${magic.toString(16).padStart(8, '0')}, expected 0x46546c67`,
    );
  }
  const version = view.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`unsupported GLB version ${version}, expected 2`);
  }
  const declaredLength = view.getUint32(8, true);
  if (declaredLength > bytes.byteLength) {
    throw new Error(
      `GLB header declares ${declaredLength} bytes but only ${bytes.byteLength} are present`,
    );
  }
  if (declaredLength < 20) {
    throw new Error(`GLB declared length ${declaredLength} cannot hold a JSON chunk`);
  }

  const jsonChunkLength = view.getUint32(12, true);
  const jsonChunkType = view.getUint32(16, true);
  if (jsonChunkType !== CHUNK_JSON) {
    throw new Error(
      `first GLB chunk must be JSON (0x4e4f534a), got 0x${jsonChunkType.toString(16).padStart(8, '0')}`,
    );
  }
  if (20 + jsonChunkLength > bytes.byteLength) {
    throw new Error(
      `JSON chunk declares ${jsonChunkLength} bytes but the file holds only ${bytes.byteLength - 20} after its header`,
    );
  }

  const jsonText = new TextDecoder('utf-8').decode(bytes.subarray(20, 20 + jsonChunkLength));
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `GLB JSON chunk is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GLB JSON chunk did not contain a glTF object');
  }

  const raw = parsed as Partial<GlbJson>;
  return {
    json: {
      ...raw,
      nodes: raw.nodes ?? [],
      meshes: raw.meshes ?? [],
      scenes: raw.scenes ?? [],
      scene: raw.scene ?? 0,
    },
  };
}
