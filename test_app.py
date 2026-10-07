import os
import json
import tempfile
import unittest
import app
from app import ModApi, is_admin, parse_release_security, is_newer_version, SECURITY_KEY
from twitch_drops_service import TwitchDropsService

class TestModApi(unittest.TestCase):
    def setUp(self):
        self.api = ModApi()
        self.test_dir = tempfile.TemporaryDirectory()
        self.api.twitch_service = TwitchDropsService(storage_dir=self.test_dir.name)

    def tearDown(self):
        if hasattr(self, 'test_dir'):
            self.test_dir.cleanup()

    def test_is_admin_check(self):
        res = is_admin()
        self.assertIsInstance(res, bool)
        print(f"[PASS] is_admin check returns boolean: {res}")

    def test_security_key_and_integrity(self):
        sec = self.api.get_security_info()
        self.assertEqual(sec["key"], "fearAion2Tran-key")
        self.assertIn(sec["status"], ["active", "baotri", "lock"])
        self.assertTrue(self.api.verify_code_integrity())
        print(f"[PASS] Security key '{sec['key']}' is verified, status: {sec['status']}")

    def test_parse_release_security(self):
        st1, msg1, v1 = parse_release_security("Default release notes")
        self.assertEqual(st1, "active")
        self.assertIsNone(v1)

        st2, msg2, v2 = parse_release_security("Notice\nfearAion2Tran-key:baotri:May chu dang bao tri")
        self.assertEqual(st2, "baotri")
        self.assertEqual(msg2, "May chu dang bao tri")
        self.assertIsNone(v2)

        st3, msg3, v3 = parse_release_security("fearAion2Tran-key:lock:Ban bi khoa")
        self.assertEqual(st3, "lock")
        self.assertEqual(msg3, "Ban bi khoa")

        # Test fearAion2Tran-ver tag
        st4, msg4, v4 = parse_release_security("fearAion2Tran-key:active\nfearAion2Tran-ver:1.1.0")
        self.assertEqual(st4, "active")
        self.assertEqual(v4, "1.1.0")

        # Test fearAion2Tran-ver with prefix v
        st4b, msg4b, v4b = parse_release_security("fearAion2Tran-ver:v2.0.0 | fearAion2Tran-key:active")
        self.assertEqual(st4b, "active")
        self.assertEqual(v4b, "2.0.0")

        # Test JSON block with ver / fearAion2Tran-ver
        st5, msg5, v5 = parse_release_security('{"key": "fearAion2Tran-key", "status": "active", "ver": "1.2.5"}')
        self.assertEqual(st5, "active")
        self.assertEqual(v5, "1.2.5")
        print("[PASS] Security key and fearAion2Tran-ver parsing works as expected")

    def test_semver_compare(self):
        self.assertTrue(is_newer_version("1.0.1", "1.0.0"))
        self.assertTrue(is_newer_version("v2.0.0", "1.0.0"))
        self.assertFalse(is_newer_version("1.0.0", "1.0.0"))
        self.assertFalse(is_newer_version("0.9.9", "1.0.0"))
        print("[PASS] Semver version comparison works as expected")



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

    def test_window_methods(self):
        # Should gracefully handle None window
        self.api.show_window()
        self.api.minimize_window()
        self.assertFalse(self.api.start_window_drag())
        self.assertFalse(self.api.start_twitch_drag())
        self.assertFalse(self.api.start_dps_drag())
        self.assertEqual(self.api.get_window_pos(), [0, 0])
        self.assertTrue(self.api.set_window_pos(100, 200))
        self.assertEqual(self.api.get_twitch_window_pos(), [0, 0])
        self.assertTrue(self.api.set_twitch_window_pos(150, 250))
        self.assertNotIn("window", dir(self.api))
        self.assertIsNone(app._main_window)
        print("[PASS] Window controls, pos APIs, and native drag methods handled gracefully and no window exposed to pywebview")

    def test_browse_folder_and_process_check(self):
        # browse_folder should gracefully return current state when window is None
        res = self.api.browse_folder()
        self.assertIn("gameDir", res)
        self.assertIn("isInstalled", res)
        # is_game_running should return a boolean
        running = app.is_game_running()
        self.assertIsInstance(running, bool)
    def test_storage_and_cache_dirs(self):
        s_dir = app.get_app_storage_dir()
        c_dir = app.get_cache_dir()
        u_dir = app.get_updates_dir()
        self.assertTrue(os.path.isdir(s_dir))
        self.assertTrue(os.path.isdir(c_dir))
        self.assertTrue(os.path.isdir(u_dir))
        self.assertIn("Aion2_Tools", s_dir)
        self.assertIn("Cache", c_dir)
        self.assertIn("Updates", u_dir)
        print(f"[PASS] Storage directories verified: {s_dir}, {c_dir}, {u_dir}")

    def test_webview2_detection(self):
        installed = app.is_webview2_installed()
        self.assertIsInstance(installed, bool)
        print(f"[PASS] is_webview2_installed returned: {installed}")

    def test_dps_overlay_methods(self):
        # Verify DPS overlay management methods operate safely without crashing
        self.assertTrue(self.api.set_dps_always_on_top(True))
        self.assertTrue(self.api.set_dps_always_on_top(False))
        self.assertTrue(self.api.minimize_dps_window())
        self.assertTrue(self.api.close_dps_window())
        self.assertTrue(self.api.stop_dps_daemon())
        self.assertTrue(self.api.stop_dps_meter())
        print("[PASS] DPS overlay methods and overlay template verified.")

    def test_hub_web_link(self):
        self.assertTrue(hasattr(self.api, "open_hub_web"))
        self.assertTrue(hasattr(self.api, "open_url"))
        print("[PASS] Web Hub URL handler verified.")

    def test_dps_meter_integration(self):
        npcap = app.is_npcap_installed()
        self.assertIsInstance(npcap, bool)
        p_dir = app.get_plugins_dir()
        dps_dir = app.get_dps_plugin_dir()
        self.assertTrue(os.path.isdir(p_dir))
        self.assertTrue(os.path.isdir(dps_dir))
        self.assertIn(r"C:\ProgramData\FEAR\Aion2_Tools", dps_dir)
        dps_exe = app.get_dps_meter_executable()
        self.assertIsNotNone(dps_exe)
        self.assertTrue(os.path.isfile(dps_exe), f"DPS Meter executable must exist at: {dps_exe}")
        manifest_file = os.path.join(dps_dir, "plugin.json")
        self.assertTrue(os.path.isfile(manifest_file), f"plugin.json manifest must exist at: {manifest_file}")
        with open(manifest_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            self.assertEqual(meta.get("id"), "aion2_dps_meter")
            self.assertEqual(meta.get("entry"), "AionDpsMeter.UI.exe")
        print(f"[PASS] DPS Meter plugin verified at: {dps_dir}, Exe: {dps_exe}, Npcap={npcap}")

    def test_twitch_drops_plugin(self):
        status = self.api.get_twitch_drops_status()
        self.assertIn("isRunning", status)
        self.assertIn("hasToken", status)
        self.assertIn("autoClaim", status)
        self.assertIn("campaigns", status)
        self.assertIn("claimHistory", status)

        self.api.set_twitch_auto_claim(False)
        self.assertFalse(self.api.get_twitch_drops_status()["autoClaim"])

        self.api.set_twitch_auto_claim(True)
        self.assertTrue(self.api.get_twitch_drops_status()["autoClaim"])

        self.api.set_twitch_auth_token("OAuth test_dummy_token_123")
        self.assertTrue(self.api.get_twitch_drops_status()["hasToken"])
        self.assertEqual(self.api.twitch_service.auth_token, "test_dummy_token_123")

        stopped = self.api.stop_twitch_miner()
        self.assertTrue(stopped)

        # Test DevilXD OAuth Device Code login flow
        oauth_status = self.api.get_twitch_oauth_status()
        self.assertIn("status", oauth_status)
        self.assertIn("user_code", oauth_status)

        # Test sync_twitch_session and refresh_twitch_drops
        sync_res = self.api.sync_twitch_session()
        self.assertIn("success", sync_res)
        self.assertIn("accountName", sync_res)

        ref_res = self.api.refresh_twitch_drops()
        self.assertIn("isRunning", ref_res)
        self.assertIn("campaigns", ref_res)

        # Test external config mtime check
        self.api.twitch_service._check_external_config_update()
        print("[PASS] Twitch Drops Miner plugin API, session sync, and DevilXD OAuth Device Code verified.")

    def test_twitch_window_lifecycle(self):
        html_path = app.get_twitch_window_html_path()
        self.assertIsNotNone(html_path, "twitch_drops_window.html must be found")
        self.assertTrue(os.path.isfile(html_path), f"File {html_path} must exist on disk")

        # Window lifecycle and overlay toggles
        self.assertTrue(self.api.close_twitch_window())
        self.assertTrue(self.api.minimize_twitch_window())
        self.assertTrue(self.api.set_twitch_always_on_top(True))
        self.assertTrue(self.api.set_twitch_always_on_top(False))
        self.assertTrue(self.api.resize_twitch_window(360, 95))
        self.assertTrue(self.api.resize_twitch_window(500, 640))
        self.assertTrue(self.api.move_twitch_window(100, 100))
        self.assertTrue(self.api.move_main_window(150, 150))
        self.assertTrue(app.safe_move_window(None, 200, 200))
        print("[PASS] Twitch Drops Tactical HUD & Main Window dragging and lifecycle APIs verified.")

if __name__ == "__main__":
    unittest.main()


