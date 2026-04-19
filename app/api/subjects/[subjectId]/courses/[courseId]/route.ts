import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

async function verifyCourseOwnership(subjectId: string, courseId: string, userId: string) {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    include: { subjects: { include: { classes: { select: { teacher_id: true } } } } } },
  });

  if (!course || course.subject_id !== subjectId) {
    return { error: "Course not found", status: 404 } as const;
  }
  if (course.subjects.classes.teacher_id !== userId) {
    return { error: "You don't own this class", status: 403 } as const;
  }

  return { course } as const;
}

export async function PUT(request: Request, { params }: { params: Promise<{ subjectId: string; courseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update courses" }, { status: 403 });
    }

    const { subjectId, courseId } = await params;
    const result = await verifyCourseOwnership(subjectId, courseId, user.prismaUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updated = await prisma.courses.update({ where: { id: courseId }, data: { title: title.trim() } });
    return NextResponse.json({ course: updated });
  } catch (err) {
    console.error("Update course error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ subjectId: string; courseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can delete courses" }, { status: 403 });
    }

    const { subjectId, courseId } = await params;
    const result = await verifyCourseOwnership(subjectId, courseId, user.prismaUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    try {
      const filePath = path.join(process.cwd(), "public", result.course.pdf_url);
      await unlink(filePath);
    } catch {}

    await prisma.courses.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete course error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}