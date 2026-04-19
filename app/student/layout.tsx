import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function StudentGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen">
      {/* Simple Header */}
      <header className="border-b border-purple-500/20 bg-purple-950/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-purple-100">Nebulearn</h1>
          <div className="text-sm text-purple-200/60">
            {user.prismaUser.firstName} {user.prismaUser.lastName}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <StudentGate>{children}</StudentGate>
    </Suspense>
  );
}