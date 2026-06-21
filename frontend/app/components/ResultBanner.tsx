"use client";

interface ResultBannerProps {
  matchedSong: string | null;
  score: number;
}

export default function ResultBanner({ matchedSong, score }: ResultBannerProps) {
  const isMatch = matchedSong !== null && score > 0;
  const percentage = Math.round(score * 100);

  // SVG circle parameters
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  return (
    <div
      className={`glass-card overflow-hidden animate-float-up ${
        isMatch ? "border-success/20" : "border-danger/20"
      }`}
    >
      {/* Glow accent bar */}
      <div
        className={`h-1 w-full ${
          isMatch
            ? "bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500"
            : "bg-gradient-to-r from-red-500 via-rose-400 to-pink-500"
        }`}
      />

      <div className="p-6 flex items-center gap-6">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="-rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="rgba(30,33,48,0.6)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={isMatch ? "#10b981" : "#ef4444"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="score-ring"
              style={
                { "--score-offset": offset } as React.CSSProperties
              }
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-xl font-bold ${
                isMatch ? "text-success" : "text-danger"
              }`}
            >
              {percentage}%
            </span>
          </div>
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          {isMatch ? (
            <>
              <p className="text-xs uppercase tracking-widest text-success font-semibold mb-1">
                ✓ Match Found
              </p>
              <h2 className="text-2xl font-bold text-foreground truncate">
                {matchedSong}
              </h2>
              <p className="text-sm text-muted mt-1">
                Confidence score: {percentage}%
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-danger font-semibold mb-1">
                ✗ No Match
              </p>
              <h2 className="text-xl font-semibold text-foreground/70">
                Could not identify this clip
              </h2>
              <p className="text-sm text-muted mt-1">
                Try a longer or cleaner recording
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
