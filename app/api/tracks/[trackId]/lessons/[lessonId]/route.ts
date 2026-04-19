import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function verifyLessonOwnership(lessonId: string, trackId: string, userId: string) {
  const lesson = await prisma.lessons.findUnique({
    where: { id: lessonId },
    include: { tracks: { include: { subjects: { include: { classes: { select: { teacher_id: true } } } } } } } },
  );

  if (!lesson || lesson.track_id !== trackId) return { error: "Lesson not found", status: 404 } as const;
  if (lesson.tracks.subjects.classes.teacher_id !== userId) return { error: "You don't own this class", status: 403 } as const;

  return { lesson } as const;
}

export async function PUT(request: Request, { params }: { params: Promise<{ trackId: string; lessonId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Only teachers can update lessons" }, { status: 403 });

    const { trackId, lessonId } = await params;
    const result = await verifyLessonOwnership(lessonId, trackId, user.prismaUser.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { title, description, lessonType, difficulty, xpReward, content, targetAttributes } = body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      updateData.title = title.trim();
    }
    if (description !== undefined) updateData.description = typeof description === "string" && description.trim().length > 0 ? description.trim() : null;
    if (lessonType !== undefined) {
      const validTypes = ["QUIZ", "YES_NO", "SHORT_ANSWER"];
      if (!validTypes.includes(lessonType)) return NextResponse.json({ error: "Invalid lessonType" }, { status: 400 });
      updateData.lesson_type = lessonType;
    }
    if (difficulty !== undefined) {
      const diff = Number(difficulty);
      if (diff < 1 || diff > 3) return NextResponse.json({ error: "difficulty must be 1, 2, or 3" }, { status: 400 });
      updateData.difficulty = diff;
    }
    if (xpReward !== undefined) updateData.xp_reward = Number(xpReward);
    if (content !== undefined) updateData.content = content;
    if (targetAttributes !== undefined) updateData.target_attributes = targetAttributes;

    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const updated = await prisma.lessons.update({ where: { id: lessonId }, data: updateData });
    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("Update lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ trackId: string; lessonId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Only teachers can delete lessons" }, { status: 403 });

    const { trackId, lessonId } = await params;
    const result = await verifyLessonOwnership(lessonId, trackId, user.prismaUser.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const deletedPosition = result.lesson.position;

    await prisma.lessons.delete({ where: { id: lessonId } });

    await prisma.$executeRaw`UPDATE lessons SET position = position - 1 WHERE track_id = ${trackId} AND position > ${deletedPosition}`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}