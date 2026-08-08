/**
 * Minimal glTF 2.0 binary (.glb) writer for synthetic fixture geometry.
 * No three.js: boxes are emitted as 24-vertex (per-face normal) meshes with
 * world-space (baked) vertices and no node transforms.
 */

export interface BoxSpec {
  center: [number, number, number];
  size: [number, number, number];
}

export interface PrimitiveSpec {
  box: BoxSpec;
  /** '#rrggbb' sRGB hex. */
  colorHex: string;
}

export interface NodeSpec {
  name: string;
  primitives: PrimitiveSpec[];
}

export interface GlbSceneSpec {
  rootNodeName: string;
  nodes: NodeSpec[];
  generator: string;
}

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const COMPONENT_FLOAT = 5126;
const COMPONENT_USHORT = 5123;
const TARGET_ARRAY_BUFFER = 34962;
const TARGET_ELEMENT_ARRAY_BUFFER = 34963;

interface GltfBufferView {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  target: number;
}

interface GltfAccessor {
  bufferView: number;
  componentType: number;
  count: number;
  type: 'VEC3' | 'SCALAR';
  min?: number[];
  max?: number[];
}

interface GltfMaterial {
  name: string;
  pbrMetallicRoughness: {
    baseColorFactor: [number, number, number, number];
    metallicFactor: number;
    roughnessFactor: number;
  };
}

interface GltfPrimitive {
  attributes: { POSITION: number; NORMAL: number };
  indices: number;
  material: number;
  mode: number;
}

interface GltfMesh {
  name: string;
  primitives: GltfPrimitive[];
}

interface GltfNode {
  name: string;
  mesh?: number;
  children?: number[];
}

/** Faces wound counter-clockwise seen from outside; corner entries are (x,y,z) half-size signs. */
const FACES: { normal: [number, number, number]; corners: [number, number, number][] }[] = [
  {
    normal: [0, 0, 1],
    corners: [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [1, -1, -1],
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
    ],
  },
  {
    normal: [1, 0, 0],
    corners: [
      [1, -1, 1],
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
    ],
  },
];

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

function srgbHexToLinearBaseColor(colorHex: string): [number, number, number, number] {
  const match = HEX_COLOR_PATTERN.exec(colorHex);
  if (!match || match[1] === undefined) {
    throw new Error(`invalid colorHex "${colorHex}": expected '#rrggbb'`);
  }
  const hex = match[1];
  const channel = (offset: number): number => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return Number(Math.pow(value, 2.2).toFixed(6));
  };
  return [channel(0), channel(2), channel(4), 1];
}

interface BoxGeometry {
  positions: Uint8Array;
  normals: Uint8Array;
  indices: Uint8Array;
  min: [number, number, number];
  max: [number, number, number];
}

function buildBoxGeometry(box: BoxSpec): BoxGeometry {
  const [cx, cy, cz] = box.center;
  const [hx, hy, hz] = [box.size[0] / 2, box.size[1] / 2, box.size[2] / 2];

  const positions = new Uint8Array(24 * 3 * 4);
  const normals = new Uint8Array(24 * 3 * 4);
  const posView = new DataView(positions.buffer);
  const normView = new DataView(normals.buffer);
  let vertex = 0;
  for (const face of FACES) {
    for (const corner of face.corners) {
      const base = vertex * 12;
      posView.setFloat32(base, cx + corner[0] * hx, true);
      posView.setFloat32(base + 4, cy + corner[1] * hy, true);
      posView.setFloat32(base + 8, cz + corner[2] * hz, true);
      normView.setFloat32(base, face.normal[0], true);
      normView.setFloat32(base + 4, face.normal[1], true);
      normView.setFloat32(base + 8, face.normal[2], true);
      vertex += 1;
    }
  }

  const indices = new Uint8Array(36 * 2);
  const idxView = new DataView(indices.buffer);
  let written = 0;
  for (let face = 0; face < 6; face += 1) {
    const base = face * 4;
    for (const offset of [0, 1, 2, 0, 2, 3]) {
      idxView.setUint16(written * 2, base + offset, true);
      written += 1;
    }
  }

  // min/max must describe the float32 data actually stored in the buffer.
  const f = Math.fround;
  return {
    positions,
    normals,
    indices,
    min: [f(cx - hx), f(cy - hy), f(cz - hz)],
    max: [f(cx + hx), f(cy + hy), f(cz + hz)],
  };
}

