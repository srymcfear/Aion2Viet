"""
TWITCH DROPS MINER & AUTO-CLAIMER SERVICE
Integrated Plugin for F-Aion 2 Tools
Developed by Team FEΔR / SrymC
Clean, async, zero-hang daemon service based on DevilXD/TwitchDropsMiner GQL & OAuth core.
"""

import os
import json
import time
import base64
import gzip
import datetime
import threading
import urllib.request
import urllib.error
import urllib.parse
import webbrowser

GQL_ENDPOINT = "https://gql.twitch.tv/gql"
SPADE_ENDPOINT = "https://spade.twitch.tv/track"
TWITCH_WEB_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko"

# DevilXD's Exact OAuth Formula (SmartTV Device Code Flow)
DEVILXD_CLIENT_ID = "ue6666qo983tsx6so1t0vnawi233wa"
OAUTH_DEVICE_URL = "https://id.twitch.tv/oauth2/device"
OAUTH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
OAUTH_VALIDATE_URL = "https://id.twitch.tv/oauth2/validate"

# DevilXD's Exact GQL Persisted Queries
INVENTORY_PERSISTED_HASH = "8337eb8541b314040b0edde0c09c5c7a2783ba1960aa9edfbf3bac16d0fec404"
CLAIM_PERSISTED_HASH = "a455deea71bdc9015b78eb49f4acfbce8baa7ccbedd28e549bb025bd0f751930"

