"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Torus knot en verre fumé — nœud mathématique avec reflets cuivrés.
 * Représente la complexité rendue élégante par Velinova.
 */
export function GlassKnot() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lumières multiples pour les reflets
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.3));

    const light1 = new THREE.DirectionalLight(0xf5ebe0, 0.8);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x7a2e26, 0.5);
    light2.position.set(-4, -2, 3);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x953830, 2, 12);
    light3.position.set(2, 3, 4);
    scene.add(light3);

    const light4 = new THREE.PointLight(0xf5ebe0, 1, 10);
    light4.position.set(-3, -1, 2);
    scene.add(light4);

    // Torus knot principal — matériau verre fumé
    const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.35, 200, 32, 2, 3);
    const knotMat = new THREE.MeshPhongMaterial({
      color: 0x1a110d,
      emissive: 0x7a2e26,
      emissiveIntensity: 0.08,
      specular: 0xf5ebe0,
      shininess: 140,
      transparent: true,
      opacity: 0.65,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    // Wireframe par-dessus — donne l'aspect technique
    const wireGeo = new THREE.TorusKnotGeometry(1.12, 0.36, 100, 16, 2, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // Second knot plus petit à l'intérieur — profondeur
    const innerKnotGeo = new THREE.TorusKnotGeometry(0.6, 0.15, 120, 20, 3, 5);
    const innerKnotMat = new THREE.MeshPhongMaterial({
      color: 0x2d1f17,
      emissive: 0x953830,
      emissiveIntensity: 0.12,
      specular: 0xf5ebe0,
      shininess: 100,
      transparent: true,
      opacity: 0.4,
    });
    const innerKnot = new THREE.Mesh(innerKnotGeo, innerKnotMat);
    scene.add(innerKnot);

    // Anneau orbital
    const ringGeo = new THREE.TorusGeometry(2.2, 0.006, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      transparent: true,
      opacity: 0.15,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    scene.add(ring);

    // Particules
    const pCount = 80;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xf5ebe0, size: 0.018, transparent: true, opacity: 0.3 }),
    );
    scene.add(particles);

    // Animation
    let time = 0;
    let scrollY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouse, { passive: true });

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      time += 0.004;

      const sf = scrollY * 0.0004;

      // Rotation principale
      knot.rotation.x = time * 0.2 + mouseY * 0.1;
      knot.rotation.y = time * 0.3 + sf + mouseX * 0.15;
      wire.rotation.copy(knot.rotation);

      // Inner knot tourne en sens inverse
      innerKnot.rotation.x = -time * 0.25;
      innerKnot.rotation.y = -time * 0.35 + sf;

      ring.rotation.z = time * 0.08;
      particles.rotation.y = time * 0.03;

      // Lumières dynamiques
      light3.position.x = Math.sin(time * 0.6) * 4;
      light3.position.z = Math.cos(time * 0.6) * 4;
      light4.position.x = Math.cos(time * 0.4) * 3;
      light4.position.y = Math.sin(time * 0.4) * 3;

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
      className="pointer-events-none absolute inset-0 z-0 opacity-55"
    />
  );
}
