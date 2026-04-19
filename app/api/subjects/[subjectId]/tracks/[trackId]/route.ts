import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function verifyTrackOwnership(trackId: string, subjectId: string, userId: string) {
  const track = await prisma.tracks.findUnique({
    where: { id: trackId },
    include: { subjects: { include: { classes: { select: { teacher_id: true } } } } },
  });

  if (!track || track.subject_id !== subjectId) return { error: "Track not found", status: 404 } as const;
  if (track.subjects.classes.teacher_id !== userId) return { error: "You don't own this class", status: 403 } as const;

  return { track } as const;
}

export async function PUT(request: Request, { params }: { params: Promise<{ subjectId: string; trackId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Only teachers can update tracks" }, { status: 403 });

    const { subjectId, trackId } = await params;
    const result = await verifyTrackOwnership(trackId, subjectId, user.prismaUser.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { name, description, isPublished } = body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) return NextResponse.json({ error: "Track name cannot be empty" }, { status: 400 });
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = typeof description === "string" && description.trim().length > 0 ? description.trim() : null;
    if (isPublished !== undefined) {
      if (typeof isPublished !== "boolean") return NextResponse.json({ error: "isPublished must be a boolean" }, { status: 400 });
      updateData.is_published = isPublished;
    }

    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const updated = await prisma.tracks.update({ where: { id: trackId }, data: updateData });
    return NextResponse.json({ track: updated });
  } catch (err) {
    console.error("Update track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ subjectId: string; trackId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.prismaUser.role !== "TEACHER") return NextResponse.json({ error: "Only teachers can delete tracks" }, { status: 403 });

    const { subjectId, trackId } = await params;
    const result = await verifyTrackOwnership(trackId, subjectId, user.prismaUser.id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await prisma.tracks.delete({ where: { id: trackId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}