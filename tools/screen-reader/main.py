"""
HotsDrafter Screen Reader — Automatic draft detection via screen capture.

Usage:
  1. First run: python calibrate.py (one-time setup)
  2. Then: python main.py (starts capture + WebSocket server)
  3. Open companion mode in browser and click "Connect to Screen Reader"
"""
import os
import sys
import asyncio
import threading

from matcher import HeroMatcher
from capture import DraftCapture
from server import DraftServer

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PORTRAITS_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'public', 'hero_portraits')
CONFIG_PATH = os.path.join(SCRIPT_DIR, 'config.json')

def main():
    # Check config exists
    if not os.path.exists(CONFIG_PATH):
        print("ERROR: config.json not found!")
        print("Run 'python calibrate.py' first to calibrate slot positions.")
        sys.exit(1)
    
    # Check portraits exist
    if not os.path.exists(PORTRAITS_DIR):
        print(f"ERROR: Hero portraits not found at {PORTRAITS_DIR}")
        sys.exit(1)
    
    print("=== HotsDrafter Screen Reader ===")
    print()
    
    # Initialize
    matcher = HeroMatcher(PORTRAITS_DIR)
    capture = DraftCapture(CONFIG_PATH, matcher)
    server = DraftServer()
    
    # Connect capture events to server broadcast
    capture.on_detection(server.queue_event)
    
    # Run capture in a background thread
    capture_thread = threading.Thread(target=capture.capture_loop, daemon=True)
    capture_thread.start()
    
    # Run WebSocket server in main thread (asyncio)
    print()
    print("Ready! Open the companion at http://localhost:3000/draft/companion")
    print("Click 'Connect to Screen Reader' to start auto-detection.")
    print("Press Ctrl+C to stop.")
    print()
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == '__main__':
    main()
