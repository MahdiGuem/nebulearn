import { google, type GoogleEmbeddingModelOptions } from '@ai-sdk/google';
import { embedMany } from "ai";
import type { Chunk } from "../utils/chunker";

const embeddingModel = google.embedding("gemini-embedding-2-preview");

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[]; // 384-dimensional vector
}

export async function embedBatch(
  chunks: Chunk[]
): Promise<ChunkWithEmbedding[]> {
  try {
    // Generate embeddings for all chunks
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map((c) => c.content),
      providerOptions: {
        google: {
          outputDimensionality: 384
        } satisfies GoogleEmbeddingModelOptions,
      },
    });

    // Combine chunks with their embeddings
    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));
  } catch (error) {
    console.error("Embedding error:", error);
    throw new Error("Failed to generate embeddings");
  }
}

export async function embedText(text: string): Promise<number[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [text],
    providerOptions: {
    google: {
      outputDimensionality: 384,
    } satisfies GoogleEmbeddingModelOptions,
  },
  });
  return embeddings[0];
}
