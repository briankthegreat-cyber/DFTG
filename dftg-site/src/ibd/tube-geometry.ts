// Variable-radius tube along a curve with the extra per-vertex attributes the
// tissue shader needs: path parameter (aU), angle around the tube (aAngle),
// local radius (aRadius) and the path tangent (aTangent).

import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
import type { Curve } from 'three';

export interface TubeOptions {
  tubular: number;
  radial: number;
  radiusAt: (u: number) => number;
}

export function buildTubeGeometry(curve: Curve<Vector3>, { tubular, radial, radiusAt }: TubeOptions): BufferGeometry {
  const frames = curve.computeFrenetFrames(tubular, false);
  // Rings share their first/last vertex (welded seam) so smoothed normals have no crease.
  const vertexCount = (tubular + 1) * radial;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const aU = new Float32Array(vertexCount);
  const aAngle = new Float32Array(vertexCount);
  const aRadius = new Float32Array(vertexCount);
  const aTangent = new Float32Array(vertexCount * 3);

  const point = new Vector3();
  const normal = new Vector3();
  const binormal = new Vector3();
  let v = 0;
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    curve.getPointAt(u, point);
    normal.copy(frames.normals[i]);
    binormal.copy(frames.binormals[i]);
    const tangent = frames.tangents[i];
    const r = radiusAt(u);
    for (let j = 0; j < radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      const cx = Math.cos(angle);
      const sy = Math.sin(angle);
      positions[v * 3 + 0] = point.x + r * (cx * normal.x + sy * binormal.x);
      positions[v * 3 + 1] = point.y + r * (cx * normal.y + sy * binormal.y);
      positions[v * 3 + 2] = point.z + r * (cx * normal.z + sy * binormal.z);
      uvs[v * 2 + 0] = u;
      uvs[v * 2 + 1] = j / radial;
      aU[v] = u;
      aAngle[v] = angle;
      aRadius[v] = r;
      aTangent[v * 3 + 0] = tangent.x;
      aTangent[v * 3 + 1] = tangent.y;
      aTangent[v * 3 + 2] = tangent.z;
      v++;
    }
  }

  const indices = new Uint32Array(tubular * radial * 6);
  let k = 0;
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const jn = (j + 1) % radial;
      const a = i * radial + j;
      const a1 = i * radial + jn;
      const b = (i + 1) * radial + j;
      const b1 = (i + 1) * radial + jn;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = a1;
      indices[k++] = b;
      indices[k++] = b1;
      indices[k++] = a1;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setAttribute('aU', new BufferAttribute(aU, 1));
  geometry.setAttribute('aAngle', new BufferAttribute(aAngle, 1));
  geometry.setAttribute('aRadius', new BufferAttribute(aRadius, 1));
  geometry.setAttribute('aTangent', new BufferAttribute(aTangent, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
