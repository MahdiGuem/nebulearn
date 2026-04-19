import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        tracks: {
          include: {
            subjects: {
              include: {
                classes: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const userEnrollment = await prisma.enrollments.findUnique({
      where: {
        class_id_user_id: {
          class_id: lesson.tracks.subjects.class_id,
          user_id: user.prismaUser.id,
        },
      },
    });

    if (!userEnrollment) {
      return NextResponse.json({ error: "Not enrolled in this class" }, { status: 403 });
    }

    const completion = await prisma.lesson_completions.findUnique({
      where: {
        lesson_id_user_id: {
          lesson_id: lessonId,
          user_id: user.prismaUser.id,
        },
      },
    });

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        lessonType: lesson.lesson_type,
        difficulty: lesson.difficulty,
        xpReward: lesson.xp_reward,
        content: lesson.content,
        trackId: lesson.track_id,
        trackName: lesson.tracks.name,
        subjectName: lesson.tracks.subjects.name,
        classId: lesson.tracks.subjects.class_id,
      },
      completion: completion ? {
        completedAt: completion.completed_at.toISOString(),
        finalScore: completion.final_score,
        attemptsCount: completion.attempts_count,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json({ error: "Failed to load lesson" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    const lesson = await prisma.lessons.findUnique({
      where: { id: lessonId },
      include: {
        tracks: {
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const userEnrollment = await prisma.enrollments.findUnique({
      where: {
        class_id_user_id: {
          class_id: lesson.tracks.subjects.class_id,
          user_id: user.prismaUser.id,
        },
      },
    });

    if (!userEnrollment) {
      return NextResponse.json({ error: "Not enrolled in this class" }, { status: 403 });
    }

    const body = await request.json();
    const { answer } = body;

    if (answer === undefined || answer === null || answer === "") {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    let isCorrect = false;
    let score = 0;
    let correctAnswer = "";

    const content = lesson.content as any;

    if (lesson.lesson_type === "QUIZ") {
      const options = content?.options || [];
      const answerIndex = parseInt(answer);
      const correctIndex = parseInt(content?.correctAnswer) || 0;
      console.log("QUIZ DEBUG:", { answer, answerIndex, correctIndex, options });
      isCorrect = !isNaN(answerIndex) && answerIndex === correctIndex;
      if (correctIndex >= 0 && correctIndex < options.length) {
        correctAnswer = options[correctIndex];
      } else {
        correctAnswer = String(content?.correctAnswer || "");
      }
      score = isCorrect ? 100 : 0;
    } else if (lesson.lesson_type === "YES_NO") {
      correctAnswer = String(content?.correctAnswer || "").toLowerCase();
      isCorrect = String(answer).trim().toLowerCase() === correctAnswer;
      score = isCorrect ? 100 : 0;
    } else if (lesson.lesson_type === "SHORT_ANSWER") {
      correctAnswer = String(content?.correctAnswer || "");
      const userAnswer = String(answer).trim().toLowerCase();
      const correct = correctAnswer;
      if (correctAnswer.includes("|")) {
        const options = correctAnswer.split("|").map((s: string) => s.trim().toLowerCase());
        isCorrect = options.includes(userAnswer);
      } else if (correctAnswer.includes(",")) {
        const options = correctAnswer.split(",").map((s: string) => s.trim().toLowerCase());
        isCorrect = options.some((opt: string) => userAnswer.includes(opt));
      } else {
        isCorrect = userAnswer.includes(correct);
      }
      score = isCorrect ? 100 : 70;
      if (!isCorrect && userAnswer.length > 0) {
        const similarity = calculateSimilarity(userAnswer, correct);
        score = Math.round(similarity * 70);
      }
    }

    const existingCompletion = await prisma.lesson_completions.findUnique({
      where: {
        lesson_id_user_id: {
          lesson_id: lessonId,
          user_id: user.prismaUser.id,
        },
      },
    });

    if (existingCompletion) {
      await prisma.lesson_completions.update({
        where: { id: existingCompletion.id },
        data: {
          final_score: score,
          completed_at: new Date(),
          attempts_count: existingCompletion.attempts_count + 1,
        },
      });
    } else {
      await prisma.lesson_completions.create({
        data: {
          id: crypto.randomUUID(),
          lesson_id: lessonId,
          user_id: user.prismaUser.id,
          final_score: score,
          completed_at: new Date(),
          attempts_count: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      score,
      correctAnswer,
      xpEarned: isCorrect ? lesson.xp_reward : Math.floor(lesson.xp_reward * score / 100),
    });
  } catch (error) {
    console.error("Error submitting lesson:", error);
    return NextResponse.json({ error: "Failed to submit lesson" }, { status: 500 });
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const intersection = words1.filter(word => words2.includes(word));
  return intersection.length / Math.max(words1.length, words2.length);
}