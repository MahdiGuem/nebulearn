import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    // Verify authentication
    const user = await requireAuth();

    // Get documentId from query params
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document status
    const document = await prisma.documents.findFirst({
      where: {
        id: documentId,
        teacher_id: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        error_message: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        status: document.status,
        progress: document.progress,
        errorMessage: document.error_message,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      },
    });
  } catch (error) {
    console.error("Progress check error:", error);

    if (error instanceof Error && error.message.includes("redirect")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to get document status" },
      { status: 500 }
    );
  }
}
