import { Suspense } from "react";
import { StudentClassesClient } from "./classes-client";

export default async function StudentClassesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <Suspense
        fallback={
          <div className="relative z-10 space-y-12 p-8">
            <h1 className="title">My Classes</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <StudentClassesClient />
      </Suspense>
    </div>
  );
}