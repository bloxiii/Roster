"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Globe terrestre transparent avec arcs lumineux entre villes.
 * Représente les agents Velinova qui travaillent dans le monde entier, 24/7.
 */
export function GlobeConnections() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lumières
    scene.add(new THREE.AmbientLight(0xf5ebe0, 0.2));
    const dirLight = new THREE.DirectionalLight(0xf5ebe0, 0.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Sphère globe — wireframe transparent
    const globeGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x7a2e26,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Cercles de latitude
    const latitudes = [-0.8, -0.3, 0.2, 0.7, 1.1];
    latitudes.forEach((lat) => {
      const r = Math.sqrt(1.5 * 1.5 - lat * lat);
      if (r <= 0) return;
      const circleGeo = new THREE.RingGeometry(r - 0.003, r + 0.003, 64);
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0x4a3529,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const circle = new THREE.Mesh(circleGeo, circleMat);
      circle.position.y = lat;
      circle.rotation.x = Math.PI / 2;
      globe.add(circle);
    });

    // Villes (lat, lon en radians)
    const cities = [
      { name: "Paris", lat: 0.85, lon: 0.04 },
      { name: "NYC", lat: 0.71, lon: -1.29 },
      { name: "Tokyo", lat: 0.62, lon: 2.44 },
      { name: "Dubai", lat: 0.44, lon: 0.96 },
      { name: "Sydney", lat: -0.59, lon: 2.63 },
      { name: "London", lat: 0.9, lon: -0.02 },
      { name: "Singapore", lat: 0.02, lon: 1.81 },
      { name: "SaoPaulo", lat: -0.41, lon: -0.81 },
      { name: "LA", lat: 0.59, lon: -2.06 },
      { name: "Mumbai", lat: 0.33, lon: 1.27 },
    ];

    // Convertir lat/lon en position 3D sur la sphère
    function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
      return new THREE.Vector3(
        r * Math.cos(lat) * Math.sin(lon),
        r * Math.sin(lat),
        r * Math.cos(lat) * Math.cos(lon),
      );
    }

    // Points lumineux pour chaque ville
    const cityMeshes: THREE.Mesh[] = [];
    cities.forEach((city) => {
      const pos = latLonToVec3(city.lat, city.lon, 1.52);
      const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x7a2e26,
        transparent: true,
        opacity: 0.9,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globe.add(dot);
      cityMeshes.push(dot);

      // Halo autour du point
      const haloGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x7a2e26,
        transparent: true,
        opacity: 0.15,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos);
      globe.add(halo);
    });

    // Arcs lumineux entre certaines villes
    const connections = [
      [0, 1], // Paris → NYC
      [0, 3], // Paris → Dubai
      [1, 8], // NYC → LA
      [3, 6], // Dubai → Singapore
      [2, 6], // Tokyo → Singapore
      [4, 9], // Sydney → Mumbai
      [5, 0], // London → Paris
      [7, 1], // SaoPaulo → NYC
      [9, 2], // Mumbai → Tokyo
      [6, 4], // Singapore → Sydney
    ];

    connections.forEach(([fromIdx, toIdx]) => {
      const from = latLonToVec3(cities[fromIdx].lat, cities[fromIdx].lon, 1.52);
      const to = latLonToVec3(cities[toIdx].lat, cities[toIdx].lon, 1.52);

      // Point de contrôle surélevé pour l'arc
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
      const elevation = from.distanceTo(to) * 0.5;
      mid.normalize().multiplyScalar(1.52 + elevation);

      // Courbe quadratique
      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const points = curve.getPoints(30);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x953830,
        transparent: true,
        opacity: 0.35,
      });
      const arc = new THREE.Line(arcGeo, arcMat);
      globe.add(arc);
    });

    // Particules orbitales
    const orbitCount = 80;
    const orbitPos = new Float32Array(orbitCount * 3);
    for (let i = 0; i < orbitCount; i++) {
      const r = 1.8 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      orbitPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      orbitPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      orbitPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute("position", new THREE.BufferAttribute(orbitPos, 3));
    const orbitMat = new THREE.PointsMaterial({
      color: 0xf5ebe0,
      size: 0.015,
      transparent: true,
      opacity: 0.3,
    });
    const orbitParticles = new THREE.Points(orbitGeo, orbitMat);
    scene.add(orbitParticles);

    // Animation
    let time = 0;
    let scrollY = 0;
    let mouseX = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouse, { passive: true });

    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      time += 0.003;

      const scrollFactor = scrollY * 0.0004;

      // Rotation du globe
      globe.rotation.y = time * 0.2 + scrollFactor + mouseX * 0.2;
      globe.rotation.x = 0.15;

      // Pulsation des villes
      cityMeshes.forEach((mesh, i) => {
        const scale = 1 + Math.sin(time * 3 + i * 0.7) * 0.4;
        mesh.scale.setScalar(scale);
      });

      // Particules orbitales
      orbitParticles.rotation.y = time * 0.06;
      orbitParticles.rotation.x = Math.sin(time * 0.08) * 0.05;

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
      className="pointer-events-none absolute inset-0 z-0 opacity-60"
    />
  );
}
