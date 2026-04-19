import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { geminiFlash } from "../client";
import { embedText } from "./embedder";
import type { Chunk } from "../utils/chunker";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
  metadata: {
    documentId: string;
    topics: string[];
    totalChunks: number;
    generatedAt: string;
  };
}

interface RetrievedChunk extends Chunk {
  similarity: number;
}

export async function generateQuiz(
  documentId: string,
  topic?: string
): Promise<GeneratedQuiz> {
  // Step 1: Get query embedding
  const queryText = topic || "Generate quiz questions";
  const queryEmbedding = await embedText(queryText);

  // Step 2: Retrieve chunks with diversity
  const diverseChunks = await retrieveDiverseChunks(
    documentId,
    queryEmbedding,
    5 // Top 5 diverse chunks
  );

  // Step 3: Build prompt with context
  const prompt = buildQuizPrompt(diverseChunks);

  // Step 4: Generate quiz with LLM
  const result = await generateText({
    model: geminiFlash,
    prompt,
    temperature: 0.7,
  });

  // Step 5: Parse and validate
  const questions = parseQuizResponse(result.text);

  return {
    questions,
    metadata: {
      documentId,
      topics: extractTopics(diverseChunks),
      totalChunks: diverseChunks.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

async function retrieveDiverseChunks(
  documentId: string,
  queryEmbedding: number[],
  count: number
): Promise<RetrievedChunk[]> {
  // Convert embedding array to PostgreSQL vector literal format: [val1,val2,...]
  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  // Step 1: Over-fetch top 20 similar chunks
  const similarChunks = await prisma.$queryRaw<
    Array<{
      id: string;
      content: string;
      content_type: string;
      page_number: number;
      section: string | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      content,
      content_type,
      page_number,
      section,
      1 - (embedding <=> ${vectorLiteral}::vector) as similarity
    FROM chunks
    WHERE document_id = ${documentId}::uuid
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT 20
  `;

  if (similarChunks.length === 0) {
    throw new Error("No content found in document");
  }

  // Step 2: Group by page range (every 10 pages = different section)
  const groupedBySection = new Map<number, typeof similarChunks>();

  for (const chunk of similarChunks) {
    const sectionKey = Math.floor(chunk.page_number / 10);
    if (!groupedBySection.has(sectionKey)) {
      groupedBySection.set(sectionKey, []);
    }
    groupedBySection.get(sectionKey)!.push(chunk);
  }

  // Step 3: Select top chunk from each section (up to `count` sections)
  const selectedChunks: RetrievedChunk[] = [];
  const sections = Array.from(groupedBySection.values());

  for (let i = 0; i < Math.min(count, sections.length); i++) {
    const section = sections[i];
    const topChunk = section[0]; // Highest similarity in this section

    selectedChunks.push({
      content: topChunk.content,
      pageNumber: topChunk.page_number,
      section: topChunk.section || undefined,
      contentType: topChunk.content_type as Chunk["contentType"],
      similarity: topChunk.similarity,
    });
  }

  return selectedChunks;
}

function buildQuizPrompt(chunks: RetrievedChunk[]): string {
  // Build context with metadata
  const context = chunks
    .map(
      (chunk) => `---
Source: Page ${chunk.pageNumber}${chunk.section ? `, Section: ${chunk.section}` : ""}
Type: ${chunk.contentType}
Content: ${chunk.content}
---`
    )
    .join("\n\n");

  return `You are an expert educator creating assessment questions.

Task: Generate exactly 5 multiple-choice questions based on the study materials provided below.

Requirements:
- Test conceptual understanding, not just memorization
- Each question must have 4 options (A, B, C, D)
- Include one clearly correct answer
- Provide a brief explanation for why the correct answer is right
- Questions should reference specific content from the materials
- Cover diverse topics from the provided context

Format: Return STRICT JSON in this exact format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}

Study Materials:
${context}

Generate the quiz now:`;
}

function parseQuizResponse(response: string): QuizQuestion[] {
  try {
    // Clean potential markdown
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format");
    }

    // Validate each question
    const validQuestions = parsed.questions.filter(
      (q: any) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.explanation
    );

    return validQuestions.slice(0, 5); // Ensure max 5 questions
  } catch (error) {
    console.error("Failed to parse quiz response:", error);
    console.error("Raw response:", response);

    // Return fallback question if parsing fails
    return [
      {
        question:
          "Failed to generate quiz. Please try again with different materials.",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0,
        explanation: "The AI generated an invalid response format.",
      },
    ];
  }
}

function extractTopics(chunks: RetrievedChunk[]): string[] {
  // Simple topic extraction from section headers
  const topics = new Set<string>();

  for (const chunk of chunks) {
    if (chunk.section) {
      topics.add(chunk.section);
    }
  }

  return Array.from(topics);
}

// Retry wrapper for failed generations
export async function generateQuizWithRetry(
  documentId: string,
  topic?: string,
  maxRetries: number = 2
): Promise<GeneratedQuiz> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateQuiz(documentId, topic);
    } catch (error) {
      lastError = error as Error;
      console.error(`Quiz generation attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to generate quiz after retries");
}
