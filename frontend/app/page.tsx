"use client";

import { useState } from "react";
import StatusPanel from "./components/StatusPanel";
import FileUpload from "./components/FileUpload";
import ResultBanner from "./components/ResultBanner";
import SpectrogramCanvas from "./components/SpectrogramCanvas";
import ConstellationChart from "./components/ConstellationChart";
import HistogramChart from "./components/HistogramChart";
import ResultsTable from "./components/ResultsTable";

const API = "http://localhost:8000";

interface IdentifyResult {
  matched_song: string | null;
  score: number;
  spectrogram: {
    f: number[];
    t: number[];
    Sxx_db: number[][];
  };
  constellation: {
    times: number[];
    freqs: number[];
  };
  histogram: {
    offsets: number[];
    counts: number[];
  };
  single_peak_match: {
    song: string;
    score: number;
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/identify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: IdentifyResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to identify clip"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
              Identify Your Audio
            </h1>
            <p className="text-muted text-lg max-w-lg mx-auto">
              Upload a clip and Zapp will fingerprint it against the database in
              milliseconds.
            </p>
          </div>

          {/* Status panel */}
          <div className="mb-8">
            <StatusPanel />
          </div>

          {/* Upload area */}
          <div className="mb-8">
            <FileUpload onFileSelected={handleFileSelected} loading={loading} />
          </div>

          {/* Error */}
          {error && (
            <div className="glass-card p-4 border-danger/30 mb-8 animate-float-up">
              <p className="text-sm text-danger flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Results section */}
      {result && (
        <section className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
          {/* Match banner */}
          <ResultBanner
            matchedSong={result.matched_song}
            score={result.score}
          />

          {/* Visualization grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spectrogram */}
            <SpectrogramCanvas
              f={result.spectrogram.f}
              t={result.spectrogram.t}
              Sxx_db={result.spectrogram.Sxx_db}
            />

            {/* Constellation */}
            <ConstellationChart
              times={result.constellation.times}
              freqs={result.constellation.freqs}
            />

            {/* Histogram */}
            <HistogramChart
              offsets={result.histogram.offsets}
              counts={result.histogram.counts}
            />

            {/* Comparison table */}
            <ResultsTable
              pairedHash={{
                song: result.matched_song,
                score: result.score,
              }}
              singlePeak={result.single_peak_match}
            />
          </div>
        </section>
      )}
    </div>
  );
}
