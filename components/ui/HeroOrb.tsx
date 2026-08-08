"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero 3D spectaculaire — structure cristalline vivante.
 * Noyau avec displacement animé, couches orbitales multiples,
 * 600+ particules en formations spiralées, éclairage dramatique.
 */
export function HeroOrb() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── ÉCLAIRAGE DRAMATIQUE ───────────────────────────
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.15));

    const keyLight = new THREE.DirectionalLight(0xf5ebe0, 0.6);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x7a2e26, 3, 15);
    fillLight.position.set(-3, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x953830, 2, 12);
    rimLight.position.set(3, -2, -3);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0xf5ebe0, 1.5, 10);
    accentLight.position.set(0, 4, 2);
    scene.add(accentLight);

    // Groupe principal
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ─── NOYAU — Icosaèdre avec displacement animé ──────
    const coreGeo = new THREE.IcosahedronGeometry(0.9, 5);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x1a110d,
      emissive: 0x7a2e26,
      emissiveIntensity: 0.2,
      specular: 0xf5ebe0,
      shininess: 120,
      transparent: true,
      opacity: 0.75,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(core);

    // Sauvegarder les positions originales pour le displacement
    const coreOriginal = new Float32Array(coreGeo.attributes.position.array);

    // ─── COUCHE WIREFRAME EXTERNE ───────────────────────
    const outerGeo = new THREE.IcosahedronGeometry(1.4, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    mainGroup.add(outer);

    // ─── ANNEAUX ORBITAUX (5 anneaux à différents angles) ──
    const ringConfigs = [
      { r: 1.8, thickness: 0.012, tiltX: Math.PI / 2.2, tiltY: 0, opacity: 0.25, speed: 0.12 },
      { r: 2.1, thickness: 0.008, tiltX: Math.PI / 3, tiltY: Math.PI / 6, opacity: 0.15, speed: -0.08 },
      { r: 2.5, thickness: 0.006, tiltX: Math.PI / 4, tiltY: Math.PI / 3, opacity: 0.1, speed: 0.06 },
      { r: 1.5, thickness: 0.01, tiltX: Math.PI / 1.8, tiltY: Math.PI / 4, opacity: 0.18, speed: -0.15 },
      { r: 2.8, thickness: 0.004, tiltX: Math.PI / 5, tiltY: Math.PI / 2, opacity: 0.08, speed: 0.04 },
    ];

    const rings: THREE.Mesh[] = [];
    ringConfigs.forEach((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.r, cfg.thickness, 16, 120);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x7a2e26,
        transparent: true,
        opacity: cfg.opacity,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = cfg.tiltX;
      ring.rotation.y = cfg.tiltY;
      mainGroup.add(ring);
      rings.push(ring);
    });

    // ─── LIGNES DE CONNEXION (du noyau vers l'extérieur) ──
    const lineCount = 16;
    for (let i = 0; i < lineCount; i++) {
      const theta = (i / lineCount) * Math.PI * 2;
      const phi = Math.acos(((i * 2.399) % 2) - 1); // Distribution Fibonacci
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      );

      const start = dir.clone().multiplyScalar(0.95);
      const end = dir.clone().multiplyScalar(1.6 + Math.random() * 0.8);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x7a2e26,
        transparent: true,
        opacity: 0.15 + Math.random() * 0.1,
      });
      mainGroup.add(new THREE.Line(lineGeo, lineMat));

      // Point lumineux au bout de chaque ligne
      const dotGeo = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x953830,
        transparent: true,
        opacity: 0.6,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(end);
      mainGroup.add(dot);
    }

    // ─── PARTICULES EN FORMATIONS ───────────────────────
    // Spirale de particules
    const spiralCount = 300;
    const spiralPos = new Float32Array(spiralCount * 3);
    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const angle = t * Math.PI * 8;
      const r = 0.5 + t * 2.5;
      const y = (t - 0.5) * 3;
      spiralPos[i * 3] = Math.cos(angle) * r * 0.4;
      spiralPos[i * 3 + 1] = y * 0.5;
      spiralPos[i * 3 + 2] = Math.sin(angle) * r * 0.4;
    }
    const spiralGeo = new THREE.BufferGeometry();
    spiralGeo.setAttribute("position", new THREE.BufferAttribute(spiralPos, 3));
    const spiralMat = new THREE.PointsMaterial({
      color: 0xf5ebe0,
      size: 0.015,
      transparent: true,
      opacity: 0.35,
    });
    const spiral = new THREE.Points(spiralGeo, spiralMat);
    mainGroup.add(spiral);

    // Sphère de particules extérieure
    const cloudCount = 300;
    const cloudPos = new Float32Array(cloudCount * 3);
    for (let i = 0; i < cloudCount; i++) {
      const r = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      cloudPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      cloudPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      cloudPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute("position", new THREE.BufferAttribute(cloudPos, 3));
    const cloudMat = new THREE.PointsMaterial({
      color: 0xf5ebe0,
      size: 0.012,
      transparent: true,
      opacity: 0.2,
    });
    const cloud = new THREE.Points(cloudGeo, cloudMat);
    mainGroup.add(cloud);

    // ─── INTERACTION ────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouse = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const handleTouch = (e: TouchEvent) => {
      targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };
    const handleScroll = () => { scrollY = window.scrollY; };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ─── BOUCLE D'ANIMATION ─────────────────────────────
    let time = 0;
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      time += 0.003;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      const sf = scrollY * 0.0003;

      // ── Displacement du noyau (effet "respiration") ──
      const positions = coreGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const ox = coreOriginal[i];
        const oy = coreOriginal[i + 1];
        const oz = coreOriginal[i + 2];
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        if (len === 0) continue;
        const nx = ox / len;
        const ny = oy / len;
        const nz = oz / len;

        // Displacement basé sur la position + le temps
        const noise =
          Math.sin(nx * 3 + time * 2) * 0.08 +
          Math.sin(ny * 4 + time * 1.5) * 0.06 +
          Math.cos(nz * 2 + time * 2.5) * 0.05;

        positions[i] = ox + nx * noise;
        positions[i + 1] = oy + ny * noise;
        positions[i + 2] = oz + nz * noise;
      }
      coreGeo.attributes.position.needsUpdate = true;
      coreGeo.computeVertexNormals();

      // ── Rotations ──
      mainGroup.rotation.y = time * 0.15 + sf + mouseX * 0.3;
      mainGroup.rotation.x = Math.sin(time * 0.1) * 0.05 + mouseY * 0.15;

      core.rotation.y = time * 0.4;
      core.rotation.x = time * 0.2;

      outer.rotation.y = -time * 0.15;
      outer.rotation.x = time * 0.1;

      // Anneaux
      rings.forEach((ring, i) => {
        ring.rotation.z += ringConfigs[i].speed * 0.01;
      });

      // Spirale
      spiral.rotation.y = time * 0.08;
      spiral.rotation.x = Math.sin(time * 0.05) * 0.1;

      // Cloud
      cloud.rotation.y = -time * 0.02;

      // ── Lumières dynamiques ──
      fillLight.position.x = Math.sin(time * 0.7) * 4;
      fillLight.position.z = Math.cos(time * 0.7) * 4;
      fillLight.position.y = Math.sin(time * 0.5) * 2;

      rimLight.position.x = Math.cos(time * 0.5) * 3;
      rimLight.position.z = Math.sin(time * 0.5) * 3;

      accentLight.position.x = Math.sin(time * 0.3) * 2;
      accentLight.position.z = Math.cos(time * 0.3) * 4;

      // ── Caméra parallax ──
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{ opacity: 0.75 }}
    />
  );
}
