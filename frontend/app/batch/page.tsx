"use client";

import { useState, useRef, DragEvent } from "react";

const API = "https://zapp-production-be5d.up.railway.app";

export default function BatchPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(
      (f) =>
        f.type.startsWith("audio/") ||
        f.name.endsWith(".wav") ||
        f.name.endsWith(".mp3")
    );
    setFiles((prev) => [...prev, ...arr]);
    setDone(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setDone(false);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`${API}/batch`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // Download the returned CSV
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      console.error("Batch failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
            Batch Identification
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto">
            Upload multiple audio files at once. Results are returned as a
            downloadable CSV.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone glass-card p-8 text-center cursor-pointer mb-6 transition-all duration-300 ${
            dragOver ? "drag-over" : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".wav,.mp3,audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
            }}
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                dragOver ? "bg-accent/20 scale-110" : "bg-surface"
              }`}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={dragOver ? "text-accent" : "text-muted"}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop audio files or{" "}
                <span className="text-accent underline underline-offset-2">
                  browse
                </span>
              </p>
              <p className="text-xs text-muted mt-1">
                WAV or MP3 — select multiple
              </p>
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="glass-card p-5 mb-6 animate-float-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-muted hover:text-danger transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-surface/60 hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-accent flex-shrink-0"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted flex-shrink-0">
                      {formatSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all ml-2"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || uploading}
            className="btn-primary flex items-center gap-2 text-base px-8 py-3"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin-slow w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                Run Batch
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        {done && (
          <div className="mt-6 glass-card p-5 border-success/20 animate-float-up text-center">
            <div className="flex items-center justify-center gap-2 text-success">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="font-semibold">
                results.csv downloaded successfully
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              Check your Downloads folder for the results file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
