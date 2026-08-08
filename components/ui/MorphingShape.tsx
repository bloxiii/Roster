"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Forme qui morphe entre sphère, cube et pyramide.
 * Matériau métallique cuivré qui reflète la lumière.
 * Transition fluide entre les géométries.
 */
export function MorphingShape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lumières pour le reflet métallique
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.4));

    const light1 = new THREE.DirectionalLight(0xf5ebe0, 1);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x7a2e26, 0.6);
    light2.position.set(-5, -2, 3);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x953830, 1.5, 10);
    light3.position.set(0, 3, 2);
    scene.add(light3);

    // Créer les trois géométries avec le même nombre de sommets
    const detail = 4;
    const sphereGeo = new THREE.IcosahedronGeometry(1.2, detail);
    const boxGeo = new THREE.IcosahedronGeometry(1.2, detail);
    const pyramidGeo = new THREE.IcosahedronGeometry(1.2, detail);

    // Déformer boxGeo en cube
    const boxPositions = boxGeo.attributes.position;
    for (let i = 0; i < boxPositions.count; i++) {
      const x = boxPositions.getX(i);
      const y = boxPositions.getY(i);
      const z = boxPositions.getZ(i);
      const max = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      if (max > 0) {
        const scale = 1.1 / max;
        boxPositions.setXYZ(i, x * scale, y * scale, z * scale);
      }
    }

    // Déformer pyramidGeo en pyramide
    const pyrPositions = pyramidGeo.attributes.position;
    for (let i = 0; i < pyrPositions.count; i++) {
      let x = pyrPositions.getX(i);
      let y = pyrPositions.getY(i);
      let z = pyrPositions.getZ(i);

      // Normaliser puis déformer
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        x /= len;
        y /= len;
        z /= len;
      }

      // Rétrécir en haut, élargir en bas
      const yFactor = 1.3;
      y = y * yFactor;
      const widthFactor = Math.max(0.1, 1 - (y + 1) * 0.4);
      x *= widthFactor * 1.2;
      z *= widthFactor * 1.2;

      pyrPositions.setXYZ(i, x * 1.2, y * 0.9, z * 1.2);
    }

    // Stocker les positions cibles
    const spherePositions = sphereGeo.attributes.position.array as Float32Array;
    const boxPositionsArr = boxGeo.attributes.position.array as Float32Array;
    const pyramidPositions = pyramidGeo.attributes.position.array as Float32Array;

    // Mesh principal
    const geometry = sphereGeo.clone();
    const material = new THREE.MeshPhongMaterial({
      color: 0x2d1f17,
      emissive: 0x7a2e26,
      emissiveIntensity: 0.15,
      specular: 0xf5ebe0,
      shininess: 100,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Wireframe par-dessus
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    scene.add(wireMesh);

    // Anneau orbital
    const ringGeo = new THREE.TorusGeometry(2, 0.008, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      transparent: true,
      opacity: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Particules autour
    const pCount = 60;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xf5ebe0, size: 0.02, transparent: true, opacity: 0.3 }),
    );
    scene.add(particles);

    // Animation
    let time = 0;
    let scrollY = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Shapes: sphère → cube → pyramide → sphère (cycle de 12s)
    const shapes = [spherePositions, boxPositionsArr, pyramidPositions];
    const cycleDuration = 12;

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      time += 0.006;

      const scrollFactor = scrollY * 0.0004;

      // Déterminer la transition courante
      const cycleTime = (time * (Math.PI * 2 / cycleDuration)) % (Math.PI * 2);
      const phase = (cycleTime / (Math.PI * 2)) * shapes.length;
      const fromIdx = Math.floor(phase) % shapes.length;
      const toIdx = (fromIdx + 1) % shapes.length;
      const t = phase - Math.floor(phase);

      // Ease in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Interpoler les positions
      const positions = geometry.attributes.position.array as Float32Array;
      const from = shapes[fromIdx];
      const to = shapes[toIdx];

      for (let i = 0; i < positions.length; i++) {
        positions[i] = from[i] + (to[i] - from[i]) * eased;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      // Rotation
      mesh.rotation.y = time * 0.3 + scrollFactor;
      mesh.rotation.x = Math.sin(time * 0.15) * 0.2;
      wireMesh.rotation.copy(mesh.rotation);

      ring.rotation.z = time * 0.1;
      particles.rotation.y = time * 0.04;

      // Lumière dynamique
      light3.position.x = Math.sin(time * 0.5) * 3;
      light3.position.z = Math.cos(time * 0.5) * 3;

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
