"""
FEΔR - AION 2 Tactical Map & Timers Overlay Service
Engineered for Zero Game Lag (Low-CPU / Passive Rendering Architecture)
Manages leveling routes, waypoint tracking, and world event timers.
"""
import os
import json
import time

DEFAULT_STORAGE_DIR = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "FEAR", "Aion2_Tools")

class MapOverlayService:
    def __init__(self, storage_dir=None):
        self.storage_dir = storage_dir or DEFAULT_STORAGE_DIR
        os.makedirs(self.storage_dir, exist_ok=True)
        self.config_file = os.path.join(self.storage_dir, "map_overlay_config.json")
        self.active_route_id = "elyos_1"
        self.active_step_index = 0
        self.opacity = 90
        self.always_on_top = True
        self.compact_mode = False
        self.region = "global-as"
        self._load_config()

    def _load_config(self):
        try:
            if os.path.isfile(self.config_file):
                with open(self.config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.active_route_id = data.get("active_route_id", "elyos_1")
                    self.active_step_index = int(data.get("active_step_index", 0))
                    self.opacity = int(data.get("opacity", 90))
                    self.always_on_top = bool(data.get("always_on_top", True))
                    self.compact_mode = bool(data.get("compact_mode", False))
                    self.region = data.get("region", "global-as")
        except Exception as e:
            print(f"[MapOverlay] Error loading config: {e}")

    def save_config(self):
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
            data = {
                "active_route_id": self.active_route_id,
                "active_step_index": self.active_step_index,
                "opacity": self.opacity,
                "always_on_top": self.always_on_top,
                "compact_mode": self.compact_mode,
                "region": self.region
            }
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[MapOverlay] Error saving config: {e}")
            return False

    def set_progress(self, route_id, step_index):
        self.active_route_id = str(route_id)
        self.active_step_index = int(step_index)
        self.save_config()
        return True

    def set_mode(self, mode):
        self.compact_mode = (mode == "compact")
        self.save_config()
        return True

    def get_status(self):
        return {
            "active_route_id": self.active_route_id,
            "active_step_index": self.active_step_index,
            "opacity": self.opacity,
            "always_on_top": self.always_on_top,
            "compact_mode": self.compact_mode,
            "region": self.region
        }
