import { Suspense } from "react";
import { StudentSubjectsClient } from "./student-subjects-client";

export default async function StudentSubjectsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  return (
    <div className="relative min-h-screen overflow-auto">
      <div className="absolute inset-0 bg-stars"></div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-purple-500/30 animate-pulse" />
          </div>
        }
      >
        <StudentSubjectsClient classId={classId} />
      </Suspense>
    </div>
  );
}