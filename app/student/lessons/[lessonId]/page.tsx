import { Suspense } from "react";
import { LessonClient } from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <div className="relative min-h-screen overflow-auto p-4">
      <div className="absolute inset-0 bg-stars"></div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 animate-spin" style={{ borderTopColor: 'rgba(168, 85, 247, 0.8)' }} />
          </div>
        }
      >
        <LessonClient lessonId={lessonId} />
      </Suspense>
    </div>
  );
}