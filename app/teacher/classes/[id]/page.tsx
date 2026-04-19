import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { ClassDetailClient } from "./class-detail-client";
import Link from "next/link";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  const { id } = await params;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10 space-y-6 p-8 overflow-auto">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors">
            ←
          </Link>
          <h1 className="title">Nebula Details</h1>
        </div>
        <ClassDetailClient classId={id} />
      </div>
    </div>
  );
}
