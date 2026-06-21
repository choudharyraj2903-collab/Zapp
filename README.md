# ⚡ Zapp — Audio Fingerprinting

A full-stack audio fingerprinting application that can identify songs from short audio clips, inspired by the Shazam algorithm. Upload a recording, and Zapp will match it against a database of indexed songs in milliseconds.

---

## Overview

Zapp implements the classic **spectral-peak-pair hashing** pipeline:

1. **Spectrogram** — Compute a time-frequency representation of the audio signal (STFT).
2. **Peak Picking** — Find 2-D local maxima in the spectrogram (the "constellation map").
3. **Hash Generation** — Pair nearby peaks into combinatorial hashes `(f1, f2, Δt)` for robust matching.
4. **Database Lookup** — Compare query hashes against stored hashes and align via an offset histogram.

The application ships in two parts:

| Layer      | Tech                           | Port    |
|------------|--------------------------------|---------|
| **Backend**  | Python · FastAPI · NumPy/SciPy | `:8000` |
| **Frontend** | Next.js · React · Tailwind CSS | `:3000` |

---

## Features

### Single-Clip Identification (`/`)
- **Database status panel** — See whether songs are indexed, how many, and trigger (re-)indexing.
- **Drag-and-drop upload** — Drop a `.wav` or `.mp3` clip to identify it.
- **Match result banner** — Shows the matched song name with an animated confidence score ring.
- **Spectrogram heatmap** — Canvas-rendered with a magma colormap (dark purple → yellow).
- **Constellation scatter plot** — Red dots plotting the detected spectral peaks (time vs frequency).
- **Offset histogram** — Bar chart showing hash-vote alignment, the signal that clinches the match.
- **Method comparison table** — Side-by-side results of paired-hash vs single-peak matching.

### Batch Identification (`/batch`)
- **Multi-file upload** — Select or drag multiple audio files at once.
- **CSV download** — Results are returned as a `results.csv` with `filename, prediction` columns.

---

## Tech Stack

### Backend
| Package        | Purpose                                   |
|----------------|-------------------------------------------|
| FastAPI        | Async REST API framework                  |
| Uvicorn        | ASGI server                               |
| NumPy          | Numerical computation                     |
| SciPy          | Spectrogram (STFT) and 2-D peak detection |
| Librosa        | Audio loading and resampling              |
| SoundFile      | WAV/FLAC decoding from byte streams       |

### Frontend
| Package       | Purpose                                 |
|---------------|-----------------------------------------|
| Next.js 16    | React framework (App Router)            |
| React 19      | UI library                              |
| Tailwind CSS 4| Utility-first styling (dark theme)      |
| Recharts      | Scatter plot and bar chart              |
| Canvas API    | Spectrogram heatmap rendering           |

---

## API Reference

### `GET /status`
Returns the current database status.

```json
{
  "indexed": true,
  "songs": 50,
  "unique_hashes": 238471,
  "song_names": ["A Day In The Life", "Bohemian Rhapsody", "..."],
  "db_path": "backend/db/fingerprint_db.pkl"
}
```

### `POST /index`
Re-indexes all `.wav`/`.mp3` files in `backend/songs/`. No request body needed.

```json
{
  "success": true,
  "songs_indexed": 50,
  "unique_hashes": 238471,
  "song_names": ["A Day In The Life", "..."]
}
```

### `POST /identify`
Identify a single audio clip. Send as `multipart/form-data` with field name `file`.

```json
{
  "matched_song": "Bohemian Rhapsody",
  "score": 142,
  "spectrogram": { "f": [...], "t": [...], "Sxx_db": [[...], ...] },
  "constellation": { "times": [...], "freqs": [...] },
  "histogram": { "offsets": [...], "counts": [...] },
  "single_peak_match": { "song": "Bohemian Rhapsody", "score": 8421 }
}
```

### `POST /batch`
Identify multiple clips. Send as `multipart/form-data` with field name `files` (multiple).  
Returns a `results.csv` file download:

```
filename,prediction
clip01.wav,Bohemian Rhapsody
clip02.wav,Hey Jude
```

### `GET /songs`
List all indexed songs with their hash counts.

```json
{
  "songs": [
    { "name": "A Day In The Life", "hashes": 4832 },
    { "name": "Bohemian Rhapsody", "hashes": 5214 }
  ]
}
```

---

## Project Structure

```
ZApp/
├── README.md                  # This file
├── SETUP.md                   # Setup and installation guide
│
├── backend/
│   ├── main.py                # FastAPI application and endpoints
│   ├── fingerprint.py         # Core fingerprinting engine
│   ├── requirements.txt       # Python dependencies
│   ├── songs/                 # Place .wav/.mp3 files here for indexing
│   └── db/                    # Auto-generated fingerprint database
│       └── fingerprint_db.pkl
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── postcss.config.mjs
    └── app/
        ├── globals.css            # Dark theme design system
        ├── layout.tsx             # Root layout with navbar
        ├── page.tsx               # Home — single-clip identification
        ├── batch/
        │   └── page.tsx           # Batch identification page
        └── components/
            ├── Navbar.tsx             # Sticky glassmorphism navbar
            ├── StatusPanel.tsx        # DB status and index button
            ├── FileUpload.tsx         # Drag-and-drop file upload
            ├── ResultBanner.tsx       # Match result with score ring
            ├── SpectrogramCanvas.tsx  # Canvas heatmap (magma colormap)
            ├── ConstellationChart.tsx # Recharts scatter plot
            ├── HistogramChart.tsx     # Recharts bar chart
            └── ResultsTable.tsx       # Paired-hash vs single-peak table
```

---

## Algorithm Details

### Fingerprinting Pipeline

```
Audio File
  │
  ▼
Load & Resample (22050 Hz mono)
  │
  ▼
STFT Spectrogram (Hann window, 2048 samples, 50% overlap)
  │
  ▼
2-D Peak Detection (local max in 10×10 neighbourhood, > -50 dB)
  │
  ▼
Combinatorial Hashing (fan-out = 5, max Δt = 200 frames)
  │  Each hash = (f₁, f₂, Δt)  +  anchor time
  ▼
Database Lookup → Offset Histogram → Best Match
```

### Key Parameters

| Parameter         | Value  | Description                                |
|-------------------|--------|--------------------------------------------|
| `SAMPLE_RATE`     | 22050  | Target sample rate (Hz)                    |
| `NPERSEG`         | 2048   | STFT window size (~93 ms)                  |
| `NOVERLAP`        | 1024   | 50% overlap                                |
| `PEAK_FREQ_SIZE`  | 10     | Peak neighbourhood size (frequency axis)   |
| `PEAK_TIME_SIZE`  | 10     | Peak neighbourhood size (time axis)        |
| `AMP_THRESHOLD`   | -50 dB | Minimum amplitude for peak detection       |
| `FAN_OUT`         | 5      | Number of partner peaks per anchor         |
| `MAX_DT`          | 200    | Max frame distance for paired peaks        |

---

## License

This project is for educational and personal use.
