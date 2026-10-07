"""
Unit Test Suite for AutoUpdater
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import unittest
from auto_updater import AutoUpdater

class TestAutoUpdater(unittest.TestCase):
    def test_version_comparison(self):
        self.assertTrue(AutoUpdater._is_newer("1.1.2", "1.1.1"))
        self.assertTrue(AutoUpdater._is_newer("1.2.0", "1.1.9"))
        self.assertTrue(AutoUpdater._is_newer("2.0.0", "1.9.9"))
        self.assertFalse(AutoUpdater._is_newer("1.1.1", "1.1.1"))
        self.assertFalse(AutoUpdater._is_newer("1.1.0", "1.1.1"))
        self.assertFalse(AutoUpdater._is_newer("1.1.1", "1.1.2"))

    def test_fetch_release_info(self):
        updater = AutoUpdater("1.1.1")
        info = updater.fetch_release_info()
        self.assertIsNone(info.get("error"))
        self.assertTrue(info["has_update"])
        self.assertEqual(info["latest_version"], "1.1.2")
        self.assertIsNotNone(info["exe_asset"])
        self.assertIsNotNone(info["zip_asset"])
        self.assertTrue(info["exe_asset"]["url"].startswith("https://"))
        self.assertTrue(info["zip_asset"]["url"].startswith("https://"))

if __name__ == "__main__":
    unittest.main()
