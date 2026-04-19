import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/rbac";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/client";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    // Verify teacher authentication
    const teacher = await requireTeacher();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("pdf") as File;
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;
    const title = (formData.get("title") as string) || file.name;

    // Validation
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Size limit: 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileId = randomUUID();
    const teacherId = teacher.id;
    const classIdOrFallback = classId || teacherId;

    // Organized path: teacher_id/class_id/uuid.pdf
    const filePath = `${teacherId}/${classIdOrFallback}/${fileId}.pdf`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from("materials")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from("materials")
      .getPublicUrl(filePath);

    // Create document record
    const doc = await prisma.documents.create({
      data: {
        title,
        pdf_url: publicUrl,
        teacher_id: teacherId,
        class_id: classIdOrFallback,
        subject_id: subjectId || teacherId,
        status: "queued",
        progress: 0,
      },
    });

    // Trigger async processing with public URL
    await inngest.send({
      name: "pdf/uploaded",
      data: {
        documentId: doc.id,
        pdfUrl: publicUrl, // Public HTTP URL - works with fetch()
        teacherId: teacherId,
        classId: classIdOrFallback,
        subjectId: subjectId || teacherId,
        title,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      status: "queued",
      message: "PDF uploaded successfully. Processing will begin shortly.",
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error && error.message.includes("redirect")) {
      // Auth redirect - return 401
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
