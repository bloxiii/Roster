"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Réseau de noeuds connectés en 3D — représente le réseau d'agents IA.
 * Des sphères reliées par des lignes lumineuses, qui pulsent lentement.
 */
export function NetworkOrb() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Créer les noeuds
    const nodeCount = 20;
    const nodes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const r = 1.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      nodePositions.push(pos);

      const size = 0.04 + Math.random() * 0.06;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: i < 4 ? 0xc9a66b : 0xf5f3ee,
        transparent: true,
        opacity: i < 4 ? 0.9 : 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      nodes.push(mesh);
    }

    // Créer les connexions
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xc9a66b,
      transparent: true,
      opacity: 0.12,
    });

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 2.2) {
          const geo = new THREE.BufferGeometry().setFromPoints([
            nodePositions[i],
            nodePositions[j],
          ]);
          const line = new THREE.Line(geo, lineMaterial);
          scene.add(line);
        }
      }
    }

    // 4 noeuds principaux plus gros (les agents)
    const agentNodes = nodes.slice(0, 4);
    agentNodes.forEach((node, i) => {
      const ringGeo = new THREE.RingGeometry(0.12, 0.14, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc9a66b,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(node.position);
      scene.add(ring);
    });

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
      time += 0.003;

      const scrollFactor = scrollY * 0.0005;

      // Rotation lente du réseau
      scene.rotation.y = time * 0.15 + scrollFactor;
      scene.rotation.x = Math.sin(time * 0.1) * 0.1;

      // Pulsation des noeuds principaux
      agentNodes.forEach((node, i) => {
        const scale = 1 + Math.sin(time * 2 + i * 1.5) * 0.3;
        node.scale.setScalar(scale);
      });

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
      className="pointer-events-none absolute inset-0 z-0 opacity-50"
    />
  );
}
