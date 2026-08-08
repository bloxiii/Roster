"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Terrain abstrait ondulant — grille minimaliste qui bouge comme de l'eau.
 * UN seul élément, propre, lent, premium. Inspiré Stripe/Linear.
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
    const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lumière douce
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.2));
    const dirLight = new THREE.DirectionalLight(0xf5ebe0, 0.4);
    dirLight.position.set(0, 5, 3);
    scene.add(dirLight);

    // ─── Terrain (plan subdivisé) ───────────────────────
    const gridSize = 60;
    const planeGeo = new THREE.PlaneGeometry(12, 12, gridSize, gridSize);
    planeGeo.rotateX(-Math.PI / 2);

    // Sauvegarder les positions originales
    const originalY = new Float32Array(planeGeo.attributes.position.count);
    for (let i = 0; i < planeGeo.attributes.position.count; i++) {
      originalY[i] = planeGeo.attributes.position.getY(i);
    }

    // Matériau wireframe — lignes fines, couleur marque
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const terrain = new THREE.Mesh(planeGeo, wireMat);
    terrain.position.y = -1.5;
    scene.add(terrain);

    // ─── Ligne d'horizon lumineuse ──────────────────────
    const horizonGeo = new THREE.PlaneGeometry(14, 0.02);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      transparent: true,
      opacity: 0.3,
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.y = -1.5;
    horizon.position.z = -6;
    scene.add(horizon);

    // ─── Brume / glow au fond ──────────────────────────
    const glowGeo = new THREE.PlaneGeometry(16, 6);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      transparent: true,
      opacity: 0.04,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -5;
    glow.position.y = 0;
    scene.add(glow);

    // Animation
    let time = 0;
    let scrollY = 0;
    let mouseX = 0;
    let targetMouseX = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    const handleMouse = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    const handleTouch = (e: TouchEvent) => {
      targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      time += 0.004;
      mouseX += (targetMouseX - mouseX) * 0.02;

      const sf = scrollY * 0.0003;

      // Déformer le terrain en vagues
      const pos = planeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        const wave1 = Math.sin(x * 0.4 + time * 1.2) * 0.35;
        const wave2 = Math.cos(z * 0.3 + time * 0.8) * 0.25;
        const wave3 = Math.sin((x + z) * 0.2 + time * 0.6) * 0.15;

        pos.setY(i, originalY[i] + wave1 + wave2 + wave3);
      }
      pos.needsUpdate = true;

      // Rotation subtile avec la souris
      terrain.rotation.y = mouseX * 0.08 + sf * 0.5;

      // Caméra suit la souris très légèrement
      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.01;
      camera.lookAt(0, -0.5, 0);

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
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
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
      style={{ opacity: 0.85 }}
    />
  );
}
