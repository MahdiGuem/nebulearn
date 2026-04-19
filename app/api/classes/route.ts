import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await prisma.classes.findUnique({
      where: { invite_code: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique invite code");
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create classes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    const inviteCode = await generateUniqueInviteCode();

    const newClass = await prisma.classes.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description?.trim() || null,
        teacher_id: user.prismaUser.id,
        invite_code: inviteCode,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (err) {
    console.error("Create class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.prismaUser.role === "TEACHER") {
      const classes = await prisma.classes.findMany({
        where: { teacher_id: user.prismaUser.id },
        include: {
          _count: { select: { enrollments: true } },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json({ classes });
    }

    // Student: get enrolled classes
    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: user.id },
      include: {
        classes: {
          include: {
            users: { select: { first_name: true, last_name: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });

    const classData = enrollments.map((e) => ({
      id: e.classes.id,
      name: e.classes.name,
      description: e.classes.description,
      isActive: e.classes.is_active,
      createdAt: e.classes.created_at.toISOString(),
      enrollmentType: e.enrollment_type,
      joinedAt: e.joined_at.toISOString(),
      teacher: {
        first_name: e.classes.users.first_name,
        last_name: e.classes.users.last_name,
      },
      _count: { enrollments: e.classes._count.enrollments },
    }));

    return NextResponse.json({ classes: classData });
  } catch (err) {
    console.error("List classes error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}