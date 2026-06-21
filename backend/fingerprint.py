
"""
fingerprint.py — Core Shazam-style audio fingerprinting engine.

Pipeline:
  load_audio  →  compute_spectrogram  →  find_peaks_2d
  →  generate_hashes  →  build_database / match_clip
"""

import os
import pickle
import glob
import numpy as np
import scipy.signal as sig
from scipy.ndimage import maximum_filter
from collections import defaultdict
import librosa

# ─────────────────────────────────────────────
# Constants (tweak these if matching is poor)
# ─────────────────────────────────────────────
SAMPLE_RATE     = 22050
NPERSEG         = 2048          # STFT window size  (~93 ms)
NOVERLAP        = NPERSEG // 2  # 50 % overlap
PEAK_FREQ_SIZE  = 10            # neighbourhood for local-max (freq axis)
PEAK_TIME_SIZE  = 10            # neighbourhood for local-max (time axis)
AMP_THRESHOLD   = -50           # dB — quieter peaks are ignored
FAN_OUT         = 5             # how many partners each peak is paired with
MAX_DT          = 200           # max frame-distance between paired peaks


# ─────────────────────────────────────────────
# 1. Audio loading
# ─────────────────────────────────────────────
def load_audio(path: str, sr: int = SAMPLE_RATE) -> tuple[np.ndarray, int]:
    """Load any audio file (wav/mp3) and resample to sr."""
    y, _ = librosa.load(path, sr=sr, mono=True)
    return y, sr


def load_audio_bytes(data: bytes, sr: int = SAMPLE_RATE) -> tuple[np.ndarray, int]:
    """Load audio from raw bytes (used by FastAPI upload endpoint)."""
    import io
    import soundfile as sf
    buf = io.BytesIO(data)
    try:
        y, file_sr = sf.read(buf)
    except Exception:
        # fallback via librosa (handles mp3 too)
        buf.seek(0)
        y, file_sr = librosa.load(buf, sr=None, mono=True)
    if y.ndim > 1:
        y = y.mean(axis=1)
    if file_sr != sr:
        y = librosa.resample(y, orig_sr=file_sr, target_sr=sr)
    return y.astype(np.float32), sr


