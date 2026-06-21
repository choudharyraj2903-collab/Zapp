"use client";

import { useEffect, useRef } from "react";

interface SpectrogramCanvasProps {
  f: number[];
  t: number[];
  Sxx_db: number[][];
}

/**
 * Magma-like colormap: dark purple → red → orange → yellow → white
 * Maps a normalized value [0,1] to an RGB triplet.
 */
function magmaColor(v: number): [number, number, number] {
  // Clamp
  const t = Math.max(0, Math.min(1, v));

  // Control points for a magma-like palette
  const stops: [number, number, number, number][] = [
    [0.0, 0, 0, 4],
    [0.1, 16, 4, 41],
    [0.2, 60, 9, 86],
    [0.3, 106, 23, 110],
    [0.4, 147, 38, 103],
    [0.5, 188, 55, 84],
    [0.6, 221, 81, 58],
    [0.7, 243, 118, 27],
    [0.8, 253, 162, 10],
    [0.9, 252, 210, 37],
    [1.0, 252, 255, 164],
  ];

  // Find segment
  let i = 0;
  for (i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1][0]) break;
  }
  const lo = stops[i];
  const hi = stops[Math.min(i + 1, stops.length - 1)];
  const frac = hi[0] === lo[0] ? 0 : (t - lo[0]) / (hi[0] - lo[0]);

  return [
    Math.round(lo[1] + frac * (hi[1] - lo[1])),
    Math.round(lo[2] + frac * (hi[2] - lo[2])),
    Math.round(lo[3] + frac * (hi[3] - lo[3])),
  ];
}

export default function SpectrogramCanvas({
  f,
  t,
  Sxx_db,
}: SpectrogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !Sxx_db.length || !Sxx_db[0]?.length) return;

    const nFreq = Sxx_db.length;
    const nTime = Sxx_db[0].length;

    // Compute min/max for normalization
    let minVal = Infinity,
      maxVal = -Infinity;
    for (let i = 0; i < nFreq; i++) {
      for (let j = 0; j < nTime; j++) {
        const val = Sxx_db[i][j];
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
    const range = maxVal - minVal || 1;

    // Set canvas size to data dimensions
    canvas.width = nTime;
    canvas.height = nFreq;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(nTime, nFreq);
    const data = imageData.data;

    // Fill pixels — Sxx_db is [freq][time], draw with low freq at bottom
    for (let fi = 0; fi < nFreq; fi++) {
      for (let ti = 0; ti < nTime; ti++) {
        const norm = (Sxx_db[fi][ti] - minVal) / range;
        const [r, g, b] = magmaColor(norm);
        // Flip vertically: row 0 in canvas = highest freq
        const y = nFreq - 1 - fi;
        const idx = (y * nTime + ti) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [f, t, Sxx_db]);

  const maxFreq = f.length > 0 ? Math.round(f[f.length - 1]) : 0;
  const maxTime = t.length > 0 ? t[t.length - 1].toFixed(1) : "0";

  return (
    <div className="glass-card p-5 animate-float-up-delay-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Spectrogram
        </h3>
        <span className="text-xs text-muted ml-auto">
          {Sxx_db.length}×{Sxx_db[0]?.length ?? 0} bins
        </span>
      </div>

      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-1 top-0 bottom-8 flex flex-col justify-between text-[10px] text-muted pr-1">
          <span>{maxFreq} Hz</span>
          <span>0 Hz</span>
        </div>

        {/* Canvas */}
        <div className="ml-10 rounded-lg overflow-hidden border border-border">
          <canvas
            ref={canvasRef}
            className="w-full h-48 sm:h-64"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* X-axis label */}
        <div className="ml-10 flex justify-between text-[10px] text-muted mt-1">
          <span>0 s</span>
          <span>{maxTime} s</span>
        </div>
      </div>

      {/* Colorbar legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-muted">Low</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #000004, #100429, #3c0956, #6a176e, #932667, #bc3754, #dd513a, #f3761b, #fda20a, #fcd225, #fcffa4)",
          }}
        />
        <span className="text-[10px] text-muted">High dB</span>
      </div>
    </div>
  );
}
