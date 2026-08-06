"use client";

/**
 * Fond de particules subtiles style spatial.
 * 100% CSS (animations @keyframes), pas de canvas ni de JS lourd.
 * Les particules flottent lentement pour créer de la profondeur.
 */
export function ParticleField() {
  // Générer des positions fixes (pas de Math.random en SSR)
  const particles = [
    { x: 12, y: 8, s: 2, d: 25, del: 0 },
    { x: 85, y: 15, s: 1.5, d: 30, del: 2 },
    { x: 45, y: 22, s: 1, d: 20, del: 5 },
    { x: 70, y: 35, s: 2.5, d: 28, del: 1 },
    { x: 25, y: 45, s: 1, d: 22, del: 7 },
    { x: 90, y: 50, s: 1.5, d: 35, del: 3 },
    { x: 8, y: 60, s: 2, d: 26, del: 6 },
    { x: 55, y: 65, s: 1, d: 32, del: 4 },
    { x: 35, y: 75, s: 2, d: 24, del: 8 },
    { x: 78, y: 80, s: 1.5, d: 29, del: 2 },
    { x: 18, y: 88, s: 1, d: 27, del: 9 },
    { x: 62, y: 92, s: 2, d: 33, del: 1 },
    { x: 42, y: 12, s: 1.5, d: 31, del: 5 },
    { x: 95, y: 30, s: 1, d: 23, del: 7 },
    { x: 5, y: 40, s: 2.5, d: 36, del: 3 },
    { x: 50, y: 55, s: 1, d: 21, del: 10 },
    { x: 72, y: 70, s: 2, d: 28, del: 4 },
    { x: 30, y: 95, s: 1.5, d: 25, del: 6 },
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-paper/[0.04]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.s}px`,
            height: `${p.s}px`,
            animation: `particleFloat ${p.d}s ease-in-out ${p.del}s infinite`,
          }}
        />
      ))}

      {/* Orbes de lumière ambiante */}
      <div
        className="absolute rounded-full"
        style={{
          left: "20%",
          top: "10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(122,46,38,0.06) 0%, transparent 70%)",
          animation: "orbFloat 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          right: "10%",
          top: "50%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(122,46,38,0.04) 0%, transparent 70%)",
          animation: "orbFloat 25s ease-in-out 5s infinite reverse",
        }}
      />
    </div>
  );
}
