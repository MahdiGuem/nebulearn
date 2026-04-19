import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.prismaUser.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can view tracks" }, { status: 403 });
  }

  const { classId } = await params;

  try {
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        class_id_user_id: {
          class_id: classId,
          user_id: user.prismaUser.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this class" }, { status: 403 });
    }

    const subjects = await prisma.subjects.findMany({
      where: { class_id: classId },
      include: {
        tracks: {
          include: {
            _count: { select: { lessons: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const tracksBySubject = subjects.map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectDescription: subject.description,
      tracks: subject.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        description: track.description,
        lessonCount: track._count.lessons,
      })),
    }));

    return NextResponse.json({ tracksBySubject });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json({ error: "Failed to load tracks" }, { status: 500 });
  }
}