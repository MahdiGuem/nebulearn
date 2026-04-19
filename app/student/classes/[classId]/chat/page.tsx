import { Suspense } from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { ChatClient } from "./chat-client";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  const { classId } = await params;

  // Validate enrollment and get class details
  const enrollment = await prisma.enrollments.findUnique({
    where: {
      class_id_user_id: {
        class_id: classId,
        user_id: user.prismaUser.id,
      },
    },
    include: {
      classes: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  });

  if (!enrollment) {
    redirect("/student/classes");
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-stars">
          <div className="flex items-center gap-2 text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
            <span className="ml-2">Loading chat...</span>
          </div>
        </div>
      }
    >
      <ChatClient classId={classId} className={enrollment.classes.name} />
    </Suspense>
  );
}
