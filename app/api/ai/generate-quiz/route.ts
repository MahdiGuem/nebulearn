import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { generateQuizWithRetry } from "@/lib/ai/services/quiz-generator";

export async function POST(request: Request) {
  try {
    // Verify teacher authentication
    const teacher = await requireTeacher();

    // Parse request
    const { documentId, topic } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verify document exists and belongs to teacher
    const document = await prisma.documents.findFirst({
      where: {
        id: documentId,
        teacher_id: teacher.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check document is ready
    if (document.status !== "ready") {
      return NextResponse.json(
        {
          error: "Document is not ready",
          status: document.status,
          progress: document.progress,
        },
        { status: 400 }
      );
    }

    // Generate quiz with retry logic
    const quiz = await generateQuizWithRetry(documentId, topic);

    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    if (error instanceof Error && error.message.includes("redirect")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
