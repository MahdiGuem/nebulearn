import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Only teachers can create tracks" }, { status: 403 });

    const { subjectId } = await params;

    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: { classes: { select: { teacher_id: true, id: true } } },
    });

    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    if (subject.classes.teacher_id !== user.prismaUser.id) return NextResponse.json({ error: "You don't own this class" }, { status: 403 });

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) return NextResponse.json({ error: "Track name is required" }, { status: 400 });

    const track = await prisma.tracks.create({
      data: {
        id: crypto.randomUUID(),
        subject_id: subjectId,
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (err) {
    console.error("Create track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId } = await params;

    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: { classes: { select: { teacher_id: true, id: true } } },
    });

    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const isTeacherOwner = subject.classes.teacher_id === user.prismaUser.id;
    if (!isTeacherOwner && user.prismaUser.role === "STUDENT") {
      const enrollment = await prisma.enrollments.findUnique({
        where: { class_id_user_id: { class_id: subject.classes.id, user_id: user.prismaUser.id } },
      });
      if (!enrollment) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tracks = await prisma.tracks.findMany({
      where: { subject_id: subjectId, ...(isTeacherOwner ? {} : { is_published: true }) },
      include: { _count: { select: { lessons: true } } },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("List tracks error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}