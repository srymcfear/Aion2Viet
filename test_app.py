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

    def test_get_status(self):
        status = self.api.get_status()
        self.assertIn("gameDir", status)
        self.assertIn("isInstalled", status)
        self.assertIn("isBusy", status)
        self.assertIn("progressPct", status)
        self.assertIn("progressStep", status)
        self.assertIn("logs", status)
        print(f"[PASS] Status retrieved successfully: {status['gameDir']}, installed={status['isInstalled']}")

    def test_scan_game(self):
        res = self.api.scan_game()
        self.assertIn("gameDir", res)
        self.assertIn("isInstalled", res)
        print(f"[PASS] Scan game result: {res}")

if __name__ == "__main__":
    unittest.main()
