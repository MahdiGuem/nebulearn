import PDFParser from "pdf2json";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  hasImages: boolean;
  textDensity: number;
}

export interface ExtractedPdf {
  text: string;
  pages: ExtractedPage[];
  numPages: number;
}

export async function extractTextFromPdf(
  pdfBuffer: Buffer
): Promise<ExtractedPdf> {
  try {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const pages: ExtractedPage[] = [];
        let fullText = "";

        // pdf2json returns data in Pages array
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page: any, index: number) => {
            let pageText = "";

            // Extract text from each text element
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((textItem: any) => {
                if (textItem.R && Array.isArray(textItem.R)) {
                  textItem.R.forEach((r: any) => {
                    if (r.T) {
                      // Decode URI-encoded text
                      try {
                        pageText += decodeURIComponent(r.T) + " ";
                      } catch {
                        pageText += r.T + " ";
                      }
                    }
                  });
                }
              });
            }

            const cleanText = pageText.trim();
            pages.push({
              pageNumber: index + 1,
              text: cleanText,
              hasImages: false,
              textDensity: cleanText.length,
            });

            fullText += cleanText + "\n\n";
          });
        }

        resolve({
          text: fullText.trim(),
          pages,
          numPages: pages.length,
        });
      });

      pdfParser.on("pdfParser_dataError", (error: any) => {
        reject(new Error(`PDF parsing error: ${error?.parserError || "Unknown error"}`));
      });

      // Parse the PDF buffer
      pdfParser.parseBuffer(pdfBuffer);
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Detect visual-heavy pages (low text density)
export function detectVisualPages(pages: ExtractedPage[]): ExtractedPage[] {
  const avgTextDensity =
    pages.reduce((sum, p) => sum + p.textDensity, 0) / pages.length || 1;

  return pages.map((page) => ({
    ...page,
    // Mark as visual-heavy if significantly below average
    hasImages:
      page.textDensity < avgTextDensity * 0.5 || page.textDensity < 300,
  }));
}
