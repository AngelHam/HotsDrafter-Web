"""
Captures the HotS draft screen and detects hero picks/bans in defined slots.
"""
import json
import time
import numpy as np
import mss
from PIL import Image
from matcher import HeroMatcher

# HotS draft slot layout (16 slots: 6 bans + 10 picks)
# Slot positions are loaded from config.json (created by calibrate.py)

class DraftCapture:
    def __init__(self, config_path: str, matcher: HeroMatcher):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.matcher = matcher
        self.sct = mss.mss()
        self.detected = {}  # slot_id -> hero_name
        self.callbacks = []
    
    def on_detection(self, callback):
        """Register a callback for when a new hero is detected."""
        self.callbacks.append(callback)
    
    def capture_loop(self, interval: float = 1.5):
        """Main loop: capture screen, check slots, report new detections."""
        print(f"Starting capture loop (every {interval}s)...")
        print(f"Monitoring {len(self.config['slots'])} draft slots")
        
        while True:
            try:
                # Capture the monitor
                monitor = self.config.get('monitor', 1)
                screenshot = self.sct.grab(self.sct.monitors[monitor])
                img = np.array(Image.frombytes('RGB', screenshot.size, screenshot.bgra, 'raw', 'BGRX'))
                
                # Check each slot
                for slot in self.config['slots']:
                    slot_id = slot['id']
                    x, y, w, h = slot['x'], slot['y'], slot['width'], slot['height']
                    
                    # Crop the slot region
                    crop = img[y:y+h, x:x+w]
                    
                    if crop.size == 0:
                        continue
                    
                    # Match against portraits
                    hero_name, confidence = self.matcher.match(crop)
                    
                    # Only report NEW detections
                    if hero_name and hero_name != self.detected.get(slot_id):
                        self.detected[slot_id] = hero_name
                        event = {
                            'event': slot['type'],  # 'ban' or 'pick'
                            'team': slot['team'],
                            'slot': slot['slot_num'],
                            'hero': hero_name,
                            'confidence': round(confidence, 3),
                        }
                        print(f"  Detected: {hero_name} ({confidence:.2f}) in {slot['type']} slot T{slot['team']}-{slot['slot_num']}")
                        for cb in self.callbacks:
                            cb(event)
                
            except Exception as e:
                print(f"Capture error: {e}")
            
            time.sleep(interval)
    
    def reset(self):
        """Reset all detections (for new draft)."""
        self.detected.clear()
        print("Detections reset")
