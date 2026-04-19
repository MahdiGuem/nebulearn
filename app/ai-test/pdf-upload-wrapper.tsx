"use client";

import { useState } from "react";
import PdfUpload from "./pdf-upload";
import QuizGenerator from "./quiz-generator";

export default function PdfUploadWrapper() {
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(
    null
  );

  const handleUploadComplete = (documentId: string) => {
    setUploadedDocumentId(documentId);
  };

  return (
    <div className="space-y-8">
      {/* PDF Upload Section */}
      <PdfUpload onUploadComplete={handleUploadComplete} />

      {/* Quiz Generator Section */}
      {uploadedDocumentId && (
        <QuizGenerator documentId={uploadedDocumentId} />
      )}

      {/* Instructions */}
      {!uploadedDocumentId && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6">
          <h3 className="mb-2 text-lg font-medium text-gray-800">
            How to Test
          </h3>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Upload a PDF above (max 50MB)</li>
            <li>Wait for processing to complete</li>
            <li>Generate a quiz from the processed document</li>
          </ol>
        </div>
      )}
    </div>
  );
}
