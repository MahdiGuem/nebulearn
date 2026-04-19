"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LessonItem = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
  targetAttributes: string[];
  isCompleted: boolean;
  finalScore: number | null;
};

type TrackInfo = {
  id: string;
  name: string;
  description: string | null;
};

type Classmate = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  lastCompletedPosition: number;
};

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const PLANET_STYLES = {
  QUIZ: {
    base: "from-purple-600 to-pink-600",
    glow: "rgba(168, 85, 247, 0.5)",
  },
  YES_NO: {
    base: "from-blue-600 to-cyan-600",
    glow: "rgba(34, 211, 238, 0.5)",
  },
  SHORT_ANSWER: {
    base: "from-orange-600 to-red-600",
    glow: "rgba(249, 115, 22, 0.5)",
  },
};

function ClassmateMoons({ classmates, lessonPosition }: { classmates: Classmate[]; lessonPosition: number }) {
  const here = classmates.filter((c) => c.lastCompletedPosition === lessonPosition);
  if (here.length === 0) return null;

  const maxVisible = 3;
  const visible = here.slice(0, maxVisible);
  const overflow = here.length - maxVisible;

  const moonColors = [
    "bg-blue-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-rose-400",
    "bg-violet-400",
    "bg-cyan-400",
  ];

  return (
    <div className="absolute -right-4 -top-4 flex -space-x-1">
      {visible.map((mate, i) => (
        <div
          key={mate.id}
          className={cn(
            "w-5 h-5 rounded-full border border-background/50",
            moonColors[i % moonColors.length],
          )}
          title={`${mate.firstName} ${mate.lastName}`}
        />
      ))}
      {overflow > 0 && (
        <div className="w-5 h-5 rounded-full bg-purple-800 flex items-center justify-center text-[8px] text-purple-200 border border-background/50">
          +{overflow}
        </div>
      )}
    </div>
  );
}

function MoonNode({
  lesson,
  x,
  y,
  unlocked,
  onClick,
  classmates,
}: {
  lesson: LessonItem;
  x: number;
  y: number;
  unlocked: boolean;
  onClick: () => void;
  classmates: Classmate[];
}) {
  const isLocked = !unlocked && !lesson.isCompleted;
  const isCompleted = lesson.isCompleted;
  const isCurrent = unlocked && !isCompleted;

  const stars = isCompleted && lesson.finalScore !== null
    ? lesson.finalScore >= 90 ? 3 : lesson.finalScore >= 60 ? 2 : 1
    : 0;

  const style = PLANET_STYLES[lesson.lessonType as keyof typeof PLANET_STYLES] || PLANET_STYLES.QUIZ;

  return (
    <div
      className="absolute flex flex-col items-center z-10"
      style={{ left: `${x}%`, top: y }}
    >
      <button
        onClick={() => !isLocked && onClick()}
        className={cn(
          "relative w-14 h-14 rounded-full border-2 transition-all duration-200",
          "bg-gradient-to-br",
          style.base,
          isLocked
            ? "border-dashed border-muted-foreground/40 opacity-40 cursor-not-allowed"
            : "border-purple-400/50 shadow-lg cursor-pointer",
        )}
        style={{
          boxShadow: isLocked
            ? "none"
            : isCurrent
              ? `0 0 20px ${style.glow}, 0 0 40px ${style.glow}, inset 0 0 20px rgba(255,255,255,0.1)`
              : `0 0 12px ${style.glow}`,
        }}
      >
        {isLocked ? (
          <span className="text-muted-foreground text-lg">🔒</span>
        ) : isCompleted ? (
          <span className="text-white text-xl">✨</span>
        ) : (
          <span className="text-white/80 text-lg">▶</span>
        )}

        {isCurrent && (
          <span className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-pulse" />
        )}

        {isCompleted && stars > 0 && (
          <div className="absolute -bottom-4 flex gap-0.5 z-20">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "text-[10px]",
                  i < stars ? "text-yellow-400" : "text-muted-foreground/30",
                )}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <ClassmateMoons classmates={classmates} lessonPosition={lesson.position} />
      </button>

      <div
        className={cn(
          "mt-3 px-3 py-1.5 text-[10px] font-medium text-center",
          "bg-background/80 backdrop-blur-sm border border-purple-500/20 rounded-full",
          "text-purple-100",
          isLocked && "opacity-40",
        )}
      >
        {lesson.title}
      </div>

      {!isLocked && (
        <div className="mt-1 text-[9px] text-purple-300/70 flex items-center gap-1.5">
          <span>{lesson.xpReward} XP</span>
          <span>·</span>
          <span>{["Easy", "Medium", "Hard"][lesson.difficulty] || "Easy"}</span>
        </div>
      )}
    </div>
  );
}

