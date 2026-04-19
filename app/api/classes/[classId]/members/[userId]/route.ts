import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ classId: string; userId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can remove students" }, { status: 403 });
    }

    const { classId, userId } = await params;

    const classData = await prisma.classes.findUnique({ where: { id: classId } });
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enrollment = await prisma.enrollments.findUnique({
      where: { class_id_user_id: { class_id: classId, user_id: userId } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Student is not enrolled in this class" }, { status: 404 });
    }

    await prisma.enrollments.delete({ where: { id: enrollment.id } });

    return NextResponse.json({ message: "Student removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}