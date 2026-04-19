import { Suspense } from "react";
import { StudentTrackLessonsClient } from "./student-track-lessons-client";

export default async function StudentTrackLessonsPage({
  params,
}: {
  params: Promise<{ classId: string; trackId: string }>;
}) {
  const { classId, trackId } = await params;

  return (
    <div className="relative min-h-screen overflow-auto p-4">
      <div className="absolute inset-0 bg-stars"></div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-purple-500/30 animate-pulse" />
          </div>
        }
      >
        <StudentTrackLessonsClient classId={classId} trackId={trackId} />
      </Suspense>
    </div>
  );
}