export function StudentTrackLessonsClient({ classId, trackId }: { classId: string; trackId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/tracks/${trackId}/lessons`);
        const data = await res.json();
        if (mounted) {
          if (res.ok) {
            setTrack(data.track);
            setLessons(data.lessons);
            setClassmates(data.classmates ?? []);
          } else {
            setError(data.error || "Failed to load track");
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError("Something went wrong");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [trackId]);

  const nodeSpacing = 140;
  const amplitude = 25;
  const frequency = 0.6;
  const verticalPadding = 120;
  const isLessonUnlocked = (lesson: LessonItem): boolean => {
    if (lesson.position === 1) return true;
    return lessons
      .filter((l) => l.position < lesson.position)
      .every((l) => l.isCompleted);
  };

  const trackData = useMemo(() => {
    return lessons.map((lesson, index) => {
      const y = index * nodeSpacing + verticalPadding;
      const xNorm = Math.sin(index * frequency);
      const x = 50 + xNorm * amplitude;
      return { lesson, x, y, unlocked: isLessonUnlocked(lesson) };
    });
  }, [lessons, nodeSpacing, frequency, amplitude, verticalPadding, isLessonUnlocked]);

  const totalHeight = Math.max(500, trackData.length * nodeSpacing + verticalPadding * 2);

  const pathString = useMemo(() => {
    if (trackData.length === 0) return "";
    let path = `M ${trackData[0].x * 10} ${trackData[0].y}`;
    for (let i = 0; i < trackData.length - 1; i++) {
      const curr = trackData[i];
      const next = trackData[i + 1];
      const cX = curr.x * 10;
      const cY = curr.y;
      const nX = next.x * 10;
      const nY = next.y;
      const cp1y = cY + nodeSpacing / 2;
      const cp2y = nY - nodeSpacing / 2;
      path += ` C ${cX} ${cp1y}, ${nX} ${cp2y}, ${nX} ${nY}`;
    }
    return path;
  }, [trackData]);

  const progressPath = useMemo(() => {
    const completedNodes = trackData.filter((d) => d.lesson.isCompleted);
    if (completedNodes.length === 0) return "";
    let path = `M ${trackData[0].x * 10} ${trackData[0].y}`;
    for (let i = 0; i < completedNodes.length; i++) {
      if (i === 0) continue;
      const prevIdx = trackData.findIndex((d) => d.lesson.id === completedNodes[i - 1]?.lesson.id);
      const prev = trackData[prevIdx] || completedNodes[i - 1];
      const curr = completedNodes[i];
      const pX = prev.x * 10;
      const pY = prev.y;
      const cX = curr.x * 10;
      const cY = curr.y;
      const cp1y = pY + nodeSpacing / 2;
      const cp2y = cY - nodeSpacing / 2;
      path += ` C ${pX} ${cp1y}, ${cX} ${cp2y}, ${cX} ${cY}`;
    }
    return path;
  }, [trackData]);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 animate-spin" style={{ borderTopColor: 'rgba(168, 85, 247, 0.8)' }} />
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">🌌</div>
        <p className="text-purple-200/60">{error || "Track not found"}</p>
        <Link
          href={`/student/classes/${classId}`}
          className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-200 hover:bg-purple-600/30 transition-colors"
        >
          ← Back to subjects
        </Link>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <TrackHeader track={track} classId={classId} completedCount={0} totalCount={0} progressPercent={0} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="text-5xl">🌌</div>
          <p className="text-purple-200/60">No moons yet — ask your teacher!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrackHeader
        track={track}
        classId={classId}
        completedCount={completedCount}
        totalCount={lessons.length}
        progressPercent={progressPercent}
      />

      <div
        className="relative w-full overflow-hidden rounded-3xl"
        style={{ height: totalHeight }}
        ref={containerRef}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox={`0 0 1000 ${totalHeight}`}
          preserveAspectRatio="none"
        >
          <path
            d={pathString}
            fill="none"
            stroke="rgba(168, 85, 247, 0.1)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 8"
          />
          {progressPath && (
            <path
              d={progressPath}
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.8)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-purple-300/30 text-sm font-medium">
          ✨ Start
        </div>

        {trackData.map((node) => (
          <MoonNode
            key={node.lesson.id}
            lesson={node.lesson}
            x={node.x}
            y={node.y}
            unlocked={node.unlocked}
            classmates={classmates}
            onClick={() => router.push(`/student/lessons/${node.lesson.id}`)}
          />
        ))}

        {trackData.length > 0 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-purple-300/30 text-sm font-medium"
            style={{ top: trackData[trackData.length - 1].y + 70 }}
          >
            🏁 Finish
          </div>
        )}
      </div>
    </div>
  );
}

function TrackHeader({
  track,
  classId,
  completedCount,
  totalCount,
  progressPercent,
}: {
  track: TrackInfo;
  classId: string;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href={`/student/classes/${classId}`}
          className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{track.name}</h1>
          {track.description && (
            <p className="text-sm text-purple-200/60 mt-0.5">{track.description}</p>
          )}
        </div>
      </div>

      <div className="h-3 rounded-full bg-purple-900/30 border border-purple-500/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-800"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-purple-200/60">
        <span>Progress</span>
        <span>
          {completedCount}/{totalCount} · {progressPercent}%
        </span>
      </div>
    </div>
  );
}