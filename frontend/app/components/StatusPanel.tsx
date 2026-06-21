"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

interface StatusData {
  indexed: boolean;
  song_names: string[];
}

export default function StatusPanel() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/status`);
      const data: StatusData = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleIndex = async () => {
    setIndexing(true);
    try {
      const res = await fetch(`${API}/index`, { method: "POST" });
      const data = await res.json();
      console.log("Indexed:", data.songs_indexed, "songs");
      await fetchStatus();
    } catch (err) {
      console.error("Index failed:", err);
    } finally {
      setIndexing(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-5 animate-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muted/40 animate-pulse" />
          <div className="h-4 w-48 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="glass-card p-5 border-danger/30">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
          <span className="text-sm text-danger font-medium">
            Backend offline — make sure FastAPI is running at {API}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status dot */}
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full ${
                status.indexed ? "bg-success" : "bg-yellow-500"
              }`}
            />
            <div
              className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${
                status.indexed ? "bg-success" : "bg-yellow-500"
              } opacity-30`}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">
              {status.indexed ? (
                <>
                  Database indexed —{" "}
                  <span className="gradient-text-success font-bold">
                    {status.song_names.length}
                  </span>{" "}
                  songs loaded
                </>
              ) : (
                <span className="text-yellow-400">
                  Database not indexed yet
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.indexed && status.song_names.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {expanded ? "Hide" : "Songs"}
            </button>
          )}
          <button
            onClick={handleIndex}
            disabled={indexing}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {indexing ? (
              <>
                <svg
                  className="animate-spin-slow w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Indexing…
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M4 4v16h16" />
                  <path d="M4 20l7-7 3 3 6-6" />
                </svg>
                {status.indexed ? "Re-index" : "Index Songs"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Song list */}
      {expanded && status.song_names.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {status.song_names.map((name) => (
              <span
                key={name}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium"
              >
                ♫ {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
