// GLSL chunks injected into MeshPhysicalMaterial through onBeforeCompile.
// The mask functions mirror src/conditions.js exactly.

export const MAX_LESIONS: number = 8;

export const NOISE_GLSL = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(mix(hash13(i + vec3(0, 0, 0)), hash13(i + vec3(1, 0, 0)), f.x),
          mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
          mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 4.1);
      a *= 0.5;
    }
    return v;
  }
`;

export const MASK_GLSL = /* glsl */ `
  uniform vec4 uLesions[${MAX_LESIONS}];
  uniform int uLesionCount;
  uniform float uCrohns;
  uniform float uUc;
  uniform float uUcExtent;
  uniform float uIsColon;

  float lesionMask(float u, float progress) {
    float mask = 0.0;
    for (int i = 0; i < ${MAX_LESIONS}; i++) {
      if (i >= uLesionCount) break;
      vec4 L = uLesions[i];
      float act = smoothstep(L.w, L.w + 0.35, progress);
      if (act <= 0.0) continue;
      float reach = L.y * act;
      float d = abs(u - L.x);
      float falloff = 1.0 - smoothstep(reach * 0.45, reach, d);
      mask = max(mask, falloff * L.z * act);
    }
    return clamp(mask, 0.0, 1.0);
  }

  float ucMask(float u, float extent) {
    if (extent <= 0.0) return 0.0;
    float front = 1.0 - clamp(extent, 0.0, 1.0);
    return smoothstep(front - 0.03, front + 0.03, u);
  }

  float crohnsAt(float u) { return lesionMask(u, uCrohns); }
  float ucAt(float u) { return uIsColon * ucMask(u, uUcExtent) * uUc; }
`;

export const VERTEX_PARS = /* glsl */ `
  attribute float aU;
  attribute float aAngle;
  attribute float aRadius;
  attribute vec3 aTangent;
  uniform float uTime;
  uniform float uPeristalsis;
  uniform float uHaustra;
  uniform float uLength;
  uniform float uWaveCount;
  uniform float uWaveSpeed;
  varying float vU;
  varying float vAngle;
  varying vec3 vWpos;
  varying float vCrohns;
  varying float vUcMask;
  ${NOISE_GLSL}
  ${MASK_GLSL}
`;

// Runs right after <beginnormal_vertex>: computes displacement + tilts the normal.
export const VERTEX_NORMAL = /* glsl */ `
  float mC_v = crohnsAt(aU);
  float mU_v = ucAt(aU);
  vCrohns = mC_v;
  vUcMask = mU_v;

  // Haustra: the pouches of the colon. Long-standing UC smooths them away.
  // Three rows of pouches offset around the tube (between the taeniae), flattened by UC.
  float hPhase = aU * uHaustra * 6.2831853 + 1.6 * sin(aAngle * 1.5 + 0.7);
  float hAmp = 0.2 * step(0.5, uHaustra) * (1.0 - 0.85 * mU_v);
  float hs = 0.5 + 0.5 * sin(hPhase);
  float haustra = hAmp * (hs * hs);
  float dHaustra = hAmp * 2.0 * hs * 0.5 * cos(hPhase) * uHaustra * 6.2831853;

  // Peristalsis: travelling rings of gentle constriction.
  float wx = fract(aU * uWaveCount - uTime * uWaveSpeed) - 0.5;
  float wEnv = exp(-wx * wx * 55.0);
  float wave = uPeristalsis * 0.075 * wEnv;
  float dWave = uPeristalsis * 0.075 * wEnv * (-110.0 * wx) * uWaveCount;

  // Inflammation: full-thickness swelling in Crohn's, mild edema in UC.
  float swell = 0.34 * mC_v + 0.06 * mU_v;
  float irregular = mC_v * 0.1 * (vnoise(position * 5.0) - 0.5);

  float disp = (haustra - wave + swell + irregular) * aRadius;
  float dDispDs = (dHaustra - dWave) * aRadius / max(uLength, 0.001);
  objectNormal = normalize(objectNormal - aTangent * dDispDs);
`;

// Runs right after <begin_vertex>: applies the displacement.
export const VERTEX_DISPLACE = /* glsl */ `
  transformed += normal * disp;
  vU = aU;
  vAngle = aAngle;
  vWpos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

