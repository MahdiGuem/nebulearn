import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const geminiFlash = google("gemini-2.5-flash");

export async function generateChatResponse(prompt: string) {
  const result = await streamText({
    model: geminiFlash,
    prompt,
    temperature: 0.7,
  });
  return result.text;
}
