import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create subjects" }, { status: 403 });
    }

    const { classId } = await params;

    const classData = await prisma.classes.findUnique({ where: { id: classId } });
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "You don't own this class" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    const subject = await prisma.subjects.create({
      data: {
        id: crypto.randomUUID(),
        class_id: classId,
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (err) {
    console.error("Create subject error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    const classData = await prisma.classes.findUnique({ where: { id: classId } });
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (user.prismaUser.role === "TEACHER" && classData.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (user.prismaUser.role === "STUDENT") {
      const enrollment = await prisma.enrollments.findUnique({
        where: { class_id_user_id: { class_id: classId, user_id: user.prismaUser.id } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const subjects = await prisma.subjects.findMany({
      where: { class_id: classId },
      include: { _count: { select: { courses: true, tracks: true } } },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (err) {
    console.error("List subjects error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}