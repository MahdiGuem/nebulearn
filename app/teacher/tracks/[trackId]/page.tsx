import { Suspense } from "react";
import Link from "next/link";
import { TrackLessonsClient } from "./track-lessons-client";

export default async function TeacherTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10 max-w-4xl mx-auto p-8 overflow-auto">
        <div className="mb-6">
          <Link
            href="/teacher"
            className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
          >
            ← Back to Nebulas
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="h-16 rounded-lg border bg-muted animate-pulse" />
              <div className="h-40 rounded-lg border bg-muted animate-pulse" />
            </div>
          }
        >
          <TrackLessonsClient trackId={trackId} />
        </Suspense>
      </div>
    </div>
  );
}