export const FRAGMENT_PARS = /* glsl */ `
  uniform float uTime;
  uniform float uFlare;
  uniform vec3 uHealthyColor;
  uniform vec3 uHealthyDeep;
  uniform vec3 uInflamedColor;
  uniform vec3 uDuskyColor;
  uniform vec3 uUlcerColor;
  uniform vec3 uFatColor;
  uniform vec3 uRimHealthy;
  uniform vec3 uRimInflamed;
  varying float vU;
  varying float vAngle;
  varying vec3 vWpos;
  varying float vCrohns;
  varying float vUcMask;
  ${NOISE_GLSL}
  ${MASK_GLSL}

  vec3 perturbNormalArbitrary(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
    vec3 sigmaX = dFdx(surfPos);
    vec3 sigmaY = dFdy(surfPos);
    vec3 r1 = cross(sigmaY, surfNorm);
    vec3 r2 = cross(surfNorm, sigmaX);
    float det = dot(sigmaX, r1) * faceDir;
    vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
    return normalize(abs(det) * surfNorm - grad);
  }

  float surfaceHeight(vec3 p, float mC, float mU) {
    // Fine vascular texture everywhere, coarse irregular thickening in Crohn's,
    // and pitted ulcers within the ulcerative colitis extent.
    float fine = fbm(p * 6.0) * 0.3;
    float coarse = fbm(p * 3.0 + 7.0) * mC * 1.4;
    float pits = smoothstep(0.6, 0.72, fbm(p * 7.0 + 3.0)) * mU * 2.0;
    return fine + coarse - pits;
  }
`;

// Replaces <color_fragment>.
export const FRAGMENT_COLOR = /* glsl */ `
  #include <color_fragment>
  float mC = crohnsAt(vU);
  float mU = ucAt(vU);
  float m = max(mC, mU);

  float mottle = fbm(vWpos * 2.6);
  vec3 col = mix(uHealthyColor, uHealthyDeep, 0.75 * smoothstep(0.4, 0.78, mottle));

  // Fine vessel network, stronger when inflamed.
  float vessels = pow(1.0 - abs(vnoise(vWpos * 7.0 + 11.0) * 2.0 - 1.0), 9.0);
  col = mix(col, col * 0.72, vessels * (0.35 + 0.65 * m));

  vec3 crohnsCol = mix(uInflamedColor, uDuskyColor, 0.55 * mC);
  col = mix(col, crohnsCol, mC);
  col = mix(col, uInflamedColor, mU);

  // Ulcers: shallow, rounded pits in the lining within the UC extent.
  float ulcer = smoothstep(0.6, 0.72, fbm(vWpos * 7.0 + 3.0)) * mU;
  col = mix(col, uUlcerColor, ulcer * 0.8);

  // "Creeping fat": pale fat wrapping thickened Crohn's segments on one side.
  float fatSide = smoothstep(0.25, 0.85, 0.5 + 0.5 * cos(vAngle - 3.4));
  float fat = mC * fatSide * smoothstep(0.42, 0.62, fbm(vWpos * 4.0 + 5.0));
  col = mix(col, uFatColor, fat * 0.9);

  diffuseColor.rgb = col;
`;

// Appended after <roughnessmap_fragment>.
export const FRAGMENT_ROUGHNESS = /* glsl */ `
  #include <roughnessmap_fragment>
  {
    float mR = max(crohnsAt(vU), ucAt(vU));
    roughnessFactor = mix(roughnessFactor, 0.28, mR);
  }
`;

// Replaces <normal_fragment_maps>.
export const FRAGMENT_NORMAL = /* glsl */ `
  #include <normal_fragment_maps>
  {
    float mCn = crohnsAt(vU);
    float mUn = ucAt(vU);
    float h = surfaceHeight(vWpos, mCn, mUn);
    vec2 dHdxy = vec2(dFdx(h), dFdy(h)) * 0.06;
    normal = perturbNormalArbitrary(-vViewPosition, normal, dHdxy, faceDirection);
  }
`;

// Appended after <emissivemap_fragment>.
export const FRAGMENT_EMISSIVE = /* glsl */ `
  #include <emissivemap_fragment>
  {
    float mCe = crohnsAt(vU);
    float mUe = ucAt(vU);
    float me = max(mCe, mUe);
    float pulse = 0.5 + 0.5 * sin(uTime * 2.6 + vU * 28.0);
    vec3 viewDir = normalize(vViewPosition);
    float fres = pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), 3.0);
    vec3 rim = mix(uRimHealthy, uRimInflamed, me);
    totalEmissiveRadiance += rim * fres * 0.16;
    totalEmissiveRadiance += uInflamedColor * (0.1 * me + 0.5 * me * uFlare * pulse);
  }
`;
