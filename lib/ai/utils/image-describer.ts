import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const geminiVision = google("gemini-2.5-flash");

export interface ImageDescription {
  pageNumber: number;
  description: string;
}

export async function describeImageWithGemini(
  imageBuffer: Buffer,
  mimeType: string = "image/png"
): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString("base64");

    const result = await generateText({
      model: geminiVision,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail. If it's a diagram, chart, or table, explain what it shows and its key elements.",
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    return result.text;
  } catch (error) {
    console.error("Image description error:", error);
    return "[Visual content - description unavailable]";
  }
}

// Placeholder for extracting images from PDF pages
export async function extractImagesFromPage(
  pdfBuffer: Buffer,
  pageNumber: number
): Promise<Buffer[]> {
  //we'll skip actual image extraction and rely on text density detection for the mvp
  return [];
}
