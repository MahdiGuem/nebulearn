"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  enrollmentType: string;
  joinedAt: string;
  teacher: { first_name: string; last_name: string };
  _count: { enrollments: number };
};

interface NebulaSettings {
  color1: string;
  color2: string;
  layers: number;
  spread: number;
  turbulence: number;
  starDensity: number;
  shape: "cloud" | "ring" | "bipolar" | "irregular";
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function hexToRgb(hex: string) {
  const h = hex?.startsWith("#") ? hex : "#c084fc";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return {
    r: isNaN(r) ? 192 : r,
    g: isNaN(g) ? 132 : g,
    b: isNaN(b) ? 252 : b,
  };
}

function drawNebula(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: NebulaSettings,
  seed: number,
  transparent = false
) {
  const rand = seededRandom(seed);
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bg.addColorStop(0, "transparent");
  bg.addColorStop(1, "transparent");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * s.spread * 0.48;

  const c1 = hexToRgb(s.color1);
  const c2 = hexToRgb(s.color2);

  ctx.globalCompositeOperation = "screen";

  const layers = s.layers;
  for (let l = 0; l < layers; l++) {
    const progress = l / layers;
    rand();
    const dist = rand() * maxR * 0.7;
    const angle = rand() * Math.PI * 2;
    const turbOff = s.turbulence * 40;

    let lx = cx + Math.cos(angle) * dist * rand();
    let ly = cy + Math.sin(angle) * dist * rand();

    if (s.shape === "ring") {
      const ringR = maxR * 0.55;
      const ringAngle = (l / layers) * Math.PI * 2;
      lx = cx + Math.cos(ringAngle) * ringR + (rand() - 0.5) * turbOff * 1.5;
      ly = cy + Math.sin(ringAngle) * ringR * 0.5 + (rand() - 0.5) * turbOff;
    } else if (s.shape === "bipolar") {
      const side = l % 2 === 0 ? 1 : -1;
      lx = cx + side * (maxR * 0.4 + rand() * maxR * 0.2) + (rand() - 0.5) * turbOff;
      ly = cy + (rand() - 0.5) * maxR * 0.6 + (rand() - 0.5) * turbOff;
    } else if (s.shape === "irregular") {
      lx = cx + (rand() - 0.5) * maxR * 1.6 + (rand() - 0.5) * turbOff * 2;
      ly = cy + (rand() - 0.5) * maxR * 1.3 + (rand() - 0.5) * turbOff * 2;
    }

    const layerR = (0.25 + rand() * 0.75) * maxR * (0.4 + s.spread * 0.6);

    const t1 = 0.3 + rand() * 0.4;
    const ri = Math.round(c1.r + (c2.r - c1.r) * t1);
    const gi = Math.round(c1.g + (c2.g - c1.g) * t1);
    const bi = Math.round(c1.b + (c2.b - c1.b) * t1);

    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, layerR);
    const alpha = 0.95 * (0.4 + rand() * 0.4) * (1 - progress * 0.3);
    grad.addColorStop(0, `rgba(${ri},${gi},${bi},${alpha})`);
    grad.addColorStop(0.35, `rgba(${ri},${gi},${bi},${alpha * 0.6})`);
    grad.addColorStop(1, `rgba(${ri},${gi},${bi},0)`);

    ctx.beginPath();
    ctx.arc(lx, ly, layerR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

function randomizeSettings(seed: number): NebulaSettings {
  const rand = seededRandom(seed);
  return {
    color1: "#c084fc",
    color2: "#38bdf8",
    layers: 15 + Math.floor(rand() * 10),
    spread: 0.3 + rand() * 0.5,
    turbulence: 0.6 + rand() * 0.4,
    starDensity: 0.7,
    shape: "cloud",
  };
}

function NebulaCard({
  classItem,
  onClick,
}: {
  classItem: ClassItem;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = hashString(classItem.name);
  const settings = randomizeSettings(seed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawNebula(ctx, canvas.width, canvas.height, settings, seed, true);
  }, [seed, settings]);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-4 pb-6">
        <h3 className="shiny-text text-center text-lg truncate w-full drop-shadow-lg">
          {classItem.name}
        </h3>
        <p className="text-white/70 text-sm mt-1 drop-shadow-md">
          {classItem._count.enrollments} student
          {classItem._count.enrollments !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

export function StudentClassesClient() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadClasses() {
      try {
        const res = await fetch("/api/classes");
        const data = await res.json();
        if (mounted && res.ok) setClasses(data.classes || []);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClasses();

    return () => {
      mounted = false;
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join class");
        return;
      }

      setSuccess(`Joined "${data.class.name}" successfully!`);
      setInviteCode("");

      const res2 = await fetch("/api/classes");
      const data2 = await res2.json();
      if (res2.ok) setClasses(data2.classes || []);
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 overflow-hidden">
      <div>
        <h1 className="title mb-6">My Classes</h1>
      </div>

      <div>
        <h2 className="title mb-6">Join a Class</h2>
        <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input
            type="text"
            id="invite-code"
            placeholder="Enter invite code (e.g. ABC123)"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase());
              setError(null);
              setSuccess(null);
            }}
            maxLength={8}
            className="input-underline flex-1 font-mono tracking-widest uppercase"
            required
          />
          <button
            type="submit"
            disabled={joining || !inviteCode.trim()}
            className="btn-arrow"
          >
            <span>{joining ? "Joining..." : "Join"}</span>
            <span className="btn-arrow-icon">→</span>
          </button>
        </form>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-400 mt-3">{success}</p>}
      </div>

      <div>
        <h2 className="title mb-6">Classes</h2>
        {classes.length === 0 ? (
          <div className="border-y border-white/10 py-16 text-center">
            <p className="body-text">No classes yet</p>
            <p className="text-white/20 text-sm mt-2">Enter an invite code above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
            {classes.map((c) => (
              <NebulaCard
                key={c.id}
                classItem={c}
                onClick={() => router.push(`/student/classes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}