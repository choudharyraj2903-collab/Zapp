"""
main.py — FastAPI backend for the Shazam-style audio identifier (Q3B).

Endpoints
─────────
GET  /status          → DB status (indexed?, song count, hash count)
POST /index           → (re-)index the songs/ folder and save DB to disk
POST /identify        → identify a single uploaded audio file
                        returns: matched song + spectrogram + constellation + histogram
POST /batch           → identify multiple files, return results.csv
GET  /songs           → list all indexed song names
"""

from __future__ import annotations

import csv
import io
import os
import traceback
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import fingerprint as fp

# ─────────────────────────────────────────────
# Paths  (everything lives relative to this file)
# ─────────────────────────────────────────────
BASE_DIR  = Path(__file__).parent
SONGS_DIR = BASE_DIR / "songs"
DB_PATH   = BASE_DIR / "db" / "fingerprint_db.pkl"

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────
app = FastAPI(title="Zapp — Audio Fingerprinting API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database (populated on startup or after /index)
_db: dict = {}
_stats: dict = {}   # song_name → hash count


def _try_load_db() -> None:
    """Load DB from disk at startup if it exists."""
    global _db, _stats
    if DB_PATH.exists():
        _db, _stats = fp.load_database(str(DB_PATH))
        print(f"[startup] Loaded DB: {len(_db)} hashes, {len(_stats)} songs")
    else:
        print("[startup] No DB found — call POST /index to build one.")


@app.on_event("startup")
async def startup_event():
    _try_load_db()


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _require_db():
    if not _db:
        raise HTTPException(
            status_code=503,
            detail="Database not built yet. Call POST /index first.",
        )


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/status")
def get_status() -> dict[str, Any]:
    """Return current database status."""
    return {
        "indexed":     bool(_db),
        "songs":       len(_stats),
        "unique_hashes": len(_db),
        "song_names":  sorted(_stats.keys()),
        "db_path":     str(DB_PATH),
    }


@app.post("/index")
def index_songs() -> dict[str, Any]:
    """
    (Re-)index every .wav / .mp3 in the songs/ directory.
    Writes the fingerprint DB to db/fingerprint_db.pkl.
    """
    global _db, _stats
    if not SONGS_DIR.exists():
        raise HTTPException(status_code=404, detail=f"songs/ directory not found at {SONGS_DIR}")

    try:
        _db = fp.build_database(str(SONGS_DIR), str(DB_PATH))
        # reload stats from the saved file
        _db, _stats = fp.load_database(str(DB_PATH))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}\n{traceback.format_exc()}")

    return {
        "success":      True,
        "songs_indexed": len(_stats),
        "unique_hashes": len(_db),
        "song_names":   sorted(_stats.keys()),
    }


@app.get("/songs")
def list_songs() -> dict[str, Any]:
    """List all songs currently in the database."""
    _require_db()
    return {
        "songs": [
            {"name": name, "hashes": count}
            for name, count in sorted(_stats.items())
        ]
    }


@app.post("/identify")
async def identify(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Identify a single uploaded audio clip.

    Returns:
      - matched_song  : song filename without extension (or null)
      - score         : number of aligned hash votes
      - spectrogram   : { f, t, Sxx_db }  for frontend heatmap
      - constellation : { times, freqs }   for scatter plot
      - histogram     : { offsets, counts } for bar chart
      - single_peak_match : result using single-peak fallback (for comparison)
    """
    _require_db()

    raw = await file.read()
    try:
        hashes, f, t, Sxx_db, peaks = fp.fingerprint_bytes(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not process audio: {e}")

    # --- paired-hash match (primary) ---
    best_song, score, offset_hist = fp.match(hashes, _db, use_pairs=True)

    # --- single-peak match (for comparison / report writeup) ---
    sp_song, sp_score, _ = fp.match(hashes, _db, use_pairs=False)

    return {
        "matched_song":       best_song,
        "score":              score,
        "single_peak_match":  {"song": sp_song, "score": sp_score},
        "spectrogram":        fp.spectrogram_to_dict(f, t, Sxx_db),
        "constellation":      fp.peaks_to_dict(peaks, f, t),
        "histogram":          fp.offset_hist_to_dict(offset_hist, best_song),
    }


@app.post("/batch")
async def batch_identify(files: list[UploadFile] = File(...)) -> StreamingResponse:
    """
    Identify multiple uploaded clips.
    Returns results.csv with columns: filename, prediction
    (exactly the format required by the assignment auto-grader).
    """
    _require_db()

    rows: list[tuple[str, str]] = []
    for file in files:
        raw = await file.read()
        filename_no_ext = Path(file.filename or "unknown").stem
        try:
            hashes, f, t, Sxx_db, peaks = fp.fingerprint_bytes(raw)
            best_song, score, _ = fp.match(hashes, _db, use_pairs=True)
            prediction = best_song if best_song else "unknown"
        except Exception:
            prediction = "error"
        rows.append((file.filename or "unknown", prediction))

    # Build CSV in memory
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["filename", "prediction"])
    writer.writerows(rows)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )