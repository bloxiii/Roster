"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * LaptopScene — scène 3D continue pilotée par le scroll (Apple × igloo.inc).
 *
 * Un laptop s'ouvre au fil du scroll, son écran s'allume (mini interface
 * Velinova animée en shader : les tâches se cochent seules), la caméra
 * orbite autour puis plonge dans l'écran, pendant que le décor change
 * d'ambiance (encre → ardoise → laiton chaud).
 *
 * Canvas fixe plein écran derrière le contenu, inertie de scroll,
 * parallaxe souris, prefers-reduced-motion respecté.
 *
 * Usage (app/[locale]/page.tsx) :
 *   <LaptopScene />
 *   <main className="flex-1 relative z-10">…</main>
 */

const SCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOn;
  varying vec2 vUv;

  float bar(vec2 uv, vec2 pos, vec2 size) {
    vec2 d = abs(uv - pos) - size;
    return step(max(d.x, d.y), 0.0);
  }

  void main() {
    vec2 uv = vUv;
    vec3 ink = vec3(0.043, 0.059, 0.102);
    vec3 brass = vec3(0.788, 0.651, 0.42);
    vec3 paper = vec3(0.96, 0.953, 0.933);

    float glow = 1.0 - length(uv - vec2(0.5, 0.55));
    vec3 col = ink + brass * glow * 0.12;

    col = mix(col, ink * 1.8, bar(uv, vec2(0.09, 0.5), vec2(0.07, 0.42)));

    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float y = 0.78 - fi * 0.14;
      float done = step(fi * 0.9 + 1.2, uTime * uOn);
      vec3 rowCol = mix(paper * 0.25, brass, done);
      col = mix(col, rowCol, bar(uv, vec2(0.24, y), vec2(0.02, 0.02)));
      col = mix(col, paper * (0.25 + done * 0.25),
                bar(uv, vec2(0.55, y), vec2(0.25, 0.012)));
    }

    float scan = smoothstep(0.02, 0.0, abs(uv.y - fract(uTime * 0.25)));
    col += brass * scan * 0.08 * uOn;

    col *= 0.75 + 0.25 * (1.0 - length(uv - 0.5));
    col *= uOn;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const DUST_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aScale;
  attribute float aOffset;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.3 + aOffset) * 0.4;
    p.x += cos(uTime * 0.2 + aOffset * 2.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aScale * (90.0 / -mv.z);
    vAlpha = smoothstep(20.0, 4.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(uColor, a * vAlpha * 0.5);
  }
`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

type Vec3 = [number, number, number];
type CamKey = { p: number; pos: Vec3; look: Vec3 };

const CAM_KEYS: CamKey[] = [
  { p: 0.0, pos: [0, 2.8, 7.2], look: [0, 0.2, 0] },
  { p: 0.28, pos: [0, 1.7, 5.0], look: [0, 0.7, -0.4] },
  { p: 0.5, pos: [3.4, 1.3, 3.8], look: [0, 0.8, -0.6] },
  { p: 0.74, pos: [-2.6, 1.5, 4.0], look: [0, 0.85, -0.7] },
  { p: 1.0, pos: [0, 1.1, 1.15], look: [0, 0.95, -1.35] },
];

function sampleCamera(p: number, outPos: Vec3, outLook: Vec3): void {
  let a = CAM_KEYS[0];
  let b = CAM_KEYS[CAM_KEYS.length - 1];
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    if (p >= CAM_KEYS[i].p && p <= CAM_KEYS[i + 1].p) {
      a = CAM_KEYS[i];
      b = CAM_KEYS[i + 1];
      break;
    }
  }
  const t = ease(range(p, a.p, b.p));
  for (let i = 0; i < 3; i++) {
    outPos[i] = lerp(a.pos[i], b.pos[i], t);
    outLook[i] = lerp(a.look[i], b.look[i], t);
  }
}

type DecorKey = { p: number; bg: THREE.Color; dust: THREE.Color };

const DECORS: DecorKey[] = [
  { p: 0.0, bg: new THREE.Color("#0b0f1a"), dust: new THREE.Color("#f5f3ee") },
  { p: 0.5, bg: new THREE.Color("#12202b"), dust: new THREE.Color("#7fa3b8") },
  { p: 1.0, bg: new THREE.Color("#191307"), dust: new THREE.Color("#c9a66b") },
];

function sampleDecor(p: number, outBg: THREE.Color, outDust: THREE.Color): void {
  let a = DECORS[0];
  let b = DECORS[DECORS.length - 1];
  for (let i = 0; i < DECORS.length - 1; i++) {
    if (p >= DECORS[i].p && p <= DECORS[i + 1].p) {
      a = DECORS[i];
      b = DECORS[i + 1];
      break;
    }
  }
  const t = ease(range(p, a.p, b.p));
  outBg.lerpColors(a.bg, b.bg, t);
  outDust.lerpColors(a.dust, b.dust, t);
}

export function LaptopScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x0b0f1a, 0.05);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );

    /* ── Lumières ─────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xf5f3ee, 0.25));
    const keyLight = new THREE.DirectionalLight(0xf5f3ee, 0.9);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);
    const screenLight = new THREE.PointLight(0xc9a66b, 0, 8);
    screenLight.position.set(0, 1.2, 0.4);
    scene.add(screenLight);

    /* ── Laptop ───────────────────────────────────────────────── */
    const laptop = new THREE.Group();
    scene.add(laptop);

    const alu = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      metalness: 0.75,
      roughness: 0.35,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x0d1220,
      metalness: 0.4,
      roughness: 0.6,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 2), alu);
    base.position.y = 0.06;
    laptop.add(base);

    const keyboard = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), dark);
    keyboard.rotation.x = -Math.PI / 2;
    keyboard.position.set(0, 0.125, 0.1);
    laptop.add(keyboard);

    const hinge = new THREE.Group();
    hinge.position.set(0, 0.12, -1);
    laptop.add(hinge);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 2), alu);
    lid.position.set(0, 0.04, 1);
    hinge.add(lid);

    const screenUniforms = {
      uTime: { value: 0 },
      uOn: { value: 0 },
    };
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 1.8),
      new THREE.ShaderMaterial({
        vertexShader: SCREEN_VERTEX,
        fragmentShader: SCREEN_FRAGMENT,
        uniforms: screenUniforms,
      })
    );
    screen.rotation.x = Math.PI / 2;
    screen.position.set(0, -0.005, 1);
    hinge.add(screen);

    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 32),
      new THREE.MeshStandardMaterial({
        color: 0xc9a66b,
        metalness: 0.9,
        roughness: 0.2,
      })
    );
    logo.rotation.x = -Math.PI / 2;
    logo.position.set(0, 0.085, 1);
    hinge.add(logo);

    /* ombre douce sous le laptop */
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d");
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 8, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3.6),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(shadowCanvas),
        transparent: true,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    scene.add(shadow);

    /* ── Poussière d'ambiance ─────────────────────────────────── */
    const COUNT = 700;
    const pos = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const offsets = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      scales[i] = 0.4 + Math.random() * 1.2;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    dustGeo.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));
    const dustUniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#f5f3ee") },
    };
    const dust = new THREE.Points(
      dustGeo,
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERTEX,
        fragmentShader: DUST_FRAGMENT,
        uniforms: dustUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(dust);

    /* ── Scroll, souris, inertie ──────────────────────────────── */
    let targetProgress = 0;
    let progress = reduceMotion ? 1 : 0;
    let mouseX = 0;
    let mouseY = 0;
    let smX = 0;
    let smY = 0;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress = max > 0 ? window.scrollY / max : 0;
    };
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (reduceMotion) renderFrame(1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    const clock = new THREE.Clock();
    let raf = 0;
    const camPos: Vec3 = [0, 0, 0];
    const camLook: Vec3 = [0, 0, 0];
    const bgColor = new THREE.Color();
    const dustColor = new THREE.Color();

    const renderFrame = (p: number) => {
      /* 1. le capot s'ouvre */
      const open = ease(range(p, 0.06, 0.4));
      hinge.rotation.x = -open * 1.92;

      /* 2. l'écran s'allume */
      const on = ease(range(p, 0.3, 0.5));
      screenUniforms.uOn.value = on;
      screenLight.intensity = on * 1.6;

      /* 3. décor : fond, brume, particules */
      sampleDecor(p, bgColor, dustColor);
      renderer.setClearColor(bgColor);
      fog.color.copy(bgColor);
      dustUniforms.uColor.value.copy(dustColor);

      /* 4. caméra sur rail + parallaxe souris */
      sampleCamera(p, camPos, camLook);
      camera.position.set(
        camPos[0] + smX * 0.35 * (1 - p * 0.7),
        camPos[1] + smY * -0.25 * (1 - p * 0.7),
        camPos[2]
      );
      camera.lookAt(camLook[0], camLook[1], camLook[2]);

      renderer.render(scene, camera);
    };

    if (reduceMotion) {
      renderFrame(1);
    } else {
      const tick = () => {
        const t = clock.getElapsedTime();
        screenUniforms.uTime.value = t;
        dustUniforms.uTime.value = t;
        progress = lerp(progress, targetProgress, 0.06);
        smX = lerp(smX, mouseX, 0.04);
        smY = lerp(smY, mouseY, 0.04);
        renderFrame(progress);
        raf = requestAnimationFrame(tick);
      };
      tick();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
