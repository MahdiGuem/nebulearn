import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TeacherClassesClient } from "../classes-client";

export default async function TeacherClassesPage() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10 space-y-12 p-8 overflow-auto">
        <TeacherClassesClient />
      </div>
    </div>
  );
}