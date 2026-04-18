import { generateChatResponse } from "@/lib/ai/client";
import { requireAuth } from "@/lib/rbac";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await generateChatResponse(prompt);

    return NextResponse.json({
      response,
      user: `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI test error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
