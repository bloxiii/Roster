"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Orbe 3D Velin — fond du hero.
 * Icosaèdre wireframe + sphère intérieure + anneaux orbitaux + particules.
 * Réagit au scroll (rotation) et au mouvement souris/touch (parallax caméra).
 * Respecte prefers-reduced-motion.
 */
export function HeroOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respecter prefers-reduced-motion
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.3));
    const dirLight = new THREE.DirectionalLight(0xf5ebe0, 0.7);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x7a2e26, 2, 10);
    pointLight.position.set(-2, 1, 3);
    scene.add(pointLight);
    scene.add(new THREE.PointLight(0x953830, 1.2, 8).translateX(2).translateY(-1).translateZ(-2));

    // Wireframe sphere
    const wireGeo = new THREE.IcosahedronGeometry(1.3, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const wireframe = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireframe);

    // Inner solid sphere
    const innerGeo = new THREE.IcosahedronGeometry(0.95, 4);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x2d1f17,
      emissive: 0x7a2e26,
      emissiveIntensity: 0.12,
      shininess: 60,
      transparent: true,
      opacity: 0.8,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    // Rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.012, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x7a2e26, transparent: true, opacity: 0.35 }),
    );
    ring1.rotation.x = Math.PI / 2.5;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.008, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x4a3529, transparent: true, opacity: 0.15 }),
    );
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    // Particles
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 1.6 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({ color: 0xf5ebe0, size: 0.02, transparent: true, opacity: 0.4 }),
    );
    scene.add(particles);

    // Interaction
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;

    function onPointerMove(x: number, y: number) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((x - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((y - rect.top) / rect.height - 0.5) * 2;
    }

    const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation loop
    let time = 0;
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);

      if (motionOk) {
        time += 0.004;
      }

      const scrollFactor = scrollY * 0.001;

      wireframe.rotation.y = time * 0.25 + mouseX * 0.4 + scrollFactor;
      wireframe.rotation.x = Math.sin(time * 0.15) * 0.1 + mouseY * 0.2;

      innerSphere.rotation.y = time * 0.15 + mouseX * 0.2 + scrollFactor * 0.5;
      innerSphere.rotation.x = time * 0.1 + mouseY * 0.15;

      ring1.rotation.z = time * 0.12 + scrollFactor * 0.3;
      ring2.rotation.z = -time * 0.08;

      particles.rotation.y = time * 0.04 + scrollFactor * 0.1;

      pointLight.position.x = Math.sin(time * 0.4) * 3;
      pointLight.position.z = Math.cos(time * 0.4) * 3;

      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();

    // Resize
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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-70"
    />
  );
}
