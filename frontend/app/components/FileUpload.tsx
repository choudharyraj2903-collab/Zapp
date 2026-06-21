"use client";

import { useState, useRef, DragEvent } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

export default function FileUpload({ onFileSelected, loading }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    onFileSelected(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  return (
    <div
      className={`drop-zone glass-card p-8 text-center cursor-pointer transition-all duration-300 ${
        dragOver ? "drag-over" : ""
      } ${loading ? "pointer-events-none opacity-60" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".wav,.mp3,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="animate-spin-slow w-16 h-16" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeDasharray="120 60"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-accent">Analyzing audio…</p>
            <p className="text-xs text-muted mt-1">
              Generating fingerprints for <span className="text-foreground">{fileName}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver
                ? "bg-accent/20 scale-110"
                : "bg-surface group-hover:bg-accent/10"
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
              className={`transition-colors ${
                dragOver ? "text-accent" : "text-muted"
              }`}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">
              {fileName ? (
                <>
                  Selected: <span className="text-accent">{fileName}</span>
                </>
              ) : (
                <>
                  Drop an audio file or{" "}
                  <span className="text-accent underline underline-offset-2">
                    browse
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-muted mt-1.5">
              WAV or MP3 — any length clip
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
