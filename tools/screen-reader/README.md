# HotsDrafter Screen Reader

Automatically detects hero picks and bans from your HotS draft screen and feeds them to the web companion.

## Setup

1. Install Python 3.10+ if you don't have it
2. Install dependencies:
   ```bash
   cd tools/screen-reader
   pip install -r requirements.txt
   ```

## Usage

### Step 1: Calibrate (one time)
Open HotS and get to a draft screen (or use a screenshot), then run:
```bash
python calibrate.py
```
A semi-transparent overlay appears. Click the CENTER of each draft slot as instructed (16 clicks: 6 bans + 10 picks). This saves slot positions to `config.json`.

Only redo this if you change resolution or monitor.

### Step 2: Run during draft
```bash
python main.py
```
Then open the web companion at `http://localhost:3000/draft/companion` and click "Connect to Screen Reader".

The reader captures your screen every 1.5 seconds, matches hero portraits in the calibrated slots, and auto-fills picks/bans in the companion.

## How it works
- Captures screen regions using `mss` (fast, no dependencies)
- Compares each slot against all 90 hero portraits using pixel similarity
- Sends detections via WebSocket to the web companion
- The companion auto-fills picks/bans — you just watch the suggestions

## Troubleshooting
- **Low detection accuracy?** — Recalibrate with `python calibrate.py`
- **Wrong hero matched?** — Check portrait files in `public/hero_portraits/`
- **WebSocket won't connect?** — Make sure `main.py` is running before connecting
