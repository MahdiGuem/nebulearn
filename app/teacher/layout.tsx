import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <nav className="relative z-10 flex items-center justify-between p-4 border-b border-purple-500/20">
        <Link href="/teacher" className="title text-xl">Teach</Link>
        <div className="flex gap-4">
          <Link href="/teacher/classes" className="text-purple-200 hover:text-white">Nebulas</Link>
          <Link href="/teacher/profile" className="text-purple-200 hover:text-white">Profile</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}