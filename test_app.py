import os
import unittest
from app import ModApi

class TestModApi(unittest.TestCase):
    def setUp(self):
        self.api = ModApi()

    def test_detect_game_dir(self):
        d = self.api.detect_game_dir()
        self.assertTrue(len(d) > 0, "Game directory should be detected")
        self.assertTrue(os.path.isdir(d), f"Detected dir must exist: {d}")
        print(f"[PASS] Detected game directory: {d}")

    def test_check_is_installed(self):
        d = self.api.detect_game_dir()
        installed = self.api.check_is_installed(d)
        print(f"[PASS] Is installed state: {installed}")
        self.assertIsInstance(installed, bool)

    def test_get_initial_state(self):
        state = self.api.get_initial_state()
        self.assertIn("gameDir", state)
        self.assertIn("isInstalled", state)
        print(f"[PASS] Initial state: {state}")

if __name__ == "__main__":
    unittest.main()
