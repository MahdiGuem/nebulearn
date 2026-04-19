import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "courses");

export async function POST(request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.prismaUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can upload courses" }, { status: 403 });
    }

    const { subjectId } = await params;

    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: { classes: { select: { teacher_id: true } } },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    if (subject.classes.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "You don't own this class" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 10 MB" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const fileId = crypto.randomUUID();
    const ext = path.extname(file.name) || ".pdf";
    const savedFilename = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, savedFilename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const pdfUrl = `/uploads/courses/${savedFilename}`;

    const course = await prisma.courses.create({
      data: {
        id: fileId,
        subject_id: subjectId,
        title: title.trim(),
        pdf_url: pdfUrl,
        pdf_filename: file.name,
        file_size: file.size,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    console.error("Upload course error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId } = await params;

    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: { classes: { select: { teacher_id: true, id: true } } },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (user.prismaUser.role === "TEACHER" && subject.classes.teacher_id !== user.prismaUser.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (user.prismaUser.role === "STUDENT") {
      const enrollment = await prisma.enrollments.findUnique({
        where: { class_id_user_id: { class_id: subject.classes.id, user_id: user.prismaUser.id } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const courses = await prisma.courses.findMany({
      where: { subject_id: subjectId },
      orderBy: { uploaded_at: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("List courses error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}