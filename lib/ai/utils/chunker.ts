export interface Chunk {
  content: string;
  pageNumber: number;
  section?: string;
  contentType: "text" | "image_desc" | "table_desc" | "diagram_desc";
}

export interface ChunkOptions {
  size: number; // Target chunk size in characters
  overlap: number; // Overlap between chunks
  respectBoundaries: boolean; // Don't split sentences/paragraphs
}

const defaultOptions: ChunkOptions = {
  size: 1000,
  overlap: 100,
  respectBoundaries: true,
};

export function smartChunk(
  content: Array<{
    type: "text" | "image_desc" | "table_desc";
    content: string;
    page: number;
    section?: string;
  }>,
  options: Partial<ChunkOptions> = {}
): Chunk[] {
  const opts = { ...defaultOptions, ...options };
  const chunks: Chunk[] = [];

  for (const item of content) {
    if (item.content.length <= opts.size) {
      // Content fits in single chunk
      chunks.push({
        content: item.content,
        pageNumber: item.page,
        section: item.section,
        contentType: item.type,
      });
    } else {
      // Split into overlapping chunks
      const splitChunks = splitWithOverlap(
        item.content,
        item.page,
        item.section,
        item.type,
        opts
      );
      chunks.push(...splitChunks);
    }
  }

  return chunks;
}

function splitWithOverlap(
  text: string,
  page: number,
  section: string | undefined,
  type: Chunk["contentType"],
  opts: ChunkOptions
): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + opts.size, text.length);

    if (opts.respectBoundaries && end < text.length) {
      // Find sentence or paragraph boundary
      const boundaryChars = [".\n", ". ", "\n\n", "\n"];
      for (const boundary of boundaryChars) {
        const boundaryIndex = text.lastIndexOf(boundary, end);
        if (boundaryIndex > start) {
          end = boundaryIndex + boundary.length;
          break;
        }
      }
    }

    chunks.push({
      content: text.slice(start, end).trim(),
      pageNumber: page,
      section,
      contentType: type,
    });

    // Move start forward with overlap
    start = Math.max(start + opts.size - opts.overlap, end);
  }

  return chunks;
}

// Group chunks into batches for embedding
export function chunkBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
