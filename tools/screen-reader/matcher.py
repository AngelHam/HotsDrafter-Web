"""
Matches screen-captured portrait regions against known HotS hero portraits.
Uses normalized pixel similarity (no OpenCV needed).
"""
import os
import numpy as np
from PIL import Image

class HeroMatcher:
    def __init__(self, portraits_dir: str):
        """Load all hero portraits from the given directory."""
        self.portraits = {}  # name -> numpy array (normalized float32)
        self._load_portraits(portraits_dir)
    
    def _load_portraits(self, directory: str):
        """Load all .png files from the portraits directory."""
        for filename in os.listdir(directory):
            if not filename.endswith('.png'):
                continue
            name = filename.replace('.png', '')
            path = os.path.join(directory, filename)
            img = Image.open(path).convert('RGB')
            # Resize to standard size for comparison
            img = img.resize((48, 48), Image.LANCZOS)
            arr = np.array(img, dtype=np.float32) / 255.0
            self.portraits[name] = arr
        print(f"Loaded {len(self.portraits)} hero portraits")
    
    def match(self, screen_crop: np.ndarray, threshold: float = 0.82) -> tuple[str | None, float]:
        """
        Match a screen crop against all known portraits.
        
        Args:
            screen_crop: RGB numpy array of the screen region (any size, will be resized)
            threshold: Minimum similarity score (0-1) to consider a match
        
        Returns:
            (hero_name, confidence) or (None, 0) if no match above threshold
        """
        # Convert to float32 and resize to match portrait size
        if screen_crop.dtype != np.float32:
            crop = screen_crop.astype(np.float32) / 255.0
        else:
            crop = screen_crop
        
        # Resize crop to 48x48 to match portraits
        crop_img = Image.fromarray((crop * 255).astype(np.uint8))
        crop_img = crop_img.resize((48, 48), Image.LANCZOS)
        crop_arr = np.array(crop_img, dtype=np.float32) / 255.0
        
        best_name = None
        best_score = 0.0
        
        for name, portrait in self.portraits.items():
            # Normalized cross-correlation
            score = self._similarity(crop_arr, portrait)
            if score > best_score:
                best_score = score
                best_name = name
        
        if best_score >= threshold:
            return best_name, best_score
        return None, best_score
    
    def _similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Compute normalized cross-correlation between two images."""
        a_flat = a.flatten()
        b_flat = b.flatten()
        
        a_mean = a_flat - a_flat.mean()
        b_mean = b_flat - b_flat.mean()
        
        numerator = np.dot(a_mean, b_mean)
        denominator = np.sqrt(np.dot(a_mean, a_mean) * np.dot(b_mean, b_mean))
        
        if denominator == 0:
            return 0.0
        return float(numerator / denominator)
