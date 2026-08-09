"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Vague de particules fluide — représente le flux de données traité par les agents.
 * Les particules bougent en vague sinusoïdale, couleur brun/crème.
 */
export function ParticleWave() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Grille de particules
    const cols = 40;
    const rows = 20;
    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const brandColor = new THREE.Color(0xc9a66b);
    const creamColor = new THREE.Color(0xf5f3ee);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const idx = (i * rows + j) * 3;
        positions[idx] = (i - cols / 2) * 0.2;
        positions[idx + 1] = 0;
        positions[idx + 2] = (j - rows / 2) * 0.2;

        const mix = Math.random();
        const color = mix > 0.7 ? brandColor : creamColor;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let time = 0;
    let scrollY = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Pause le rendu quand la scène sort du viewport (perf)
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 },
    );
    visibilityObserver.observe(container);

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return;
      time += 0.008;

      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = (i * rows + j) * 3;
          pos[idx + 1] =
            Math.sin(i * 0.3 + time * 1.5) * 0.3 +
            Math.cos(j * 0.4 + time) * 0.2;
        }
      }
      geo.attributes.position.needsUpdate = true;

      const scrollFactor = scrollY * 0.0003;
      points.rotation.y = time * 0.05 + scrollFactor;

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
      visibilityObserver.disconnect();
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
      className="pointer-events-none absolute inset-0 z-0 opacity-40"
    />
  );
}
