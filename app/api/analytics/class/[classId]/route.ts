import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const { classId } = await params;

    const cls = await prisma.classes.findUnique({ where: { id: classId }, select: { id: true, name: true, teacher_id: true } });
    if (!cls || cls.teacher_id !== user.prismaUser.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const subjects = await prisma.subjects.findMany({ where: { class_id: classId }, select: { id: true } });
    const subjectIds = subjects.map(s => s.id);

    const tracks = await prisma.tracks.findMany({ where: { subject_id: { in: subjectIds } }, select: { id: true } });
    const trackIds = tracks.map(t => t.id);

    const lessons = await prisma.lessons.findMany({ where: { track_id: { in: trackIds } } });
    const lessonIds = lessons.map(l => l.id);

    const enrollments = await prisma.enrollments.findMany({
      where: { class_id: classId },
      include: { users: { select: { id: true, first_name: true, last_name: true, email: true, avatar_url: true } } },
    });

    const completions = await prisma.lesson_completions.findMany({ where: { lesson_id: { in: lessonIds } } });
    const attempts = await prisma.lesson_attempts.findMany({ where: { lesson_id: { in: lessonIds } } });

    const totalLessons = lessons.length;
    const totalStudents = enrollments.length;

    const completionsByUser = new Map<string, number>();
    const scoresByUser = new Map<string, number[]>();

    for (const c of completions) {
      completionsByUser.set(c.user_id, (completionsByUser.get(c.user_id) ?? 0) + 1);
    }
    for (const a of attempts) {
      const arr = scoresByUser.get(a.user_id) ?? [];
      arr.push(a.score ?? 0);
      scoresByUser.set(a.user_id, arr);
    }

    const students = enrollments.map(e => {
      const completed = completionsByUser.get(e.user_id) ?? 0;
      const scores = scoresByUser.get(e.user_id) ?? [];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
      const completionPct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

      return {
        id: e.user_id,
        firstName: e.users.first_name,
        lastName: e.users.last_name,
        email: e.users.email,
        avatarUrl: e.users.avatar_url,
        lessonsCompleted: completed,
        completionPercent: completionPct,
        avgScore,
        totalAttempts: scores.length,
      };
    });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const classAvgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts) : 0;

    return NextResponse.json({
      className: cls.name,
      overview: { totalStudents, totalLessons, totalAttempts, correctAttempts, classAvgScore },
      students,
    });
  } catch (err) {
    console.error("Class analytics error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}