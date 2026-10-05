/**
 * Twitch Drops Auto Miner & Claimer - Content Script
 * Inspired by DevilXD/TwitchDropsMiner GQL & Auto-Claim logic
 * Team FEAR / SrymC
 */

const TWITCH_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
const GQL_ENDPOINT = "https://gql.twitch.tv/gql";

// State
let config = {
  autoClaim: true,
  antiAfk: true,
  ecoMode: false,
  autoMute: false
};

let latestCampaigns = [];
let lastClaimedTime = null;
let claimLog = [];

// Initialize config from chrome storage
chrome.storage.local.get(["autoClaim", "antiAfk", "ecoMode", "autoMute", "claimLog"], (res) => {
  if (res.autoClaim !== undefined) config.autoClaim = res.autoClaim;
  if (res.antiAfk !== undefined) config.antiAfk = res.antiAfk;
  if (res.ecoMode !== undefined) config.ecoMode = res.ecoMode;
  if (res.autoMute !== undefined) config.autoMute = res.autoMute;
  if (res.claimLog) claimLog = res.claimLog;

  applyEcoMode(config.ecoMode);
  applyAudioMute(config.autoMute);
});

// Listen for updates from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_STATUS") {
    sendResponse({
      campaigns: latestCampaigns,
      config: config,
      lastClaimedTime: lastClaimedTime,
      claimLog: claimLog
    });
    return true;
  }

  if (request.type === "UPDATE_CONFIG") {
    Object.assign(config, request.config);
    chrome.storage.local.set(config);
    applyEcoMode(config.ecoMode);
    applyAudioMute(config.autoMute);
    sendResponse({ status: "ok" });
    return true;
  }

  if (request.type === "MANUAL_CHECK") {
    checkDropsViaGQL().then(() => {
      sendResponse({ status: "checked", campaigns: latestCampaigns });
    });
    return true;
  }
});

// Helper: Get Twitch Auth Token from Cookie
function getAuthToken() {
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]+)/);
  return match ? match[1] : null;
}

// ----------------------------------------------------
// 1. GQL INVENTORY & CLAIM SYSTEM (DevilXD Core Logic)
// ----------------------------------------------------
async function checkDropsViaGQL() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Client-Id": TWITCH_CLIENT_ID,
        "Authorization": `OAuth ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operationName: "Inventory",
        query: `query Inventory {
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
        }`
      })
    });

    const json = await res.json();
    const campaigns = json?.data?.currentUser?.dropCampaignsInProgress || [];
    latestCampaigns = campaigns;

    // Cache latest status for popup display
    chrome.storage.local.set({ latestCampaigns: campaigns, lastChecked: Date.now() });

    if (!config.autoClaim) return;

    // Check for claimable drops
    for (const camp of campaigns) {
      if (!camp.timeBasedDrops) continue;
      for (const drop of camp.timeBasedDrops) {
        if (!drop.isClaimed && drop.dropInstanceID) {
          const readyToClaim = drop.currentMinutesWatched >= drop.requiredMinutesWatched;
          if (readyToClaim) {
            console.log(`[TwitchDropsMiner] Sẵn sàng claim: ${drop.name} (${camp.game?.displayName})`);
            await claimDropViaGQL(drop.dropInstanceID, drop.name, camp.game?.displayName);
          }
        }
      }
    }
  } catch (err) {
    console.error("[TwitchDropsMiner] GQL Error:", err);
  }
}

async function claimDropViaGQL(dropInstanceId, dropName, gameName) {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Client-Id": TWITCH_CLIENT_ID,
        "Authorization": `OAuth ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operationName: "ClaimDropPageReward",
        query: `mutation ClaimDropPageReward($input: ClaimDropPageRewardInput!) {
          claimDropPageReward(input: $input) {
            dropInstanceID
            __typename
          }
        }`,
        variables: {
          input: {
            dropInstanceID: dropInstanceId
          }
        }
      })
    });

    const json = await res.json();
    if (json?.data?.claimDropPageReward?.dropInstanceID) {
      console.log(`[TwitchDropsMiner] CLAIM THÀNH CÔNG: ${dropName}`);
      lastClaimedTime = new Date().toLocaleTimeString();
      claimLog.unshift({
        time: lastClaimedTime,
        dropName: dropName,
        gameName: gameName || "Twitch Game"
      });
      if (claimLog.length > 20) claimLog.pop();
      chrome.storage.local.set({ claimLog });
    }
  } catch (err) {
    console.error("[TwitchDropsMiner] Claim GQL Error:", err);
  }
}

// ----------------------------------------------------
// 2. DOM WATCHER: AUTO CLAIM & ANTI-AFK MODAL
// ----------------------------------------------------
function setupDomWatcher() {
  const observer = new MutationObserver(() => {
    // 1. Anti-AFK Confirm Button ("Are you still watching?")
    if (config.antiAfk) {
      const confirmBtn = document.querySelector(
        '[data-a-target="player-overlay-confirm-button"], [data-test-selector="player-overlay-confirm-button"]'
      );
      if (confirmBtn) {
        console.log("[TwitchDropsMiner] Phát hiện popup 'Are you still watching?'. Đang auto-click!");
        confirmBtn.click();
      }

      // Check if video is paused unexpectedly
      const video = document.querySelector("video");
      if (video && video.paused && !video.ended) {
        video.play().catch(() => {});
      }
    }

    // 2. DOM Claim Button Fallback (Chat toast / Inventory claim button)
    if (config.autoClaim) {
      const claimBtn = document.querySelector(
        'button[data-test-selector="DropsCampaignInProgressDescription-claim-button"]'
      );
      if (claimBtn && !claimBtn.disabled) {
        console.log("[TwitchDropsMiner] DOM Claim Button phát hiện. Đang click nhận!");
        claimBtn.click();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ----------------------------------------------------
// 3. ECO MODE & AUDIO MUTE (TỐI ƯU HIỆU NĂNG TREO STREAM)
// ----------------------------------------------------
function applyEcoMode(enabled) {
  let styleEl = document.getElementById("twitch-drops-eco-style");
  if (enabled) {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "twitch-drops-eco-style";
      // Giảm độ tải render GPU của video xuống mức tối thiểu nhưng giữ luồng stream chạy ngầm
      styleEl.textContent = `
        video {
          opacity: 0.05 !important;
          filter: blur(20px) !important;
        }
        .stream-chat {
          opacity: 0.3 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  } else {
    if (styleEl) styleEl.remove();
  }
}

function applyAudioMute(enabled) {
  const video = document.querySelector("video");
  if (video) {
    if (enabled) {
      video.muted = true;
      video.volume = 0;
    }
  }
}

// ----------------------------------------------------
// KHỞI CHẠY CHU KỲ KIỂM TRA
// ----------------------------------------------------
setupDomWatcher();

// Kiểm tra GQL ngay sau khi nạp trang (đợi 3s cho Twitch load session cookie)
setTimeout(() => {
  checkDropsViaGQL();
}, 3000);

// Chu kỳ quét ngầm 60 giây / lần
setInterval(() => {
  checkDropsViaGQL();
}, 60000);
