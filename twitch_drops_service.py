"""
TWITCH DROPS MINER & AUTO-CLAIMER SERVICE
Integrated Plugin for F-Aion 2 Tools
Developed by Team FEΔR / SrymC
Clean, async, zero-hang daemon service based on DevilXD/TwitchDropsMiner GQL core.
"""

import os
import json
import time
import threading
import urllib.request
import urllib.error

GQL_ENDPOINT = "https://gql.twitch.tv/gql"
TWITCH_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko"

class TwitchDropsService:
    def __init__(self, storage_dir: str, log_callback=None):
        self.storage_dir = storage_dir
        self.config_file = os.path.join(storage_dir, "twitch_drops_config.json")
        self.log_callback = log_callback or (lambda msg, mtype="": None)
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread = None

        self.auth_token = ""
        self.auto_claim = True
        self.is_running = False
        self.check_interval = 60
        self.latest_campaigns = []
        self.claim_history = []
        self.last_checked = None
        self.account_name = None

        self._load_config()

    def _load_config(self):
        try:
            if os.path.isfile(self.config_file):
                with open(self.config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.auth_token = data.get("auth_token", "")
                    self.auto_claim = data.get("auto_claim", True)
                    self.claim_history = data.get("claim_history", [])[:30]
        except Exception as e:
            print(f"[TwitchDrops] Error loading config: {e}")

    def _save_config(self):
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
            data = {
                "auth_token": self.auth_token,
                "auto_claim": self.auto_claim,
                "claim_history": self.claim_history[:30]
            }
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[TwitchDrops] Error saving config: {e}")

    def set_auth_token(self, token: str):
        clean_token = token.replace("OAuth ", "").strip()
        with self._lock:
            self.auth_token = clean_token
            self._save_config()
        self.log_callback("Đã cập nhật Twitch OAuth Token.", "blue")
        # Trigger an immediate check in background
        threading.Thread(target=self._query_inventory, daemon=True).start()
        return True

    def set_auto_claim(self, enabled: bool):
        with self._lock:
            self.auto_claim = bool(enabled)
            self._save_config()
        return True

    def start(self):
        with self._lock:
            if self.is_running:
                return True
            if not self.auth_token:
                self.log_callback("⚠️ Cần nhập Twitch auth-token trước khi khởi chạy Plugin.", "red")
                return False

            self.is_running = True
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._worker_loop, daemon=True)
            self._thread.start()

        self.log_callback("✔ Plugin Twitch Drops Miner đã kích hoạt chạy ngầm.", "success")
        return True

    def stop(self):
        with self._lock:
            if not self.is_running:
                return True
            self.is_running = False
            self._stop_event.set()

        self.log_callback("Đã dừng Plugin Twitch Drops Miner.", "blue")
        return True

    def get_status(self):
        with self._lock:
            return {
                "isRunning": self.is_running,
                "hasToken": bool(self.auth_token),
                "autoClaim": self.auto_claim,
                "accountName": self.account_name,
                "lastChecked": self.last_checked,
                "campaigns": list(self.latest_campaigns),
                "claimHistory": list(self.claim_history[:15])
            }

    def _make_gql_request(self, payload: dict):
        if not self.auth_token:
            return None

        headers = {
            "Client-Id": TWITCH_CLIENT_ID,
            "Authorization": f"OAuth {self.auth_token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(GQL_ENDPOINT, data=req_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[TwitchDrops] GQL Request failed: {e}")
            return None

    def _query_inventory(self):
        query = """
        query Inventory {
            currentUser {
                id
                login
                displayName
                dropCampaignsInProgress {
                    id
                    name
                    status
                    game {
                        id
                        displayName
                    }
                    timeBasedDrops {
                        id
                        name
                        currentMinutesWatched
                        requiredMinutesWatched
                        isClaimed
                        dropInstanceID
                    }
                }
            }
        }
        """
        payload = {"operationName": "Inventory", "query": query}
        res = self._make_gql_request(payload)
        if not res:
            return

        user_data = res.get("data", {}).get("currentUser")
        if not user_data:
            self.log_callback("⚠️ Không thể xác thực tài khoản Twitch. Vui lòng kiểm tra lại auth-token.", "red")
            return

        account_name = user_data.get("displayName") or user_data.get("login")
        campaigns = user_data.get("dropCampaignsInProgress") or []

        with self._lock:
            self.account_name = account_name
            self.latest_campaigns = campaigns
            self.last_checked = time.strftime("%H:%M:%S")

        # Process Auto-Claim if enabled
        if self.auto_claim:
            for camp in campaigns:
                game_title = camp.get("game", {}).get("displayName", camp.get("name", "Game"))
                for drop in camp.get("timeBasedDrops", []):
                    drop_id = drop.get("dropInstanceID")
                    name = drop.get("name", "Drop Item")
                    curr = drop.get("currentMinutesWatched", 0)
                    req = drop.get("requiredMinutesWatched", 60)
                    claimed = drop.get("isClaimed", False)

                    if not claimed and curr >= req and drop_id:
                        self._claim_drop_internal(drop_id, name, game_title)

    def _claim_drop_internal(self, drop_instance_id: str, drop_name: str, game_title: str):
        mutation = """
        mutation ClaimDropPageReward($input: ClaimDropPageRewardInput!) {
            claimDropPageReward(input: $input) {
                dropInstanceID
                __typename
            }
        }
        """
        payload = {
            "operationName": "ClaimDropPageReward",
            "query": mutation,
            "variables": {"input": {"dropInstanceID": drop_instance_id}}
        }
        res = self._make_gql_request(payload)
        claimed_id = res.get("data", {}).get("claimDropPageReward", {}).get("dropInstanceID") if res else None

        if claimed_id:
            now_str = time.strftime("%H:%M:%S")
            log_item = {
                "time": now_str,
                "dropName": drop_name,
                "gameName": game_title
            }
            with self._lock:
                self.claim_history.insert(0, log_item)
                if len(self.claim_history) > 30:
                    self.claim_history.pop()
                self._save_config()

            self.log_callback(f"🎁 NHẬN DROP THÀNH CÔNG: [{drop_name}] - {game_title}!", "success")
            return True
        return False

    def claim_drop_manual(self, drop_instance_id: str, drop_name: str = "Item"):
        return self._claim_drop_internal(drop_instance_id, drop_name, "Twitch")

    def _worker_loop(self):
        while not self._stop_event.is_set():
            try:
                self._query_inventory()
            except Exception as e:
                print(f"[TwitchDrops] Worker loop error: {e}")

            # Sleep in intervals so stop_event is responsive
            for _ in range(self.check_interval):
                if self._stop_event.is_set():
                    break
                time.sleep(1)
