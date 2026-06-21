# 🛠️ Zapp — Setup Guide

Step-by-step instructions to get Zapp running locally on your machine.

---

## Prerequisites

Make sure you have the following installed:

| Tool       | Version  | Check with           | Download                                      |
|------------|----------|----------------------|-----------------------------------------------|
| **Python** | ≥ 3.10   | `python --version`   | [python.org](https://www.python.org/downloads/) |
| **Node.js**| ≥ 18     | `node --version`     | [nodejs.org](https://nodejs.org/)              |
| **npm**    | ≥ 9      | `npm --version`      | Comes with Node.js                             |
| **Git**    | any      | `git --version`      | [git-scm.com](https://git-scm.com/)           |

> **Windows users**: Make sure Python is added to your PATH during installation. If you use `py` instead of `python`, substitute accordingly.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd ZApp
```

---

## 2. Backend Setup

### 2.1 Create a Virtual Environment (recommended)

```bash
cd backend

# Create the virtual environment
python -m venv venv

# Activate it
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt):
.\venv\Scripts\activate.bat

# macOS / Linux:
source venv/bin/activate
```

### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- **FastAPI** + **Uvicorn** — web server
- **NumPy** + **SciPy** — spectrogram and peak detection
- **Librosa** + **SoundFile** — audio loading and resampling
- **python-multipart** — file upload handling

### 2.3 Add Songs to the Database

Place your `.wav` or `.mp3` song files in the `backend/songs/` directory. The project comes pre-loaded with 50 songs (Beatles + Queen tracks).

```
backend/
  songs/
    Bohemian Rhapsody.mp3
    Hey Jude.mp3
    ...
```

### 2.4 Start the Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     [startup] No DB found — call POST /index to build one.
```

### 2.5 Verify the Backend

Open your browser or use `curl`:

```bash
curl http://localhost:8000/status
```

Expected output:
```json
{ "indexed": false, "songs": 0, "unique_hashes": 0, "song_names": [], "db_path": "..." }
```

---

## 3. Frontend Setup

Open a **new terminal** (keep the backend running).

### 3.1 Install Node Dependencies

```bash
cd frontend
npm install
```

### 3.2 Start the Development Server

```bash
npm run dev
```

You should see:

```
▲ Next.js 16.x.x (Turbopack)
- Local:   http://localhost:3000
```

### 3.3 Open the App

Navigate to **http://localhost:3000** in your browser.

---

## 4. First-Time Indexing

Before you can identify songs, you need to build the fingerprint database:

1. Open the app at `http://localhost:3000`.
2. You'll see the status panel showing **"Database not indexed yet"**.
3. Click the **"Index Songs"** button.
4. Wait for indexing to complete (this scans all songs in `backend/songs/` and generates hashes).
5. Once done, the status panel will update to show the number of indexed songs.

Alternatively, index via the API directly:

```bash
curl -X POST http://localhost:8000/index
```

> **Note**: Indexing 50 songs typically takes 30–60 seconds depending on your hardware. The database is saved to `backend/db/fingerprint_db.pkl` and persists across server restarts.

---

## 5. Usage

### Identify a Single Clip

1. Go to `http://localhost:3000` (Home page).
2. Drag and drop a `.wav` or `.mp3` audio clip onto the upload area (or click to browse).
3. Zapp will analyze the clip and display:
   - **Match result** with a confidence score
   - **Spectrogram** heatmap
   - **Constellation map** scatter plot
   - **Offset histogram** bar chart
   - **Method comparison** table

### Batch Identification

1. Go to `http://localhost:3000/batch`.
2. Select or drop multiple audio files.
3. Click **"Run Batch"**.
4. A `results.csv` file will automatically download with the predictions.

---

## 6. Running Both Servers (Quick Reference)

You need **two terminals** running simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
# Activate your virtual environment first if you set one up
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000**.

---

## 7. Production Build (Frontend)

To build the frontend for production:

```bash
cd frontend
npm run build
npm start
```

This creates an optimized build and serves it on port 3000.

---

## 8. Environment Variables (Optional)

No environment variables are required for local development. The frontend is hardcoded to connect to `http://localhost:8000`.

To change the backend URL for deployment, update the `API` constant in:
- `frontend/app/page.tsx`
- `frontend/app/components/StatusPanel.tsx`
- `frontend/app/batch/page.tsx`

---

## Troubleshooting

### Backend won't start

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Activate your virtual environment and run `pip install -r requirements.txt` |
| `No module named 'librosa'` | Run `pip install librosa` — it's a large package and may take a minute |
| Port 8000 already in use | Kill the process using the port or use `--port 8001` |

### Frontend won't start

| Issue | Fix |
|-------|-----|
| `npm ERR! Missing script: "dev"` | Make sure you're inside the `frontend/` directory |
| `Module not found: 'recharts'` | Run `npm install` in the `frontend/` directory |
| Port 3000 already in use | Next.js will auto-pick port 3001 |

### Backend offline error in the UI

| Issue | Fix |
|-------|-----|
| Status panel says "Backend offline" | Make sure the FastAPI server is running on port 8000 |
| CORS errors in the browser console | The backend has CORS configured for `*` — this should work locally |

### Indexing is slow

- Indexing 50 songs takes ~30–60 seconds. This is normal.
- The database is persisted to disk (`db/fingerprint_db.pkl`), so subsequent server starts will load it instantly.

### Audio file not recognized

| Issue | Fix |
|-------|-----|
| `Could not process audio` error | Ensure the file is a valid `.wav` or `.mp3`. Corrupt or DRM-protected files won't work. |
| Very short clips (< 1 second) | May produce too few peaks for a reliable match. Try a longer clip. |

---

## Useful Commands

```bash
# Backend — run with auto-reload
cd backend && uvicorn main:app --reload --port 8000

# Frontend — development mode
cd frontend && npm run dev

# Frontend — type check
cd frontend && npx tsc --noEmit

# Frontend — lint
cd frontend && npm run lint

# Frontend — production build
cd frontend && npm run build

# Index songs via CLI
curl -X POST http://localhost:8000/index

# Check status via CLI
curl http://localhost:8000/status

# Identify a file via CLI
curl -X POST -F "file=@path/to/clip.wav" http://localhost:8000/identify
```