# ─────────────────────────────────────────────
# 2. Spectrogram
# ─────────────────────────────────────────────
def compute_spectrogram(
    y: np.ndarray,
    sr: int = SAMPLE_RATE,
    nperseg: int = NPERSEG,
    noverlap: int = NOVERLAP,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Returns:
        f      — frequency axis (Hz), shape (F,)
        t      — time axis (s),       shape (T,)
        Sxx_db — magnitude in dB,     shape (F, T)
    """
    f, t, Sxx = sig.spectrogram(
        y, fs=sr, window="hann",
        nperseg=nperseg, noverlap=noverlap, mode="magnitude",
    )
    Sxx_db = 20.0 * np.log10(np.clip(Sxx, 1e-10, None))
    return f, t, Sxx_db


def spectrogram_to_dict(f, t, Sxx_db, max_freq=8000) -> dict:
    """
    Serialise the spectrogram to a JSON-safe dict the frontend can render.
    Downsamples to max_freq Hz to keep payload small.
    """
    freq_mask = f <= max_freq
    return {
        "f":      f[freq_mask].tolist(),
        "t":      t.tolist(),
        "Sxx_db": Sxx_db[freq_mask, :].tolist(),
    }


# ─────────────────────────────────────────────
# 3. Peak picking  →  constellation
# ─────────────────────────────────────────────
def find_peaks_2d(
    Sxx_db: np.ndarray,
    freq_size: int = PEAK_FREQ_SIZE,
    time_size: int = PEAK_TIME_SIZE,
    amp_threshold: float = AMP_THRESHOLD,
) -> list[tuple[int, int]]:
    """
    Return list of (freq_idx, time_idx) pairs that are local maxima in
    their (freq_size × time_size) neighbourhood and above amp_threshold dB.
    """
    neighbourhood = maximum_filter(Sxx_db, size=(freq_size, time_size))
    is_peak = (Sxx_db == neighbourhood) & (Sxx_db > amp_threshold)
    freq_idx, time_idx = np.where(is_peak)
    return list(zip(freq_idx.tolist(), time_idx.tolist()))


def peaks_to_dict(peaks, f, t) -> dict:
    """Serialise constellation for the frontend scatter plot."""
    return {
        "times": [float(t[ti]) for _, ti in peaks],
        "freqs": [float(f[fi]) for fi, _ in peaks],
    }


# ─────────────────────────────────────────────
# 4. Hashing
# ─────────────────────────────────────────────
def generate_hashes(
    peaks: list[tuple[int, int]],
    f: np.ndarray,
    t: np.ndarray,
    fan_out: int = FAN_OUT,
    max_dt: int = MAX_DT,
) -> list[tuple[tuple, float]]:
    """
    Pair each peak with up to fan_out later peaks within max_dt frames.

    Returns list of:
        ( (f1_hz, f2_hz, delta_t_frames),  anchor_time_seconds )
    """
    peaks_sorted = sorted(peaks, key=lambda p: p[1])
    hashes = []
    n = len(peaks_sorted)
    for i in range(n):
        f1i, t1i = peaks_sorted[i]
        for j in range(1, fan_out + 1):
            if i + j >= n:
                break
            f2i, t2i = peaks_sorted[i + j]
            dt = t2i - t1i
            if 0 < dt <= max_dt:
                key = (int(round(f[f1i])), int(round(f[f2i])), dt)
                hashes.append((key, float(t[t1i])))
    return hashes


# ─────────────────────────────────────────────
# 5. Fingerprinting a single file
# ─────────────────────────────────────────────
def fingerprint_file(path: str) -> list[tuple[tuple, float]]:
    y, sr = load_audio(path)
    f, t, Sxx_db = compute_spectrogram(y, sr)
    peaks = find_peaks_2d(Sxx_db)
    return generate_hashes(peaks, f, t)


def fingerprint_bytes(data: bytes) -> tuple[list, np.ndarray, np.ndarray, np.ndarray, list]:
    """
    Full pipeline on uploaded bytes.
    Returns: hashes, f, t, Sxx_db, peaks
    (everything needed to build the API response in one go)
    """
    y, sr = load_audio_bytes(data)
    f, t, Sxx_db = compute_spectrogram(y, sr)
    peaks = find_peaks_2d(Sxx_db)
    hashes = generate_hashes(peaks, f, t)
    return hashes, f, t, Sxx_db, peaks


# ─────────────────────────────────────────────
# 6. Database
# ─────────────────────────────────────────────
def build_database(song_dir: str, db_path: str) -> dict:
    """
    Index every .wav / .mp3 in song_dir and write the database to db_path.
    Returns the database dict.
    """
    song_paths = (
        glob.glob(os.path.join(song_dir, "*.wav")) +
        glob.glob(os.path.join(song_dir, "*.mp3"))
    )
    if not song_paths:
        raise FileNotFoundError(f"No audio files found in {song_dir}")

    db: dict[tuple, list] = defaultdict(list)   # hash → [(song_name, anchor_t), …]
    stats = {}

    for path in sorted(song_paths):
        name = os.path.splitext(os.path.basename(path))[0]
        hashes = fingerprint_file(path)
        for key, anchor_t in hashes:
            db[key].append((name, anchor_t))
        stats[name] = len(hashes)
        print(f"  indexed  {name}  ({len(hashes)} hashes)")

    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with open(db_path, "wb") as f:
        pickle.dump({"db": dict(db), "stats": stats}, f)

    print(f"\nDatabase saved → {db_path}  ({len(db)} unique hashes, {len(song_paths)} songs)")
    return dict(db)


def load_database(db_path: str) -> tuple[dict, dict]:
    """Load a previously built database from disk. Returns (db, stats)."""
    with open(db_path, "rb") as f:
        payload = pickle.load(f)
    return payload["db"], payload["stats"]


# ─────────────────────────────────────────────
# 7. Matching
# ─────────────────────────────────────────────
def match(
    hashes: list[tuple[tuple, float]],
    db: dict,
    use_pairs: bool = True,
) -> tuple[str | None, int, dict[str, dict[float, int]]]:
    """
    Match a fingerprinted query against the database.

    Args:
        hashes    — output of generate_hashes() on the query
        db        — database dict from build_database / load_database
        use_pairs — True (pair hashes) or False (single-frequency fallback)

    Returns:
        best_song   — matched song name (or None)
        best_score  — number of aligned hash votes
        offset_hist — { song_name: { offset: count } } for ALL songs (for plots)
    """
    offset_hist: dict[str, dict[float, int]] = defaultdict(lambda: defaultdict(int))

    if use_pairs:
        for key, q_time in hashes:
            for song_name, song_time in db.get(key, []):
                offset = round(song_time - q_time, 2)
                offset_hist[song_name][offset] += 1
    else:
        # single-frequency fallback: match on f1 or f2 alone
        freq_index: dict[int, list] = defaultdict(list)
        for key, entries in db.items():
            freq_index[key[0]].extend(entries)
            freq_index[key[1]].extend(entries)
        for key, q_time in hashes:
            for freq in (key[0], key[1]):
                for song_name, song_time in freq_index.get(freq, []):
                    offset = round(song_time - q_time, 2)
                    offset_hist[song_name][offset] += 1

    best_song, best_score = None, 0
    for song_name, hist in offset_hist.items():
        score = max(hist.values())
        if score > best_score:
            best_song, best_score = song_name, score

    return best_song, best_score, {k: dict(v) for k, v in offset_hist.items()}


def offset_hist_to_dict(offset_hist: dict, best_song: str | None) -> dict:
    """
    Serialise the offset histogram for the best song into a
    JSON-safe { offsets: [...], counts: [...] } dict.
    """
    if not best_song or best_song not in offset_hist:
        return {"offsets": [], "counts": []}
    hist = offset_hist[best_song]
    pairs = sorted(hist.items())
    return {
        "offsets": [p[0] for p in pairs],
        "counts":  [p[1] for p in pairs],
    }