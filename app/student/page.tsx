import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  const fullName = `${user.prismaUser.firstName} ${user.prismaUser.lastName}`;

  return (
    <div className="relative min-h-screen overflow-auto">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="title text-center">{fullName}</h1>
        <Link
          href="/student/classes"
          className="btn-arrow mt-8"
        >
          <span>Go to Classes</span>
          <span className="btn-arrow-icon">→</span>
        </Link>
      </div>
    </div>
  );
}