function padTo4(bytes: Uint8Array, padByte: number): Uint8Array {
  const remainder = bytes.byteLength % 4;
  if (remainder === 0) return bytes;
  const padded = new Uint8Array(bytes.byteLength + (4 - remainder));
  padded.fill(padByte);
  padded.set(bytes);
  return padded;
}

export function buildGlbBytes(spec: GlbSceneSpec): Uint8Array {
  const binParts: Uint8Array[] = [];
  let binLength = 0;
  const bufferViews: GltfBufferView[] = [];
  const accessors: GltfAccessor[] = [];
  const materials: GltfMaterial[] = [];
  const meshes: GltfMesh[] = [];

  const appendView = (bytes: Uint8Array, target: number): number => {
    const misalignment = binLength % 4;
    if (misalignment !== 0) {
      const pad = new Uint8Array(4 - misalignment);
      binParts.push(pad);
      binLength += pad.byteLength;
    }
    const viewIndex = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: binLength, byteLength: bytes.byteLength, target });
    binParts.push(bytes);
    binLength += bytes.byteLength;
    return viewIndex;
  };

  for (const node of spec.nodes) {
    const primitives: GltfPrimitive[] = [];
    for (let i = 0; i < node.primitives.length; i += 1) {
      const primitiveSpec = node.primitives[i];
      if (primitiveSpec === undefined) continue;
      const geometry = buildBoxGeometry(primitiveSpec.box);

      const positionView = appendView(geometry.positions, TARGET_ARRAY_BUFFER);
      const normalView = appendView(geometry.normals, TARGET_ARRAY_BUFFER);
      const indexView = appendView(geometry.indices, TARGET_ELEMENT_ARRAY_BUFFER);

      const positionAccessor = accessors.length;
      accessors.push({
        bufferView: positionView,
        componentType: COMPONENT_FLOAT,
        count: 24,
        type: 'VEC3',
        min: geometry.min,
        max: geometry.max,
      });
      const normalAccessor = accessors.length;
      accessors.push({
        bufferView: normalView,
        componentType: COMPONENT_FLOAT,
        count: 24,
        type: 'VEC3',
      });
      const indexAccessor = accessors.length;
      accessors.push({
        bufferView: indexView,
        componentType: COMPONENT_USHORT,
        count: 36,
        type: 'SCALAR',
      });

      const materialIndex = materials.length;
      materials.push({
        name: `${node.name}-mat-${i}`,
        pbrMetallicRoughness: {
          baseColorFactor: srgbHexToLinearBaseColor(primitiveSpec.colorHex),
          metallicFactor: 0,
          roughnessFactor: 0.85,
        },
      });

      primitives.push({
        attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
        indices: indexAccessor,
        material: materialIndex,
        mode: 4,
      });
    }
    meshes.push({ name: node.name, primitives });
  }

  const rootNode: GltfNode = { name: spec.rootNodeName };
  if (spec.nodes.length > 0) {
    rootNode.children = spec.nodes.map((_, i) => i + 1);
  }
  const nodes: GltfNode[] = [
    rootNode,
    ...spec.nodes.map((node, i) => ({ name: node.name, mesh: i })),
  ];

  const binChunk = padTo4(concat(binParts, binLength), 0x00);

  const json = {
    asset: { version: '2.0', generator: spec.generator },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binChunk.byteLength }],
  };
  const jsonChunk = padTo4(new TextEncoder().encode(JSON.stringify(json)), 0x20);

  const totalLength = 12 + 8 + jsonChunk.byteLength + 8 + binChunk.byteLength;
  const glb = new Uint8Array(totalLength);
  const view = new DataView(glb.buffer);
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonChunk.byteLength, true);
  view.setUint32(16, CHUNK_JSON, true);
  glb.set(jsonChunk, 20);
  const binHeaderOffset = 20 + jsonChunk.byteLength;
  view.setUint32(binHeaderOffset, binChunk.byteLength, true);
  view.setUint32(binHeaderOffset + 4, CHUNK_BIN, true);
  glb.set(binChunk, binHeaderOffset + 8);
  return glb;
}

function concat(parts: Uint8Array[], totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}
