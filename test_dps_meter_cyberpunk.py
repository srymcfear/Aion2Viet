"""
Unit tests for FEΔR Cyberpunk Combat Meter Plugin
"""

import os
import unittest
import json

class TestCyberpunkDpsMeterPlugin(unittest.TestCase):
    def setUp(self):
        self.plugin_dir = os.path.join(os.path.dirname(__file__), "plugins", "dps_meter_cyberpunk")

    def test_plugin_manifest_exists_and_valid(self):
        manifest_path = os.path.join(self.plugin_dir, "plugin.json")
        self.assertTrue(os.path.isfile(manifest_path), "plugin.json must exist")
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data.get("id"), "fear_cyberpunk_dps_meter")
        self.assertEqual(data.get("author"), "FEΔR")
        self.assertEqual(data.get("entry"), "plugin_app.py")

    def test_overlay_html_exists_and_has_cyberpunk_elements(self):
        html_path = os.path.join(self.plugin_dir, "overlay.html")
        self.assertTrue(os.path.isfile(html_path), "overlay.html must exist")
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("FEΔR", content)
        self.assertIn("updateCombatData", content)
        self.assertIn("updateBossData", content)
        self.assertIn("setAggroTarget", content)
        self.assertIn("updateTelemetry", content)

    def test_plugin_controller_importable(self):
        import sys
        sys.path.insert(0, os.path.dirname(__file__))
        from plugins.dps_meter_cyberpunk import get_html_path
        self.assertTrue(os.path.isfile(get_html_path()))

if __name__ == "__main__":
    unittest.main()
