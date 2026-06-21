"use client";

interface ResultsTableProps {
  pairedHash: { song: string | null; score: number };
  singlePeak: { song: string; score: number };
}

export default function ResultsTable({
  pairedHash,
  singlePeak,
}: ResultsTableProps) {
  return (
    <div className="glass-card p-5 animate-float-up-delay-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Method Comparison
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface/60">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                Method
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                Matched Song
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border hover:bg-surface-hover transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="font-medium">Paired Hash</span>
                </div>
              </td>
              <td className="py-3 px-4 text-foreground">
                {pairedHash.song ?? (
                  <span className="text-muted italic">No match</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`font-mono font-bold ${
                    pairedHash.score > 0 ? "text-success" : "text-muted"
                  }`}
                >
                  {(pairedHash.score * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
            <tr className="border-t border-border hover:bg-surface-hover transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span className="font-medium">Single Peak</span>
                </div>
              </td>
              <td className="py-3 px-4 text-foreground">
                {singlePeak.song || (
                  <span className="text-muted italic">No match</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`font-mono font-bold ${
                    singlePeak.score > 0 ? "text-success" : "text-muted"
                  }`}
                >
                  {(singlePeak.score * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
