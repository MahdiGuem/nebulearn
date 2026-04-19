import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create lessons" }, { status: 403 });
    }

    const { trackId } = await params;

    const track = await prisma.tracks.findUnique({
      where: { id: trackId },
      include: { subjects: { include: { classes: true } } },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.subjects.classes.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "You don't own this track" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, lessonType, difficulty, content, targetAttributes } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const maxPosition = await prisma.lessons.aggregate({
      where: { track_id: trackId },
      _max: { position: true },
    });

    const xpReward = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 30;

    const lesson = await prisma.lessons.create({
      data: {
        id: crypto.randomUUID(),
        track_id: trackId,
        title: title.trim(),
        description: description?.trim() || null,
        lesson_type: lessonType || "QUIZ",
        difficulty: difficulty || 1,
        xp_reward: xpReward,
        position: (maxPosition._max?.position || 0) + 1,
        content: content || {},
        target_attributes: targetAttributes || [],
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error("Create lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  {params}: { params: Promise<{ trackId: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trackId } = await params;

  try {
    const track = await prisma.tracks.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const lessons = await prisma.lessons.findMany({
      where: { track_id: trackId },
      orderBy: { position: "asc" },
    });

    const completedLessons = await prisma.lesson_completions.findMany({
      where: {
        user_id: user.id,
        lesson_id: { in: lessons.map((l) => l.id) },
      },
    });

    const completedLessonIds = new Set(completedLessons.map((p) => p.lesson_id));

    const lessonsWithStatus = lessons.map((lesson) => ({
      id: lesson.id,
      position: lesson.position,
      title: lesson.title,
      description: lesson.description,
      lesson_type: lesson.lesson_type,
      difficulty: lesson.difficulty,
      xp_reward: lesson.xp_reward,
      target_attributes: lesson.target_attributes || [],
      isCompleted: completedLessonIds.has(lesson.id),
      finalScore: completedLessons.find((c) => c.lesson_id === lesson.id)?.final_score ?? null,
    }));

    let classmates: { id: string; firstName: string; lastName: string; initials: string; lastCompletedPosition: number }[] = [];

    if (user.role === "STUDENT") {
      const progress = await prisma.lesson_completions.findMany({
        where: {
          lesson_id: { in: lessons.map((l) => l.id) },
        },
        select: {
          user_id: true,
          lesson_id: true,
        },
      });

      const completedByLesson: Record<string, string> = {};
      for (const p of progress) {
        if (!completedByLesson[p.lesson_id]) {
          const lesson = lessons.find((l) => l.id === p.lesson_id);
          if (lesson) {
            completedByLesson[p.lesson_id] = p.user_id;
          }
        }
      }

      const otherUserIds = [...new Set(progress.map((p) => p.user_id).filter((id) => id !== user.id))];
      
      if (otherUserIds.length > 0) {
        const otherUsers = await prisma.users.findMany({
          where: { id: { in: otherUserIds } },
          select: { id: true, first_name: true, last_name: true },
        });

        classmates = otherUsers
          .map((u) => {
            const completedAtLessonId = Object.entries(completedByLesson).find(
              ([, userId]) => userId === u.id
            )?.[0];
            const completedLesson = lessons.find((l) => l.id === completedAtLessonId);
            
            return {
              id: u.id,
              firstName: u.first_name,
              lastName: u.last_name,
              initials: `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase(),
              lastCompletedPosition: completedLesson?.position || 0,
            };
          })
          .filter((c) => c.lastCompletedPosition > 0);
      }
    }

    return NextResponse.json({
      track: {
        id: track.id,
        name: track.name,
        description: track.description,
      },
      lessons: lessonsWithStatus,
      classmates,
    });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json({ error: "Failed to load track" }, { status: 500 });
  }
}