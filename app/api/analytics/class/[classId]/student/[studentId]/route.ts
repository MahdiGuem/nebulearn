import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string; studentId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const { classId, studentId } = await params;

    const cls = await prisma.classes.findUnique({ where: { id: classId }, select: { teacher_id: true } });
    if (!cls || cls.teacher_id !== user.prismaUser.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const enrollment = await prisma.enrollments.findUnique({
      where: { class_id_user_id: { class_id: classId, user_id: studentId } },
      include: { users: true },
    });
    if (!enrollment) return NextResponse.json({ error: "Student not in class" }, { status: 404 });

    const subjects = await prisma.subjects.findMany({ where: { class_id: classId }, select: { id: true } });
    const subjectIds = subjects.map(s => s.id);

    const tracks = await prisma.tracks.findMany({ where: { subject_id: { in: subjectIds } }, select: { id: true } });
    const trackIds = tracks.map(t => t.id);

    const lessons = await prisma.lessons.findMany({ where: { track_id: { in: trackIds } }, select: { id: true, title: true, track_id: true, lesson_type: true, difficulty: true, xp_reward: true } });
    const lessonIds = lessons.map(l => l.id);

    const completions = await prisma.lesson_completions.findMany({
      where: { lesson_id: { in: lessonIds }, user_id: studentId },
    });
    const attempts = await prisma.lesson_attempts.findMany({
      where: { lesson_id: { in: lessonIds }, user_id: studentId },
      orderBy: { attempted_at: "desc" },
    });

    const completedLessonIds = new Set(completions.map(c => c.lesson_id));

    const lessonProgress = lessons.map(l => ({
      ...l,
      isCompleted: completedLessonIds.has(l.id),
      attempts: attempts.filter(a => a.lesson_id === l.id).length,
    }));

    return NextResponse.json({
      student: {
        id: enrollment.user_id,
        firstName: enrollment.users.first_name,
        lastName: enrollment.users.last_name,
        email: enrollment.users.email,
        joinedAt: enrollment.joined_at.toISOString(),
      },
      overview: {
        lessonsCompleted: completions.length,
        totalAttempts: attempts.length,
        avgScore: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length) : 0,
      },
      lessonProgress,
    });
  } catch (err) {
    console.error("Student analytics error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}