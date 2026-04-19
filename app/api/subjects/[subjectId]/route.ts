import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ subjectId: string }> };

async function verifySubjectOwnership(subjectId: string, userId: string) {
  const subject = await prisma.subjects.findUnique({
    where: { id: subjectId },
    include: { classes: { select: { teacher_id: true } } },
  });

  if (!subject) return { error: "Subject not found", status: 404 } as const;
  if (subject.classes.teacher_id !== userId) return { error: "You don't own this class", status: 403 } as const;

  return { subject } as const;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update subjects" }, { status: 403 });
    }

    const { subjectId } = await params;
    const result = await verifySubjectOwnership(subjectId, user.prismaUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { name, description } = body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Subject name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = typeof description === "string" && description.trim().length > 0 ? description.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.subjects.update({ where: { id: subjectId }, data: updateData });
    return NextResponse.json({ subject: updated });
  } catch (err) {
    console.error("Update subject error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can delete subjects" }, { status: 403 });
    }

    const { subjectId } = await params;
    const result = await verifySubjectOwnership(subjectId, user.prismaUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.subjects.delete({ where: { id: subjectId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete subject error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}