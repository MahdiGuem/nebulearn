"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TrackItem = {
  id: string;
  name: string;
  description: string | null;
  lessonCount: number;
};

type SubjectWithTracks = {
  subjectId: string;
  subjectName: string;
  subjectDescription: string | null;
  tracks: TrackItem[];
};

const PLANET_COLORS = [
  { base: "from-purple-600 to-pink-600", glow: "rgba(168, 85, 247, 0.5)" },
  { base: "from-blue-600 to-cyan-600", glow: "rgba(34, 211, 238, 0.5)" },
  { base: "from-orange-600 to-red-600", glow: "rgba(249, 115, 22, 0.5)" },
  { base: "from-green-600 to-emerald-600", glow: "rgba(34, 197, 94, 0.5)" },
  { base: "from-yellow-600 to-amber-600", glow: "rgba(234, 179, 8, 0.5)" },
  { base: "from-rose-600 to-pink-600", glow: "rgba(244, 63, 94, 0.5)" },
];

function PlanetCard({
  track,
  colorIndex,
  onClick,
}: {
  track: TrackItem;
  colorIndex: number;
  onClick: () => void;
}) {
  const colors = PLANET_COLORS[colorIndex % PLANET_COLORS.length];

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-full cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.base}`}
        style={{
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.1)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <h3 className="shiny-text text-center text-lg font-bold truncate w-full">
          {track.name}
        </h3>
        <p className="text-white/70 text-sm mt-2">
          {track.lessonCount} moon
          {track.lessonCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

export function StudentSubjectsClient({ classId }: { classId: string }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectWithTracks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTracks() {
      try {
        const res = await fetch(`/api/classes/${classId}/tracks`);
        const data = await res.json();
        if (mounted) {
          if (res.ok) {
            setSubjects(data.tracksBySubject || []);
          } else {
            setError(data.error || "Failed to load tracks");
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

    loadTracks();

    return () => {
      mounted = false;
    };
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 animate-spin" style={{ borderTopColor: 'rgba(168, 85, 247, 0.8)' }} />
      </div>
    );
  }

  if (error || subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/student/classes"
            className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
          >
            ←
          </Link>
          <h1 className="title">Select a Subject</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="text-5xl">🪐</div>
          <p className="text-purple-200/60">{error || "No subjects yet — ask your teacher!"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/student/classes"
          className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
        >
          ←
        </Link>
        <h1 className="title">Select a Subject</h1>
      </div>

      {subjects.map((subject, subjIndex) => (
        <div key={subject.subjectId} className="space-y-4">
          <h2 className="text-xl font-bold text-purple-200">{subject.subjectName}</h2>
          {subject.subjectDescription && (
            <p className="text-white/50 text-sm">{subject.subjectDescription}</p>
          )}
          {subject.tracks.length === 0 ? (
            <p className="text-white/30 text-sm">No tracks in this subject</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {subject.tracks.map((track, trackIndex) => (
                <PlanetCard
                  key={track.id}
                  track={track}
                  colorIndex={subjIndex + trackIndex}
                  onClick={() => router.push(`/student/classes/${classId}/${track.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}