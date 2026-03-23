"""
GUI calibration tool for marking draft slot positions on screen.
Uses tkinter (built-in Python) for cross-platform GUI.
"""
import json
import tkinter as tk
from tkinter import messagebox
import mss
from PIL import Image, ImageTk

SLOT_ORDER = [
    # 6 ban slots
    {'id': 'ban_t1_0', 'type': 'ban', 'team': 1, 'slot_num': 0, 'label': 'Team 1 Ban 1'},
    {'id': 'ban_t1_1', 'type': 'ban', 'team': 1, 'slot_num': 1, 'label': 'Team 1 Ban 2'},
    {'id': 'ban_t1_2', 'type': 'ban', 'team': 1, 'slot_num': 2, 'label': 'Team 1 Ban 3'},
    {'id': 'ban_t2_0', 'type': 'ban', 'team': 2, 'slot_num': 0, 'label': 'Team 2 Ban 1'},
    {'id': 'ban_t2_1', 'type': 'ban', 'team': 2, 'slot_num': 1, 'label': 'Team 2 Ban 2'},
    {'id': 'ban_t2_2', 'type': 'ban', 'team': 2, 'slot_num': 2, 'label': 'Team 2 Ban 3'},
    # 10 pick slots
    {'id': 'pick_t1_0', 'type': 'pick', 'team': 1, 'slot_num': 0, 'label': 'Team 1 Pick 1'},
    {'id': 'pick_t1_1', 'type': 'pick', 'team': 1, 'slot_num': 1, 'label': 'Team 1 Pick 2'},
    {'id': 'pick_t1_2', 'type': 'pick', 'team': 1, 'slot_num': 2, 'label': 'Team 1 Pick 3'},
    {'id': 'pick_t1_3', 'type': 'pick', 'team': 1, 'slot_num': 3, 'label': 'Team 1 Pick 4'},
    {'id': 'pick_t1_4', 'type': 'pick', 'team': 1, 'slot_num': 4, 'label': 'Team 1 Pick 5'},
    {'id': 'pick_t2_0', 'type': 'pick', 'team': 2, 'slot_num': 0, 'label': 'Team 2 Pick 1'},
    {'id': 'pick_t2_1', 'type': 'pick', 'team': 2, 'slot_num': 1, 'label': 'Team 2 Pick 2'},
    {'id': 'pick_t2_2', 'type': 'pick', 'team': 2, 'slot_num': 2, 'label': 'Team 2 Pick 3'},
    {'id': 'pick_t2_3', 'type': 'pick', 'team': 2, 'slot_num': 3, 'label': 'Team 2 Pick 4'},
    {'id': 'pick_t2_4', 'type': 'pick', 'team': 2, 'slot_num': 4, 'label': 'Team 2 Pick 5'},
]

# Default portrait crop size (will be saved per slot)
PORTRAIT_SIZE = 60  # pixels — the region around the click point to capture

class CalibrationApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("HotsDrafter Screen Reader — Calibration")
        self.root.attributes('-fullscreen', True)
        self.root.attributes('-alpha', 0.4)  # Semi-transparent overlay
        self.root.configure(bg='black')
        
        self.current_slot = 0
        self.slots_data = []
        self.monitor = 1  # Primary monitor
        
        # Instructions label
        self.label = tk.Label(
            self.root, 
            text=f"Click the CENTER of: {SLOT_ORDER[0]['label']}\n(Press Escape to cancel, Backspace to redo last)",
            font=('Arial', 24, 'bold'),
            fg='cyan', bg='black'
        )
        self.label.pack(pady=50)
        
        # Progress label
        self.progress = tk.Label(
            self.root,
            text=f"Step 1 of {len(SLOT_ORDER)}",
            font=('Arial', 16),
            fg='gold', bg='black'
        )
        self.progress.pack()
        
        self.root.bind('<Button-1>', self.on_click)
        self.root.bind('<Escape>', lambda e: self.root.destroy())
        self.root.bind('<BackSpace>', self.undo_last)
    
    def on_click(self, event):
        x, y = event.x_root, event.y_root
        slot = SLOT_ORDER[self.current_slot]
        
        half = PORTRAIT_SIZE // 2
        self.slots_data.append({
            **slot,
            'x': x - half,
            'y': y - half,
            'width': PORTRAIT_SIZE,
            'height': PORTRAIT_SIZE,
        })
        
        self.current_slot += 1
        
        if self.current_slot >= len(SLOT_ORDER):
            self.save_config()
            return
        
        next_slot = SLOT_ORDER[self.current_slot]
        self.label.config(text=f"Click the CENTER of: {next_slot['label']}\n(Press Escape to cancel, Backspace to redo last)")
        self.progress.config(text=f"Step {self.current_slot + 1} of {len(SLOT_ORDER)}")
    
    def undo_last(self, event=None):
        if self.current_slot > 0:
            self.current_slot -= 1
            self.slots_data.pop()
            slot = SLOT_ORDER[self.current_slot]
            self.label.config(text=f"Click the CENTER of: {slot['label']}\n(Redo — Press Escape to cancel, Backspace to redo)")
            self.progress.config(text=f"Step {self.current_slot + 1} of {len(SLOT_ORDER)}")
    
    def save_config(self):
        config = {
            'monitor': self.monitor,
            'portrait_size': PORTRAIT_SIZE,
            'slots': self.slots_data,
        }
        
        config_path = 'config.json'
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        self.root.destroy()
        print(f"Calibration saved to {config_path} ({len(self.slots_data)} slots)")
        messagebox.showinfo("Calibration Complete", f"Saved {len(self.slots_data)} slot positions to config.json")
    
    def run(self):
        self.root.mainloop()

if __name__ == '__main__':
    print("=== HotsDrafter Screen Reader Calibration ===")
    print("A semi-transparent overlay will appear.")
    print("Click the CENTER of each draft slot as instructed.")
    print("Press Escape to cancel, Backspace to redo last click.")
    print()
    app = CalibrationApp()
    app.run()
