/**
 * Twitch Drops Miner - Popup Logic
 * Team FEAR / SrymC
 */

document.addEventListener("DOMContentLoaded", () => {
  const toggleAutoClaim = document.getElementById("toggleAutoClaim");
  const toggleAntiAfk = document.getElementById("toggleAntiAfk");
  const toggleEcoMode = document.getElementById("toggleEcoMode");
  const toggleAutoMute = document.getElementById("toggleAutoMute");
  const btnRefresh = document.getElementById("btnRefresh");
  const campaignsContainer = document.getElementById("campaignsContainer");
  const logsContainer = document.getElementById("logsContainer");

  // 1. Load settings from storage
  chrome.storage.local.get(
    ["autoClaim", "antiAfk", "ecoMode", "autoMute", "latestCampaigns", "claimLog"],
    (data) => {
      toggleAutoClaim.checked = data.autoClaim ?? true;
      toggleAntiAfk.checked = data.antiAfk ?? true;
      toggleEcoMode.checked = data.ecoMode ?? false;
      toggleAutoMute.checked = data.autoMute ?? false;

      if (data.latestCampaigns && data.latestCampaigns.length > 0) {
        renderCampaigns(data.latestCampaigns);
      }

      if (data.claimLog) {
        renderLogs(data.claimLog);
      }

      // Query active Twitch tab for latest live data
      syncWithActiveTab();
    }
  );

  // 2. Setup Toggle Listeners
  function handleSettingChange() {
    const config = {
      autoClaim: toggleAutoClaim.checked,
      antiAfk: toggleAntiAfk.checked,
      ecoMode: toggleEcoMode.checked,
      autoMute: toggleAutoMute.checked
    };

    chrome.storage.local.set(config);

    // Notify Twitch tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UPDATE_CONFIG", config }).catch(() => {});
      }
    });
  }

  toggleAutoClaim.addEventListener("change", handleSettingChange);
  toggleAntiAfk.addEventListener("change", handleSettingChange);
  toggleEcoMode.addEventListener("change", handleSettingChange);
  toggleAutoMute.addEventListener("change", handleSettingChange);

  // 3. Scan Button
  btnRefresh.addEventListener("click", () => {
    btnRefresh.textContent = "...";
    btnRefresh.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url && activeTab.url.includes("twitch.tv")) {
        chrome.tabs.sendMessage(activeTab.id, { type: "MANUAL_CHECK" }, (response) => {
          btnRefresh.textContent = "SCAN";
          btnRefresh.disabled = false;
          if (response?.campaigns) {
            renderCampaigns(response.campaigns);
          }
        });
      } else {
        btnRefresh.textContent = "SCAN";
        btnRefresh.disabled = false;
        campaignsContainer.innerHTML = `<div class="empty-state">Vui lòng mở tab stream Twitch.tv để quét!</div>`;
      }
    });
  });

  // 4. Sync with active tab
  function syncWithActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.url && activeTab.url.includes("twitch.tv")) {
        chrome.tabs.sendMessage(activeTab.id, { type: "GET_STATUS" }, (response) => {
          if (chrome.runtime.lastError || !response) return;
          if (response.campaigns) renderCampaigns(response.campaigns);
          if (response.claimLog) renderLogs(response.claimLog);
        });
      }
    });
  }

  // 5. Render Campaigns UI
  function renderCampaigns(campaigns) {
    if (!campaigns || campaigns.length === 0) {
      campaignsContainer.innerHTML = `<div class="empty-state">Không có chiến dịch Drop nào đang tiến hành.</div>`;
      return;
    }

    let html = "";
    campaigns.forEach((camp) => {
      const gameTitle = camp.game?.displayName || camp.name || "Game Campaign";
      const drops = camp.timeBasedDrops || [];

      // Find drop in progress or first active drop
      drops.forEach((drop) => {
        const current = drop.currentMinutesWatched || 0;
        const required = drop.requiredMinutesWatched || 60;
        const percent = Math.min(100, Math.round((current / required) * 100));
        const isReady = percent >= 100 && !drop.isClaimed;

        let badgeHtml = "";
        if (drop.isClaimed) {
          badgeHtml = `<span class="camp-status-badge">CLAIMED</span>`;
        } else if (isReady) {
          badgeHtml = `<span class="camp-status-badge ready">SẴN SÀNG NHẬN</span>`;
        } else {
          badgeHtml = `<span class="camp-status-badge farming">${percent}%</span>`;
        }

        html += `
          <div class="campaign-card">
            <div class="camp-head">
              <span class="camp-game">${escapeHtml(gameTitle)}</span>
              ${badgeHtml}
            </div>
            <div class="drop-item">
              <div class="drop-name-row">
                <span>${escapeHtml(drop.name)}</span>
                <span>${current}/${required}m</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          </div>
        `;
      });
    });

    campaignsContainer.innerHTML = html || `<div class="empty-state">Chưa tìm thấy drops hợp lệ.</div>`;
  }

  // 6. Render History Logs
  function renderLogs(logs) {
    if (!logs || logs.length === 0) {
      logsContainer.innerHTML = `<div class="empty-state-sm">Chưa có phần thưởng nào vừa nhận.</div>`;
      return;
    }

    logsContainer.innerHTML = logs
      .map(
        (item) => `
        <div class="log-item">
          <span class="log-name" title="${escapeHtml(item.dropName)}">${escapeHtml(item.dropName)}</span>
          <span class="log-time">${escapeHtml(item.time)}</span>
        </div>
      `
      )
      .join("");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }
});
