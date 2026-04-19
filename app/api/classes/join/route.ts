import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can join classes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== "string" || inviteCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const classItem = await prisma.classes.findUnique({
      where: { invite_code: inviteCode.trim().toUpperCase() },
    });

    if (!classItem) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    if (!classItem.is_active) {
      return NextResponse.json(
        { error: "This class is no longer active" },
        { status: 400 }
      );
    }

    const existingEnrollment = await prisma.enrollments.findUnique({
      where: {
        class_id_user_id: {
          class_id: classItem.id,
          user_id: user.prismaUser.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this class" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollments.create({
      data: {
        id: crypto.randomUUID(),
        class_id: classItem.id,
        user_id: user.prismaUser.id,
        enrollment_type: "STUDENT",
      },
    });

    return NextResponse.json(
      { class: { id: classItem.id, name: classItem.name }, enrollment },
      { status: 201 }
    );
  } catch (err) {
    console.error("Join class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}