"use client";

import { useState } from "react";

interface PdfUploadProps {
  onUploadComplete?: (documentId: string) => void;
}

export default function PdfUpload({ onUploadComplete }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus("");
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("title", file.name);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDocumentId(data.documentId);
      setStatus("Processing started...");

      // Start polling for progress
      pollProgress(data.documentId);

      if (onUploadComplete) {
        onUploadComplete(data.documentId);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const pollProgress = async (docId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/documents/progress?documentId=${docId}`
        );
        const data = await response.json();

        if (data.document) {
          setProgress(data.document.progress);
          setStatus(
            data.document.status === "ready"
              ? "Ready!"
              : data.document.status === "error"
              ? `Error: ${data.document.errorMessage}`
              : `Processing: ${data.document.status}`
          );

          if (data.document.status === "ready" || data.document.status === "error") {
            return; // Stop polling
          }
        }

        // Continue polling
        setTimeout(() => poll(), 2000);
      } catch (error) {
        console.error("Progress poll error:", error);
      }
    };

    poll();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Upload Study Material
      </h3>

      <div className="space-y-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:rounded-md file:border-0
            file:bg-blue-50 file:px-4 file:py-2
            file:text-sm file:font-semibold file:text-blue-700
            hover:file:bg-blue-100 disabled:opacity-50"
        />

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full rounded-md bg-blue-600 px-4 py-2
            font-medium text-white hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>

        {(uploading || progress > 0) && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              {status} ({progress}%)
            </div>
          </div>
        )}

        {status === "Ready!" && documentId && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            PDF processed successfully! Ready for quiz generation.
          </div>
        )}
      </div>
    </div>
  );
}
