"""
Twitch Drops Headless Miner / Auto-Claimer (Python CLI)
Rút gọn từ cơ chế cốt lõi của DevilXD/TwitchDropsMiner.
Chạy trực tiếp bằng OAuth token mà không cần giao diện nặng nề.
"""

import sys
import time
import requests

GQL_URL = "https://gql.twitch.tv/gql"
CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko"

class TwitchDropsHeadless:
    def __init__(self, auth_token: str):
        # Làm sạch token nếu người dùng dán cả chuỗi "OAuth ..."
        self.auth_token = auth_token.replace("OAuth ", "").strip()
        self.session = requests.Session()
        self.session.headers.update({
            "Client-Id": CLIENT_ID,
            "Authorization": f"OAuth {self.auth_token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def get_inventory(self):
        query = """
        query Inventory {
            currentUser {
                id
                dropCampaignsInProgress {
                    id
                    name
                    status
                    game {
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
        res = self.session.post(GQL_URL, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        return data.get("data", {}).get("currentUser", {}).get("dropCampaignsInProgress", [])

    def claim_drop(self, drop_instance_id: str, drop_name: str) -> bool:
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
        res = self.session.post(GQL_URL, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        claimed_id = data.get("data", {}).get("claimDropPageReward", {}).get("dropInstanceID")
        return bool(claimed_id)

    def run_check_cycle(self):
        campaigns = self.get_inventory()
        if not campaigns:
            print("[INFO] Hiện không có chiến dịch Drops nào đang tiến hành.")
            return

        print("\n" + "=" * 55)
        print("          FEΔR // TWITCH DROPS MONITOR")
        print("=" * 55)

        for camp in campaigns:
            game_name = camp.get("game", {}).get("displayName", camp.get("name", "Unknown Game"))
            drops = camp.get("timeBasedDrops", [])
            print(f"\n[🎮 Game] {game_name}")

            for drop in drops:
                name = drop.get("name", "Drop Item")
                curr = drop.get("currentMinutesWatched", 0)
                req = drop.get("requiredMinutesWatched", 60)
                pct = min(100, int((curr / req) * 100))
                claimed = drop.get("isClaimed", False)
                drop_id = drop.get("dropInstanceID")

                status_str = "CLAIMED" if claimed else f"{pct}% ({curr}/{req}m)"
                print(f"  └─ {name} | {status_str}")

                if not claimed and curr >= req and drop_id:
                    print(f"     [⚡] Đang tự động nhận thưởng: {name}...")
                    if self.claim_drop(drop_id, name):
                        print(f"     [✓] CLAIM THÀNH CÔNG: {name}!")
                    else:
                        print(f"     [✗] Lỗi khi gửi lệnh claim {name}.")

        print("=" * 55)

if __name__ == "__main__":
    print("=" * 55)
    print("  TWITCH DROPS MINER - LIGHTWEIGHT PYTHON RUNNER")
    print("=" * 55)

    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = input("Nhập Twitch auth-token (lấy từ Cookie trình duyệt): ").strip()

    if not token:
        print("[!] Không có token, đang thoát.")
        sys.exit(1)

    miner = TwitchDropsHeadless(token)
    print("\n[+] Đang khởi chạy chu kỳ quét (Nhấn Ctrl+C để dừng)...")
    try:
        while True:
            miner.run_check_cycle()
            print("[💤] Đợi 60 giây trước lần quét tiếp theo...\n")
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n[!] Đã dừng chương trình.")
