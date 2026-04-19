import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ classId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    const classData = await prisma.classes.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          orderBy: { joined_at: "desc" },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacher_id === user.prismaUser.id) {
      return NextResponse.json({ class: classData });
    }

    const enrollment = await prisma.enrollments.findUnique({
      where: {
        class_id_user_id: { class_id: classId, user_id: user.prismaUser.id },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { enrollments, ...classWithoutMembers } = classData;
    return NextResponse.json({ class: classWithoutMembers });
  } catch (err) {
    console.error("Get class error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update classes" }, { status: 403 });
    }

    const { classId } = await params;

    const existing = await prisma.classes.findUnique({
      where: { id: classId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existing.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Class name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = typeof description === "string" && description.trim().length > 0 ? description.trim() : null;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
      }
      updateData.is_active = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.classes.update({
      where: { id: classId },
      data: updateData,
      include: { _count: { select: { enrollments: true } } },
    });

    return NextResponse.json({ class: updated });
  } catch (err) {
    console.error("Update class error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}