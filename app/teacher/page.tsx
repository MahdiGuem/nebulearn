import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TeacherClassesClient } from "./classes-client";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  const fullName = `${user.prismaUser.firstName} ${user.prismaUser.lastName}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="title text-center">{fullName}</h1>
        <Link href="/teacher/classes" className="btn-arrow mt-8">
          <span>Go to Nebulas</span>
          <span className="btn-arrow-icon">→</span>
        </Link>
      </div>
    </div>
  );
}
