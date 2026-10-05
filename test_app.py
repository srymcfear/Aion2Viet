import os
import unittest
import app
from app import ModApi, is_admin, parse_release_security, is_newer_version, SECURITY_KEY

class TestModApi(unittest.TestCase):
    def setUp(self):
        self.api = ModApi()

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
        st1, msg1 = parse_release_security("Default release notes")
        self.assertEqual(st1, "active")

        st2, msg2 = parse_release_security("Notice\nfearAion2Tran-key:baotri:May chu dang bao tri")
        self.assertEqual(st2, "baotri")
        self.assertEqual(msg2, "May chu dang bao tri")

        st3, msg3 = parse_release_security("fearAion2Tran-key:lock:Ban bi khoa")
        self.assertEqual(st3, "lock")
        self.assertEqual(msg3, "Ban bi khoa")
        print("[PASS] Security key parsing for active/baotri/lock works as expected")

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
        self.assertNotIn("window", dir(self.api))
        self.assertIsNone(app._main_window)
        print("[PASS] Window controls handled gracefully and no window exposed to pywebview")

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

if __name__ == "__main__":
    unittest.main()

