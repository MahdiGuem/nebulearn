import { useState } from 'react';

export function FileUploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-[24px] nebula-glow"></div>
      <div
        className={`relative glassmorphic-card rounded-[24px] p-8 border-2 transition-all duration-300 ${
          isDragging ? 'border-purple-400/80 scale-[1.02]' : 'border-purple-500/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-6 min-h-[280px]">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-500/20 to-indigo-600/20 p-6 rounded-full border border-purple-400/30 shadow-3d">
              <span className="text-purple-300 text-4xl">📤</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-purple-100 tracking-wide">Upload Your Files</h3>
            <p className="text-purple-300/70 text-sm">
              Drag and drop or click to browse
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
          />
          <label
            htmlFor="file-upload"
            className="cosmic-button px-8 py-3 rounded-[16px] cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Select File
          </label>

          {uploadedFile && (
            <div className="mt-4 px-6 py-3 rounded-[16px] bg-purple-500/10 border border-purple-400/20 backdrop-blur-sm">
              <p className="text-purple-200 text-sm">{uploadedFile}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