class TwitchDropsService:
    def __init__(self, storage_dir: str, log_callback=None):
        self.storage_dir = storage_dir
        self.config_file = os.path.join(storage_dir, "twitch_drops_config.json")
        self.log_callback = log_callback or (lambda msg, mtype="": None)
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread = None
        self._last_config_mtime = 0

        self.auth_token = ""
        self.auto_claim = True
        self.is_running = False
        self.check_interval = 60
        self.latest_campaigns = []
        self.claim_history = []
        self.last_checked = None
        self.account_name = None
        self.user_id = ""
        self.current_channel = None
        self.minutes_mined = 0
        self.client_id = DEVILXD_CLIENT_ID
        self._notified_integrity_drops = set()
        self.active_status_text = ""

        # OAuth State (DevilXD Device Code Formula)
        self.oauth_state = {
            "status": "idle", # "idle", "pending", "success", "error", "expired"
            "user_code": "",
            "device_code": "",
            "verification_uri": "https://www.twitch.tv/activate",
            "activate_url": "https://www.twitch.tv/activate",
            "expires_at": 0,
            "error_message": "",
            "poll_count": 0,
            "last_poll_msg": ""
        }

        self._load_config()

        # Validate token on startup if present
        if self.auth_token:
            threading.Thread(target=self._validate_and_refresh, daemon=True).start()

    def _load_config(self):
        try:
            if os.path.isfile(self.config_file):
                self._last_config_mtime = os.path.getmtime(self.config_file)
                with open(self.config_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        data = json.loads(content)
                        self.auth_token = data.get("auth_token", "")
                        self.client_id = data.get("client_id", DEVILXD_CLIENT_ID)
                        self.auto_claim = data.get("auto_claim", True)
                        self.account_name = data.get("account_name", "")
                        self.user_id = data.get("user_id", "")
                        self.claim_history = data.get("claim_history", [])[:30]
        except Exception:
            pass

    def _check_external_config_update(self):
        """Checks if config file was modified externally (e.g. by login window) and reloads it."""
        try:
            if os.path.isfile(self.config_file):
                mtime = os.path.getmtime(self.config_file)
                if self._last_config_mtime != mtime:
                    self._last_config_mtime = mtime
                    self._load_config()
                    if self.auth_token and not self.user_id:
                        threading.Thread(target=self._validate_and_refresh, daemon=True).start()
        except Exception:
            pass

    def _save_config(self):
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
            data = {
                "auth_token": self.auth_token,
                "client_id": self.client_id or DEVILXD_CLIENT_ID,
                "auto_claim": self.auto_claim,
                "account_name": self.account_name,
                "user_id": self.user_id,
                "claim_history": self.claim_history[:30]
            }
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[TwitchDrops] Error saving config: {e}")

    def validate_token(self):
        if not self.auth_token:
            return None
        try:
            req = urllib.request.Request(
                OAUTH_VALIDATE_URL,
                headers={
                    "Authorization": f"OAuth {self.auth_token}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                val = json.loads(resp.read().decode("utf-8"))
                name = val.get("login") or val.get("user_id")
                uid = str(val.get("user_id", ""))
                cid = val.get("client_id")
                with self._lock:
                    self.account_name = name
                    if uid:
                        self.user_id = uid
                    if cid:
                        self.client_id = cid
                    self._save_config()
                return val
        except urllib.error.HTTPError as e:
            if e.code == 401:
                with self._lock:
                    self.account_name = None
                    self.auth_token = ""
                    self.is_running = False
                    self._save_config()
                self.log_callback("⚠️ Token Twitch không hợp lệ hoặc đã hết hạn (401 Unauthorized). Vui lòng đăng nhập lại.", "gray")
            else:
                print(f"[TwitchDrops] Token validate error: {e}")
            return None
        except Exception as e:
            print(f"[TwitchDrops] Token validate error: {e}")
            return None

    def _validate_and_refresh(self):
        self.validate_token()
        self._query_inventory()

    # -------------------------------------------------------------------------
    # Exact DevilXD OAuth Device Code Login Formula
    # -------------------------------------------------------------------------
    def start_oauth_login(self, auto_open_browser: bool = True):
        headers = {
            "Accept": "application/json",
            "Client-Id": DEVILXD_CLIENT_ID,
            "User-Agent": "Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        payload = urllib.parse.urlencode({
            "client_id": DEVILXD_CLIENT_ID,
            "scopes": ""
        }).encode("utf-8")

        try:
            req = urllib.request.Request(OAUTH_DEVICE_URL, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            device_code = data["device_code"]
            user_code = data["user_code"]
            interval = data.get("interval", 5)
            verification_uri = data.get("verification_uri", "https://www.twitch.tv/activate")
            expires_in = data.get("expires_in", 1800)
            activate_url = f"{verification_uri}?device-code={user_code}"

            with self._lock:
                self.oauth_state = {
                    "status": "pending",
                    "user_code": user_code,
                    "device_code": device_code,
                    "verification_uri": verification_uri,
                    "activate_url": activate_url,
                    "expires_at": time.time() + expires_in,
                    "error_message": ""
                }

            self.log_callback(f"Mã kích hoạt Twitch: [{user_code}]. Đang mở trang xác thực tự động...", "blue")

            if auto_open_browser:
                try:
                    webbrowser.open(activate_url)
                except Exception:
                    pass

            # Start background polling thread
            threading.Thread(
                target=self._poll_oauth_token,
                args=(device_code, interval, time.time() + expires_in),
                daemon=True
            ).start()

            return {
                "success": True,
                "userCode": user_code,
                "verificationUri": verification_uri,
                "activateUrl": activate_url
            }
        except Exception as e:
            self.log_callback(f"Lỗi khởi tạo đăng nhập Twitch OAuth: {e}", "red")
            with self._lock:
                self.oauth_state["status"] = "error"
                self.oauth_state["error_message"] = str(e)
            return {"success": False, "error": str(e)}

    def _poll_oauth_token(self, device_code: str, interval: int, expires_at: float):
        headers = {
            "Accept": "application/json",
            "Client-Id": DEVILXD_CLIENT_ID,
            "User-Agent": "Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        payload = urllib.parse.urlencode({
            "client_id": DEVILXD_CLIENT_ID,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
        }).encode("utf-8")

        poll_count = 0
        while time.time() < expires_at:
            time.sleep(interval)
            poll_count += 1
            try:
                req = urllib.request.Request(OAUTH_TOKEN_URL, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        access_token = data.get("access_token")
                        if access_token:
                            with self._lock:
                                self.auth_token = access_token
                                self.client_id = DEVILXD_CLIENT_ID
                                self.oauth_state["status"] = "idle"
                                self.oauth_state["user_code"] = ""
                                self.oauth_state["error_message"] = ""
                                self.oauth_state["poll_count"] = poll_count
                                self.oauth_state["last_poll_msg"] = "success"
                                self._save_config()

                            # Immediately validate username
                            self.validate_token()
                            name_str = f": [{self.account_name}]" if self.account_name else ""
                            self.log_callback(f"✔ Đăng nhập Twitch thành công{name_str}! Đã tự động nhận OAuth Token.", "success")
                            self._query_inventory()
                            return
            except urllib.error.HTTPError as e:
                err_msg = ""
                try:
                    raw_body = e.read().decode("utf-8")
                    err_data = json.loads(raw_body)
                    err_msg = err_data.get("message", "")
                except Exception:
                    err_msg = str(e)

                with self._lock:
                    self.oauth_state["poll_count"] = poll_count
                    self.oauth_state["last_poll_msg"] = err_msg

                if err_msg == "authorization_pending" or (e.code == 400 and not err_msg):
                    continue
                elif err_msg == "slow_down":
                    time.sleep(5)
                    continue
                elif err_msg in ("authorization_declined", "expired_token", "invalid device code"):
                    with self._lock:
                        self.oauth_state["status"] = "error"
                        self.oauth_state["error_message"] = f"Mã xác thực đã hết hạn hoặc bị từ chối ({err_msg}). Vui lòng bấm [ĐĂNG NHẬP] để lấy mã mới."
                    self.log_callback(f"❌ Twitch OAuth: {self.oauth_state['error_message']}", "red")
                    return
                else:
                    print(f"[TwitchDrops] OAuth poll error {e.code}: {err_msg}")
            except Exception as e:
                print(f"[TwitchDrops] OAuth poll error: {e}")

        with self._lock:
            self.oauth_state["status"] = "expired"
            self.oauth_state["error_message"] = "Mã kích hoạt đăng nhập Twitch đã hết hạn. Vui lòng lấy mã mới."
        self.log_callback("Mã kích hoạt đăng nhập Twitch đã hết hạn.", "red")

    def get_oauth_status(self):
        with self._lock:
            return dict(self.oauth_state)

    # -------------------------------------------------------------------------
    # Core Miner Logic
    # -------------------------------------------------------------------------
    def set_auth_token(self, token: str):
        clean_token = token.replace("OAuth ", "").strip()
        with self._lock:
            self.auth_token = clean_token
            self.oauth_state["status"] = "idle"
            self.oauth_state["user_code"] = ""
            self._save_config()
        self.log_callback("Đã cập nhật Twitch OAuth Token.", "blue")
        threading.Thread(target=self._validate_and_refresh, daemon=True).start()
        return True

    def _safe_log(self, msg: str, mtype: str = ""):
        try:
            if self.log_callback:
                self.log_callback(msg, mtype)
        except Exception:
            pass

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
                self._safe_log("⚠️ Cần đăng nhập tài khoản Twitch trước khi khởi chạy Plugin.", "red")
                return False

            self.is_running = True
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._worker_loop, daemon=True)
            self._thread.start()

        self._safe_log("✔ Plugin Twitch Drops Miner đã kích hoạt chạy ngầm.", "success")
        return True

    def stop(self):
        with self._lock:
            if not self.is_running:
                return True
            self.is_running = False
            self.active_status_text = ""
            self._stop_event.set()

        self._safe_log("Đã dừng Plugin Twitch Drops Miner.", "blue")
        return True

    def get_status(self):
        self._check_external_config_update()
        with self._lock:
            # Auto-trigger inventory query if token exists but campaigns list is empty
            if self.auth_token and not self.latest_campaigns and not getattr(self, "_querying_inv", False):
                self._querying_inv = True
                def _do_query():
                    try:
                        if not self.user_id:
                            self.validate_token()
                        self._query_inventory()
                    except Exception as e:
                        print(f"[TwitchDrops] Auto-query inventory error: {e}")
                    finally:
                        self._querying_inv = False
                threading.Thread(target=_do_query, daemon=True).start()

            return {
                "isRunning": self.is_running,
                "hasToken": bool(self.auth_token),
                "autoClaim": self.auto_claim,
                "accountName": self.account_name,
                "userId": self.user_id,
                "currentChannel": dict(self.current_channel) if self.current_channel else None,
                "minutesMined": self.minutes_mined,
                "activeStatusText": getattr(self, "active_status_text", ""),
                "lastChecked": self.last_checked,
                "campaigns": list(self.latest_campaigns),
                "claimHistory": list(self.claim_history[:15]),
                "oauthState": dict(self.oauth_state)
            }

    def _make_gql_request(self, payload: dict):
        if not self.auth_token:
            return None

        headers = {
            "Client-Id": self.client_id or DEVILXD_CLIENT_ID,
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
        except urllib.error.HTTPError as e:
            if e.code == 401:
                # Double check with validate endpoint before destroying session
                if not self.validate_token():
                    with self._lock:
                        self.account_name = None
                        self.auth_token = ""
                        self.is_running = False
                        self._save_config()
                    self.log_callback("⚠️ Phiên đăng nhập Twitch hết hạn (401 Unauthorized). Vui lòng đăng nhập lại.", "gray")
            else:
                print(f"[TwitchDrops] GQL HTTP error: {e}")
            return None
        except Exception as e:
            print(f"[TwitchDrops] GQL Request failed: {e}")
            return None

    def _query_inventory(self):
        # DevilXD Exact Inventory Persisted Query
        payload = {
            "operationName": "Inventory",
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": INVENTORY_PERSISTED_HASH
                }
            },
            "variables": {
                "fetchRewardCampaigns": True
            }
        }

        res = self._make_gql_request(payload)
        if not res:
            return

        raw_camps = res.get("data", {}).get("currentUser", {}).get("inventory", {}).get("dropCampaignsInProgress", [])
        campaigns = []

        for rc in raw_camps:
            game_obj = rc.get("game") or {}
            game_title = game_obj.get("name") or game_obj.get("displayName") or rc.get("name") or "AION 2"
            timed_drops = []

            for d in rc.get("timeBasedDrops", []):
                self_edge = d.get("self") or {}
                curr = self_edge.get("currentMinutesWatched", 0)
                req_m = d.get("requiredMinutesWatched", 60)
                claimed = self_edge.get("isClaimed", False)
                drop_id = self_edge.get("dropInstanceID")

                image_url = None
                benefit_edges = d.get("benefitEdges") or []
                if benefit_edges:
                    benefit = benefit_edges[0].get("benefit") or {}
                    image_url = benefit.get("imageAssetURL")

                timed_drops.append({
                    "id": d.get("id"),
                    "name": d.get("name", "Drop Item"),
                    "imageUrl": image_url,
                    "currentMinutesWatched": curr,
                    "requiredMinutesWatched": req_m,
                    "isClaimed": claimed,
                    "dropInstanceID": drop_id
                })

                # Auto-claim check
                if self.auto_claim and not claimed and curr >= req_m and drop_id:
                    if drop_id not in self._notified_integrity_drops:
                        self._claim_drop_internal(drop_id, d.get("name", "Drop Item"), game_title)

            campaigns.append({
                "id": rc.get("id"),
                "name": rc.get("name"),
                "game": {"displayName": game_title},
                "timeBasedDrops": timed_drops
            })

        with self._lock:
            self.latest_campaigns = campaigns
            self.last_checked = time.strftime("%H:%M:%S")

    def _claim_drop_internal(self, drop_instance_id: str, drop_name: str, game_title: str):
        payload = {
            "operationName": "DropsPage_ClaimDropRewards",
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": CLAIM_PERSISTED_HASH
                }
            },
            "variables": {
                "input": {
                    "dropInstanceID": drop_instance_id
                }
            }
        }
        res = self._make_gql_request(payload)
        # Check success or errors
        errors = res.get("errors") if res else None
        if not errors:
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
        else:
            err_msg = errors[0].get("message", "Unknown error")
            if "integrity" in err_msg.lower():
                with self._lock:
                    self._notified_integrity_drops.add(drop_instance_id)
                self.log_callback(f"🔔 Phần thưởng [{drop_name}] đã sẵn sàng nhận 100%! Hãy bấm nút 'Kho Drops' để nhận trực tiếp trên Twitch.", "blue")
            else:
                print(f"[TwitchDrops] Claim result: {err_msg}")
            return False

    def claim_drop_manual(self, drop_instance_id: str, drop_name: str = "Item"):
        success = self._claim_drop_internal(drop_instance_id, drop_name, "Twitch")
        if not success:
            # If integrity blocked direct headless mutation, open browser inventory for 1-click claim
            try:
                webbrowser.open("https://www.twitch.tv/drops/inventory")
            except Exception:
                pass
        return success

    def _find_target_stream(self, game_slug: str = "aion-2"):
        query = {
            "query": """
            query GetGameStreams($slug: String!) {
                game(slug: $slug) {
                    id
                    name
                    streams(first: 10) {
                        edges {
                            node {
                                id
                                title
                                viewersCount
                                broadcaster {
                                    id
                                    login
                                    displayName
                                }
                            }
                        }
                    }
                }
            }
            """,
            "variables": {"slug": game_slug}
        }
        res = self._make_gql_request(query)
        if not res:
            return None
        game_data = res.get("data", {}).get("game", {})
        game_id = str(game_data.get("id") or "771448419")
        game_name = str(game_data.get("name") or "AION 2")
        streams = game_data.get("streams", {}).get("edges", [])
        if not streams:
            return None
        top = streams[0].get("node", {})
        broadcaster = top.get("broadcaster", {})
        return {
            "login": broadcaster.get("login"),
            "displayName": broadcaster.get("displayName") or broadcaster.get("login"),
            "channelId": str(broadcaster.get("id")),
            "broadcastId": str(top.get("id")),
            "viewers": top.get("viewersCount", 0),
            "title": top.get("title", ""),
            "gameId": game_id,
            "gameName": game_name
        }

    def _send_watch_tick(self, stream_info: dict) -> bool:
        if not self.auth_token or not self.user_id or not stream_info:
            return False

        now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        streamer_login = stream_info["login"]
        broadcast_id = stream_info["broadcastId"]
        channel_id = stream_info["channelId"]
        game_name = stream_info.get("gameName") or "AION 2"
        game_id = stream_info.get("gameId") or "771448419"

        watch_event = [
            {
                "event": "minute-watched",
                "properties": {
                    "broadcast_id": str(broadcast_id),
                    "channel_id": str(channel_id),
                    "channel": str(streamer_login),
                    "client_time": now_iso,
                    "game": str(game_name),
                    "game_id": str(game_id),
                    "hidden": False,
                    "is_live": True,
                    "live": True,
                    "logged_in": True,
                    "minutes_logged": 1,
                    "muted": False,
                    "user_id": str(self.user_id)
                }
            }
        ]

        raw_json = json.dumps(watch_event, separators=(',', ':'))
        gz_b64 = base64.b64encode(gzip.compress(raw_json.encode("utf-8"))).decode("utf-8")
        b64_raw = base64.b64encode(raw_json.encode("utf-8")).decode("utf-8")

        tick_ok = False
        client_id_to_use = self.client_id or TWITCH_WEB_CLIENT_ID

        # Dispatch 1: Modern GQL sendSpadeEvents mutation (Twitch Web / Mobile)
        try:
            gql_body = {
                "operationName": "SendEvents",
                "query": "mutation SendEvents($input: SendSpadeEventsInput!) {\n  sendSpadeEvents(input: $input) {\n    statusCode\n  }\n}",
                "variables": {
                    "input": {
                        "data": gz_b64,
                        "repository": "twilight",
                        "encoding": "GZIP_B64"
                    }
                }
            }
            req_gql = urllib.request.Request(
                GQL_ENDPOINT,
                data=json.dumps(gql_body).encode("utf-8"),
                headers={
                    "Client-Id": client_id_to_use,
                    "Authorization": f"OAuth {self.auth_token}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                },
                method="POST"
            )
            with urllib.request.urlopen(req_gql, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    code = data.get("data", {}).get("sendSpadeEvents", {}).get("statusCode")
                    if code in (200, 204):
                        tick_ok = True
        except Exception as e:
            pass

        # Dispatch 2: Standard Spade Track endpoint (DevilXD fallback)
        try:
            payload_spade = urllib.parse.urlencode({"data": b64_raw}).encode("utf-8")
            headers_spade = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": "https://www.twitch.tv",
                "Referer": f"https://www.twitch.tv/{streamer_login}",
                "Client-Id": client_id_to_use,
                "Authorization": f"OAuth {self.auth_token}"
            }
            req_spade = urllib.request.Request(SPADE_ENDPOINT, data=payload_spade, headers=headers_spade, method="POST")
            with urllib.request.urlopen(req_spade, timeout=10) as resp:
                if resp.status in (200, 204):
                    tick_ok = True
        except Exception as e:
            pass

        return tick_ok

    def _worker_loop(self):
        try:
            # Initial inventory query & ensure user_id
            self._check_external_config_update()
            if not self.user_id:
                self.validate_token()
            self._query_inventory()
        except Exception:
            pass

        while not self._stop_event.is_set():
            try:
                self._check_external_config_update()
                if not self.user_id:
                    self.validate_token()

                # 1. Ensure target stream is active
                if not self.current_channel:
                    stream = self._find_target_stream("aion-2")
                    if stream:
                        with self._lock:
                            self.current_channel = stream
                        viewers_cnt = stream.get("viewers", 0)
                        self._safe_log(
                            f"📺 Đang tự động xem ngầm: [{stream['displayName']}] (AION 2 - {viewers_cnt:,} viewers)",
                            "success"
                        )
                    else:
                        self.active_status_text = "Chưa tìm thấy kênh AION 2 trực tiếp. Đang thử lại..."
                        self._safe_log("⚠️ Chưa tìm thấy kênh phát AION 2 trực tiếp. Đang thử lại sau 30s...", "red")
                        for _ in range(30):
                            if self._stop_event.is_set():
                                return
                            time.sleep(1)
                        continue

                # 2. Send 1 minute watch tick
                succeeded = self._send_watch_tick(self.current_channel)
                if succeeded:
                    with self._lock:
                        self.minutes_mined += 1

                    # Query inventory every tick so UI and user get instant +1 min updates
                    self._query_inventory()

                    # Find active drop in progress
                    active_drop = None
                    for c in self.latest_campaigns:
                        for d in c.get("timeBasedDrops", []):
                            if not d.get("isClaimed") and d.get("currentMinutesWatched", 0) < d.get("requiredMinutesWatched", 1):
                                active_drop = d
                                break
                        if active_drop:
                            break

                    ch_name = self.current_channel["displayName"]
                    if active_drop:
                        cur = active_drop["currentMinutesWatched"]
                        req = active_drop["requiredMinutesWatched"]
                        pct = min(100, round((cur / req) * 100))
                        self.active_status_text = f"Đang cày: {active_drop['name']} ({cur}/{req}m - {pct}%)"
                        self._safe_log(
                            f"⏱️ Đang cày ngầm [{ch_name}]: {active_drop['name']} ({cur}/{req}m - {pct}%)",
                            "blue"
                        )
                    else:
                        self.active_status_text = f"Đang xem [{ch_name}] (+{self.minutes_mined}m)"
                        self._safe_log(f"⏱️ Đang cày ngầm [{ch_name}]... Đã tích lũy +{self.minutes_mined}m phiên này.", "blue")
                else:
                    self._safe_log("Đang làm mới thông tin kênh phát...", "blue")
                    new_stream = self._find_target_stream("aion-2")
                    if new_stream:
                        with self._lock:
                            self.current_channel = new_stream
                        self._safe_log(
                            f"🔄 Chuyển sang kênh phát sóng tiếp theo: [{new_stream['displayName']}]",
                            "blue"
                        )
            except Exception:
                pass

            # 3. Wait ~59s before next minute tick (DevilXD WATCH_INTERVAL)
            for _ in range(59):
                if self._stop_event.is_set():
                    break
                time.sleep(1)

        with self._lock:
            self.current_channel = None
            self.active_status_text = ""
