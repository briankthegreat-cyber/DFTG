import { describe, expect, it } from 'vitest';
import { buildGlbBytes } from './glb';
import type { GlbSceneSpec } from './glb';
import { parseGlbJson } from './glb-read';

function must<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) {
    throw new Error(`expected ${label} to be present`);
  }
  return value;
}

const spec = {
  rootNodeName: 'TEST-ROOT',
  generator: 'glb.test',
  nodes: [
    {
      name: 'NODE-A',
      primitives: [{ box: { center: [0, 1, 0], size: [2, 4, 6] }, colorHex: '#ff8000' }],
    },
    {
      name: 'NODE-B',
      primitives: [
        { box: { center: [1, 2, 3], size: [1, 1, 1] }, colorHex: '#112233' },
        { box: { center: [-1, 0, 0], size: [2, 2, 2] }, colorHex: '#445566' },
      ],
    },
  ],
} satisfies GlbSceneSpec;

describe('buildGlbBytes -> parseGlbJson round trip', () => {
  const { json } = parseGlbJson(buildGlbBytes(spec));

  it('declares glTF 2.0 with the requested generator', () => {
    expect(json.asset?.version).toBe('2.0');
    expect(json.asset?.generator).toBe('glb.test');
    expect(json.scene).toBe(0);
    expect(must(json.scenes[0], 'scene 0').nodes).toEqual([0]);
  });

  it('emits root + child nodes in order with sequential mesh indices', () => {
    expect(json.nodes).toHaveLength(3);
    const root = must(json.nodes[0], 'root node');
    expect(root.name).toBe('TEST-ROOT');
    expect(root.mesh).toBeUndefined();
    expect(root.children).toEqual([1, 2]);

    const nodeA = must(json.nodes[1], 'node 1');
    expect(nodeA.name).toBe('NODE-A');
    expect(nodeA.mesh).toBe(0);
    const nodeB = must(json.nodes[2], 'node 2');
    expect(nodeB.name).toBe('NODE-B');
    expect(nodeB.mesh).toBe(1);
    expect(must(json.meshes[0], 'mesh 0').name).toBe('NODE-A');
    expect(must(json.meshes[1], 'mesh 1').name).toBe('NODE-B');
  });

  it('gives each primitive of a two-primitive node its own material', () => {
    const meshB = must(json.meshes[1], 'mesh 1');
    expect(meshB.primitives).toHaveLength(2);
    const material0 = must(meshB.primitives[0], 'primitive 0').material;
    const material1 = must(meshB.primitives[1], 'primitive 1').material;
    expect(material0).not.toBe(material1);

    const materials = json.materials ?? [];
    expect(materials).toHaveLength(3);
    const names = materials.map((m) => m.name);
    expect(names).toContain('NODE-B-mat-0');
    expect(names).toContain('NODE-B-mat-1');
  });

  it('bakes vertices: no node carries TRS or matrix', () => {
    for (const node of json.nodes) {
      expect(node.translation).toBeUndefined();
      expect(node.rotation).toBeUndefined();
      expect(node.scale).toBeUndefined();
      expect(node.matrix).toBeUndefined();
    }
  });

  it('writes POSITION accessor min/max matching the box bounds', () => {
    const primitive = must(must(json.meshes[0], 'mesh 0').primitives[0], 'primitive');
    const positionAccessorIndex = must(primitive.attributes['POSITION'], 'POSITION attribute');
    const accessor = must((json.accessors ?? [])[positionAccessorIndex], 'POSITION accessor');
    expect(accessor.count).toBe(24);
    expect(accessor.type).toBe('VEC3');
    expect(accessor.min).toEqual([-1, -1, -3]);
    expect(accessor.max).toEqual([1, 3, 3]);
  });
});
