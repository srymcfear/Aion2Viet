/**
 * Twitch Drops Auto Miner & Claimer - Service Worker (Background)
 * Team FEAR / SrymC
 */

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.local.get(["autoClaim", "antiAfk", "ecoMode", "autoMute"], (res) => {
    const defaults = {
      autoClaim: res.autoClaim ?? true,
      antiAfk: res.antiAfk ?? true,
      ecoMode: res.ecoMode ?? false,
      autoMute: res.autoMute ?? false,
      claimLog: res.claimLog ?? []
    };
    chrome.storage.local.set(defaults);
  });

  // Set periodic alarm
  chrome.alarms.create("DROP_CHECK_ALARM", { periodInMinutes: 2 });
});

// Periodic alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "DROP_CHECK_ALARM") {
    // Ping all active Twitch tabs to trigger manual check
    chrome.tabs.query({ url: "*://*.twitch.tv/*" }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: "MANUAL_CHECK" }).catch(() => {});
      }
    });
  }
});
