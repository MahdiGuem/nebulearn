import { inngest } from "../client";
import prisma from "@/lib/prisma";
import {
  extractTextFromPdf,
  detectVisualPages,
} from "@/lib/ai/utils/pdf-extractor";
import { smartChunk, chunkBatches } from "@/lib/ai/utils/chunker";
import { embedBatch } from "@/lib/ai/services/embedder";
import type { Chunk } from "@/lib/ai/utils/chunker";

export const processPdfFunction = inngest.createFunction(
  {
    id: "process-pdf",
    name: "Process PDF Document",
    triggers: [{ event: "pdf/uploaded" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { documentId, pdfUrl } = event.data as {
      documentId: string;
      pdfUrl: string;
    };

    // Download and process in one step to avoid serialization issues
    const { chunks, totalChunks } = await step.run("process-pdf", async () => {
      // Download PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }
      const pdfBuffer = Buffer.from(await response.arrayBuffer());

      await updateDocumentProgress(documentId, 10, "extracting");

      // Extract text
      const extracted = await extractTextFromPdf(pdfBuffer);

      await updateDocumentProgress(documentId, 30, "analyzing");

      // Detect visual-heavy pages
      const pagesWithVisuals = detectVisualPages(extracted.pages);

      // Create visual descriptions
      const visualPages = pagesWithVisuals.filter((p) => p.hasImages);
      const visualDescriptions = visualPages.map((page) => ({
        type: "image_desc" as const,
        content: `[Visual content on page ${page.pageNumber}: Diagram or image detected. Text extracted: "${page.text.slice(0, 200)}..."]`,
        page: page.pageNumber,
        section: undefined,
      }));

      await updateDocumentProgress(documentId, 60, "chunking");

      // Prepare content
      const textContent = pagesWithVisuals.map((page) => ({
        type: "text" as const,
        content: page.text,
        page: page.pageNumber,
        section: undefined,
      }));

      const allContent = [...textContent, ...visualDescriptions];

      // Chunk
      const chunks = smartChunk(allContent, {
        size: 1000,
        overlap: 100,
        respectBoundaries: true,
      });

      return { chunks, totalChunks: chunks.length };
    });

    // Step 2: Embed and store
    await step.run("embed-and-store", async () => {
      await updateDocumentProgress(documentId, 70, "embedding");

      const batches = chunkBatches(chunks, 100);
      let completedBatches = 0;

      for (const batch of batches) {
        const chunksWithEmbeddings = await embedBatch(batch);
        await storeChunks(documentId, chunksWithEmbeddings);

        completedBatches++;
        const progress = 70 + Math.floor((completedBatches / batches.length) * 30);
        await updateDocumentProgress(documentId, progress, "embedding");
      }

      await updateDocumentProgress(documentId, 100, "complete");
    });

    return {
      documentId,
      status: "ready",
      chunksCreated: totalChunks,
    };
  }
);

// Helper functions
async function updateDocumentProgress(
  documentId: string,
  progress: number,
  stage: string
): Promise<void> {
  await prisma.documents.update({
    where: { id: documentId },
    data: { progress, status: stage === "complete" ? "ready" : "processing" },
  });

  await inngest.send({
    name: "pdf/progress",
    data: {
      documentId,
      progress,
      stage,
      message: getStageMessage(stage),
    },
  });
}

function getStageMessage(stage: string): string {
  const messages: Record<string, string> = {
    extracting: "Extracting text from PDF...",
    analyzing: "Analyzing visual content...",
    chunking: "Splitting content into chunks...",
    embedding: "Creating semantic embeddings...",
    complete: "Processing complete!",
  };
  return messages[stage] || "Processing...";
}

async function storeChunks(
  documentId: string,
  chunks: Array<Chunk & { embedding: number[] }>
): Promise<void> {
  for (const chunk of chunks) {
    // Convert embedding array to PostgreSQL vector literal: [val1,val2,...]
    const vectorLiteral = `[${chunk.embedding.join(',')}]`;
    // Escape single quotes in content by doubling them
    const escapedContent = chunk.content.replace(/'/g, "''");
    const escapedContentType = chunk.contentType.replace(/'/g, "''");
    const escapedSection = chunk.section ? chunk.section.replace(/'/g, "''") : null;
    
    const sql = `
      INSERT INTO chunks (id, document_id, content, content_type, page_number, section, embedding)
      VALUES (
        gen_random_uuid(),
        '${documentId}'::uuid,
        '${escapedContent}',
        '${escapedContentType}',
        ${chunk.pageNumber},
        ${escapedSection === null ? 'NULL' : `'${escapedSection}'`},
        '${vectorLiteral}'::vector
      )
    `;
    await prisma.$executeRawUnsafe(sql);
  }
}
