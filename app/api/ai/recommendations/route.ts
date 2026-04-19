import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can get recommendations" },
        { status: 403 }
      );
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: user.prismaUser.id },
      select: { class_id: true },
    });

    const classIds = enrollments.map((e) => e.class_id);

    if (classIds.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const myCompletions = await prisma.lesson_completions.findMany({
      where: { user_id: user.prismaUser.id },
      select: { lesson_id: true },
    });
    const myLessonIds = new Set(myCompletions.map((c) => c.lesson_id));

    const classmates = await prisma.enrollments.findMany({
      where: {
        class_id: { in: classIds },
        user_id: { not: user.prismaUser.id },
      },
      select: { user_id: true },
    });
    const classmateIds = [...new Set(classmates.map((c) => c.user_id))];

    const classmateCompletions = await prisma.lesson_completions.findMany({
      where: {
        user_id: { in: classmateIds },
        lesson_id: { in: Array.from(myLessonIds) },
      },
      select: { lesson_id: true, user_id: true },
    });

    const completedLessonIds = new Set(classmateCompletions.map((c) => c.lesson_id));

    const tracksWithCompletions = await prisma.tracks.findMany({
      where: {
        is_published: true,
        lessons: {
          some: {
            id: { in: Array.from(completedLessonIds) },
          },
        },
      },
      include: {
        subjects: true,
      },
    });

    const subjectIds = [...new Set(tracksWithCompletions.map((t) => t.subject_id))];

    const classSubjects = await prisma.subjects.findMany({
      where: {
        id: { in: subjectIds },
        class_id: { in: classIds },
      },
      select: { id: true, class_id: true },
    });

    const subjectIdToClassId = new Map<string, string>();
    for (const cs of classSubjects) {
      subjectIdToClassId.set(cs.id, cs.class_id);
    }

    const validTrackIds = new Set(
      tracksWithCompletions
        .filter((t) => subjectIdToClassId.has(t.subject_id))
        .map((t) => t.id)
    );

    const validTracks = tracksWithCompletions.filter((t) => validTrackIds.has(t.id));

    const tracksWithCounts: { id: string; name: string; completions: number }[] = [];

    for (const track of validTracks) {
      const trackLessons = await prisma.lessons.findMany({
        where: { track_id: track.id },
        select: { id: true },
      });
      const trackLessonIds = new Set(trackLessons.map((l) => l.id));

      let completions = 0;
      for (const completion of classmateCompletions) {
        if (trackLessonIds.has(completion.lesson_id)) {
          completions++;
        }
      }

      if (completions > 0) {
        tracksWithCounts.push({
          id: track.id,
          name: track.name,
          completions,
        });
      }
    }

    tracksWithCounts.sort((a, b) => b.completions - a.completions);
    const recommendations = tracksWithCounts.slice(0, 5);

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}