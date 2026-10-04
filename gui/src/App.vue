<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-[#090d16] text-[var(--text-main)] select-none overflow-hidden border border-[var(--border-subtle)] rounded-xl shadow-2xl">
      
      <!-- Compact Header with Integrated Status Pill & Window Controls -->
      <div class="h-11 px-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[#0d121f]/95 shrink-0 pywebview-drag-region">
        <div class="flex items-center gap-2.5">
          <img src="./assets/logo.png" alt="FEAR" class="h-6 w-6 object-contain rounded-md border border-white/10 shadow-sm" />
          <div class="text-xs font-bold tracking-wider text-slate-200">
            F-Aion 2 Tools
          </div>
        </div>

        <div class="flex items-center gap-2.5 no-drag">
          <!-- Integrated Status Pill -->
          <div 
            class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300"
            :class="isInstalled 
              ? 'bg-sky-500/10 border-sky-400/40 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]' 
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400'"
          >
            <span 
              class="w-1.5 h-1.5 rounded-full transition-all duration-300"
              :class="isInstalled ? 'bg-[#38bdf8] animate-pulse shadow-[0_0_8px_#38bdf8]' : 'bg-slate-500'"
            ></span>
            <span>{{ isInstalled ? 'ĐÃ BẬT VIỆT HÓA' : 'BẢN GỐC' }}</span>
          </div>

          <!-- Window Controls (Minimize & Close) -->
          <div class="flex items-center gap-1 pl-1.5 border-l border-slate-700/50">
            <button 
              @click="handleMinimize"
              title="Thu nhỏ"
              class="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button 
              @click="handleClose"
              title="Đóng"
              class="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 active:bg-red-600 transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Bar with About & Update -->
      <div class="px-3.5 border-b border-[var(--border-subtle)] bg-[#080b13]/80 shrink-0">
        <n-tabs v-model:value="activeTab" type="line" size="small">
          <n-tab name="locale" tab="Quản lý Việt Hóa" />
          <n-tab name="tools">
            <div class="flex items-center gap-1.5">
              <span>Tools Mở Rộng</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">Đang phát triển</span>
            </div>
          </n-tab>
          <n-tab name="about">
            <div class="flex items-center gap-1.5">
              <span>About & Update</span>
              <span v-if="hasUpdate" class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_#38bdf8]"></span>
            </div>
          </n-tab>
        </n-tabs>
      </div>

      <!-- Tab 1: Locale Manager -->
      <div v-show="activeTab === 'locale'" class="flex-1 p-3.5 flex flex-col justify-between gap-2.5 overflow-hidden">
        
        <!-- Security Alert Banner (Lock or Maintenance) -->
        <div v-if="securityStatus === 'lock'" class="p-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-2.5 text-xs animate-pulse">
          <svg class="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div class="leading-tight">
            <strong class="font-bold">HỆ THỐNG ĐÃ BỊ KHÓA:</strong> {{ securityMessage }}
          </div>
        </div>

        <div v-else-if="securityStatus === 'baotri'" class="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 flex items-center gap-2.5 text-xs">
          <svg class="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div class="leading-tight">
            <strong class="font-bold">HỆ THỐNG ĐANG BẢO TRÌ:</strong> {{ securityMessage }}
          </div>
        </div>

        <!-- Game Directory Section -->
        <div class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1.5">
          <div class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Thư mục cài đặt game AION 2
          </div>
          <div class="flex gap-2">
            <n-input
              v-model:value="gameDir"
              placeholder="Đường dẫn cài đặt game AION 2..."
              size="medium"
              class="flex-1 font-mono text-xs"
            />
            <n-button secondary size="medium" @click="handleBrowse" class="!px-3 font-semibold text-xs">
              Chọn thư mục
            </n-button>
            <n-button secondary size="medium" @click="handleScan" class="!px-3 font-semibold text-xs">
              Quét lại
            </n-button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-1 px-0.5">
          <div class="flex justify-between text-[11px] font-medium text-[var(--text-muted)]">
            <span class="truncate max-w-[85%]">{{ progressStep }}</span>
            <span class="font-mono text-white font-semibold">{{ progressPct }}%</span>
          </div>
          <n-progress
            type="line"
            :percentage="progressPct"
            :show-indicator="false"
            color="#38bdf8"
            rail-color="rgba(255, 255, 255, 0.06)"
            class="!h-1.5"
          />
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-2.5">
          <button
            :disabled="isInstalled || isBusy || securityStatus !== 'active'"
            @click="handleInstall"
            class="h-10 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
            :class="isInstalled || isBusy || securityStatus !== 'active'
              ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
              : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white border border-sky-400/40 shadow-sky-500/20 hover:from-[#0ea5e9] hover:to-[#0284c7] hover:shadow-sky-400/40 active:scale-[0.99]'"
          >
            CÀI ĐẶT VIỆT HÓA
          </button>

          <button
            :disabled="!isInstalled || isBusy || securityStatus !== 'active'"
            @click="handleUninstall"
            class="h-10 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer"
            :class="!isInstalled || isBusy || securityStatus !== 'active'
              ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-white active:scale-[0.99]'"
          >
            GỠ VIỆT HÓA
          </button>
        </div>

        <!-- Compact Log Console -->
        <div 
          ref="logContainer" 
          class="h-24 bg-[#05070c] border border-[var(--border-subtle)] rounded-xl p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1"
        >
          <div 
            v-for="(item, idx) in logs" 
            :key="idx"
            :class="{
              'text-[#38bdf8] font-medium': item.type === 'blue',
              'text-red-400': item.type === 'red',
              'text-slate-200 font-semibold': item.type === 'success',
              'text-slate-400': !item.type
            }"
          >
            [{{ item.time }}] {{ item.text }}
          </div>
        </div>

      </div>

      <!-- Tab 2: Tools (Extended) -->
      <div v-show="activeTab === 'tools'" class="flex-1 p-3.5 overflow-y-auto">
        <div class="grid grid-cols-2 gap-2.5">
          <div 
            v-for="tool in toolsList" 
            :key="tool.title"
            class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[#1a2337]/80 hover:border-sky-400/30 transition-all duration-200 space-y-1"
          >
            <div class="flex justify-between items-center">
              <span class="font-bold text-white text-xs">{{ tool.title }}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {{ tool.badge }}
              </span>
            </div>
            <div class="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {{ tool.desc }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: About & Update -->
      <div v-show="activeTab === 'about'" class="flex-1 p-3.5 flex flex-col gap-2.5 overflow-y-auto">
        <!-- Top Row: App Brand & Security Card -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- App Info Card -->
          <div class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col justify-between space-y-2">
            <div class="flex items-center gap-2.5">
              <img src="./assets/logo.png" alt="FEAR" class="h-9 w-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/40 shadow" />
              <div>
                <div class="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>F-Aion 2 Tools</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">v{{ currentVersion }}</span>
                </div>
                <div class="text-[10px] text-[var(--text-muted)]">Quản lý & Tối ưu Việt Hóa AION 2</div>
              </div>
            </div>
            <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Tác giả:</span>
              <span class="font-semibold text-slate-200">SrymC (FEΔR Team)</span>
            </div>
          </div>

          <!-- Security Status Card (fearAion2Tran-key) -->
          <div class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col justify-between space-y-2">
            <div class="flex justify-between items-center">
              <div class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Khóa bảo mật (Key)
              </div>
              <!-- Status Pill Badge -->
              <div 
                class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all"
                :class="{
                  'bg-sky-500/10 border-sky-400/40 text-[#38bdf8]': securityStatus === 'active',
                  'bg-amber-500/10 border-amber-400/40 text-amber-400': securityStatus === 'baotri',
                  'bg-red-500/10 border-red-400/40 text-red-400': securityStatus === 'lock'
                }"
              >
                <span 
                  class="w-1.5 h-1.5 rounded-full"
                  :class="{
                    'bg-[#38bdf8] animate-pulse shadow-[0_0_6px_#38bdf8]': securityStatus === 'active',
                    'bg-amber-400 animate-pulse': securityStatus === 'baotri',
                    'bg-red-500': securityStatus === 'lock'
                  }"
                ></span>
                <span class="uppercase font-mono">{{ securityStatus === 'active' ? 'Active' : (securityStatus === 'baotri' ? 'Bảo trì' : 'Đã khóa') }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between bg-[#06080e] px-2.5 py-1.5 rounded-lg border border-white/5 font-mono text-xs text-sky-400">
              <span class="font-bold tracking-wider">{{ securityKey }}</span>
              <span class="text-[9px] text-slate-500 uppercase">SHA-256</span>
            </div>

            <div class="text-[10px] text-slate-400 truncate" :title="securityMessage">
              {{ securityMessage }}
            </div>
          </div>
        </div>

        <!-- Software Update Card -->
        <div class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col justify-between space-y-2.5 flex-1">
          <div class="flex justify-between items-center">
            <div class="space-y-0.5">
              <div class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Cập nhật phần mềm</span>
                <span class="text-[10px] text-slate-400 font-normal">(GitHub Releases)</span>
              </div>
              <div class="text-[11px] text-slate-400">
                Phiên bản hiện tại: <span class="font-mono text-white font-semibold">v{{ currentVersion }}</span>
                <span v-if="latestVersion" class="ml-2">| Mới nhất: <span class="font-mono font-semibold" :class="hasUpdate ? 'text-sky-400' : 'text-slate-300'">v{{ latestVersion }}</span></span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <n-button 
                secondary 
                size="small" 
                :loading="isCheckingUpdate" 
                @click="handleCheckUpdate"
                class="!px-3 font-semibold text-xs"
              >
                Kiểm tra cập nhật
              </n-button>
            </div>
          </div>

          <!-- Update details if update available -->
          <div v-if="hasUpdate" class="p-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <div class="font-bold text-sky-300 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Đã có phiên bản mới: v{{ latestVersion }}</span>
              </div>
              <div class="flex gap-2">
                <button 
                  @click="handleDownloadUpdate"
                  class="px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-black font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                >
                  Tự động tải cập nhật
                </button>
                <button 
                  @click="handleOpenRelease"
                  class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer border border-white/10"
                >
                  Xem GitHub
                </button>
              </div>
            </div>
            <!-- Changelog snippet -->
            <div v-if="changelog" class="text-[11px] text-slate-300 max-h-16 overflow-y-auto font-mono bg-black/30 p-2 rounded border border-white/5 whitespace-pre-wrap leading-relaxed">
              {{ changelog }}
            </div>
          </div>

          <!-- Up to date message -->
          <div v-else class="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>{{ lastChecked ? '✔ Bạn đang sử dụng phiên bản mới nhất.' : 'Nhấn nút để kiểm tra bản phát hành mới.' }}</span>
            <span v-if="lastChecked" class="text-[10px] text-slate-500 font-mono">Đã kiểm tra: {{ lastChecked }}</span>
          </div>
        </div>

      </div>

      <!-- Footer with @FEAR Github Link -->
      <div class="h-7 px-4 flex items-center justify-between border-t border-[var(--border-subtle)] bg-[#070a12] text-[11px] text-[var(--text-muted)] shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500/60"></span>
          <span class="text-slate-400 font-medium">cre by srymc</span>
        </div>
        <button 
          @click="openGithub"
          class="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer group bg-transparent border-0 p-0"
        >
          <svg class="w-3.5 h-3.5 fill-current text-slate-400 group-hover:text-sky-400 transition-colors" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span class="font-bold tracking-wide text-slate-300 group-hover:text-sky-400">@FEAR</span>
        </button>
      </div>

    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { 
  darkTheme, 
  NConfigProvider, 
  NTabs, 
  NTab, 
  NInput, 
  NButton, 
  NProgress,
  GlobalThemeOverrides 
} from 'naive-ui';

interface LogItem {
  time: string;
  text: string;
  type?: string;
}

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#38bdf8',
    primaryColorHover: '#0ea5e9',
    primaryColorPressed: '#0284c7',
    primaryColorSuppl: '#38bdf8',
    cardColor: 'rgba(18, 24, 38, 0.75)',
    modalColor: '#0d121f',
    bodyColor: '#07090e',
    textColorBase: '#f8fafc',
    textColor1: '#f8fafc',
    textColor2: '#cbd5e1',
    textColor3: '#94a3b8',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  Button: {
    textColorPrimary: '#ffffff',
    colorPrimary: '#0284c7',
    colorHoverPrimary: '#0ea5e9',
    colorPressedPrimary: '#0369a1',
    colorFocusPrimary: '#0ea5e9',
    borderRadiusMedium: '8px'
  },
  Input: {
    borderRadius: '8px',
    color: 'rgba(8, 11, 19, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderHover: '1px solid #38bdf8',
    borderFocus: '1px solid #38bdf8',
    boxShadowFocus: '0 0 0 2px rgba(56, 189, 248, 0.2)'
  }
};

const activeTab = ref('locale');
const gameDir = ref('F:\\NCSoft\\AION 2');
const isInstalled = ref(false);
const isBusy = ref(false);
const progressPct = ref(0);
const progressStep = ref('Sẵn sàng');
const logContainer = ref<HTMLDivElement | null>(null);

// Security & Update State
const currentVersion = ref('1.0.2');
const latestVersion = ref('1.0.2');
const hasUpdate = ref(false);
const securityKey = ref('fearAion2Tran-key');
const securityStatus = ref('active');
const securityMessage = ref('Đã xác thực bản quyền FEAR (Active)');
const changelog = ref('');
const lastChecked = ref('');
const isCheckingUpdate = ref(false);

const logs = ref<LogItem[]>([
  { time: new Date().toLocaleTimeString(), text: 'Khởi tạo hệ thống quản lý AION 2.', type: 'blue' }
]);

const toolsList = [
  {
    title: 'AION 2 DPS Meter',
    badge: 'PHÁT TRIỂN',
    desc: 'Bảng thống kê sát thương thời gian thực, đo lường DPS Party, Skill Breakdown không giảm FPS.'
  },
  {
    title: 'TCP/UDP Optimizer',
    badge: 'PHÁT TRIỂN',
    desc: 'Cấu hình Reg TCPNoDelay và MTU Packet Size tối ưu cho máy chủ AION 2 Global & TW.'
  },
  {
    title: 'Góc nhìn FOV Extender',
    badge: 'PHÁT TRIỂN',
    desc: 'Tăng góc nhìn toàn cảnh chiến trường, tùy biến tầm xa của camera khi đi Boss và PvP.'
  },
  {
    title: 'Quick Macro Controller',
    badge: 'PHÁT TRIỂN',
    desc: 'Xâu chuỗi kỹ năng luồng bất đồng bộ chuẩn FEΔR, hỗ trợ phím dừng khẩn cấp.'
  }
];

function addLog(text: string, type: string = '') {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    text,
    type
  });
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}

function applySecurityInfo(sec: any) {
  if (!sec) return;
  if (sec.currentVersion) currentVersion.value = sec.currentVersion;
  if (sec.latestVersion) latestVersion.value = sec.latestVersion;
  if (sec.key) securityKey.value = sec.key;
  if (sec.status) securityStatus.value = sec.status;
  if (sec.message) securityMessage.value = sec.message;
  if (typeof sec.hasUpdate === 'boolean') hasUpdate.value = sec.hasUpdate;
  if (sec.changelog !== undefined) changelog.value = sec.changelog;
  if (sec.lastChecked) lastChecked.value = sec.lastChecked;
}

let pollTimer: any = null;

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const pyApi = (window as any).pywebview?.api;
    if (!pyApi || !pyApi.get_status) return;
    try {
      const status = await pyApi.get_status();
      if (status) {
        isInstalled.value = status.isInstalled;
        progressPct.value = status.progressPct;
        progressStep.value = status.progressStep;
        if (status.securityInfo) {
          applySecurityInfo(status.securityInfo);
        }
        if (status.logs && status.logs.length > 0) {
          for (const item of status.logs) {
            addLog(item.text, item.type);
          }
        }
        if (!status.isBusy) {
          clearInterval(pollTimer);
          pollTimer = null;
          isBusy.value = false;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, 120);
}

function handleMinimize() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.minimize_window) {
    pyApi.minimize_window();
  }
}

function handleClose() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.close_window) {
    pyApi.close_window();
  } else {
    window.close();
  }
}

function openGithub() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.open_github) {
    pyApi.open_github();
  } else {
    window.open('https://github.com/srymcfear', '_blank');
  }
}

async function handleCheckUpdate() {
  const pyApi = (window as any).pywebview?.api;
  if (!pyApi || !pyApi.check_update) return;
  isCheckingUpdate.value = true;
  try {
    const sec = await pyApi.check_update();
    applySecurityInfo(sec);
    setTimeout(async () => {
      if (pyApi.get_security_info) {
        const updated = await pyApi.get_security_info();
        applySecurityInfo(updated);
      }
      isCheckingUpdate.value = false;
    }, 1500);
  } catch (e) {
    console.error(e);
    isCheckingUpdate.value = false;
  }
}

function handleOpenRelease() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.open_release_url) {
    pyApi.open_release_url();
  } else {
    window.open('https://github.com/srymcfear/Aion2Viet/releases', '_blank');
  }
}

async function handleDownloadUpdate() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.download_update) {
    try {
      activeTab.value = 'locale';
      await pyApi.download_update();
      startPolling();
    } catch (e) {
      console.error(e);
    }
  } else {
    handleOpenRelease();
  }
}

async function handleBrowse() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.browse_folder) {
    try {
      const res = await pyApi.browse_folder();
      if (res && res.gameDir) {
        gameDir.value = res.gameDir;
        isInstalled.value = res.isInstalled;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleScan() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.scan_game) {
    try {
      const res = await pyApi.scan_game();
      if (res && res.gameDir) {
        gameDir.value = res.gameDir;
        isInstalled.value = res.isInstalled;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleInstall() {
  if (isInstalled.value || isBusy.value || securityStatus.value !== 'active') return;
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.install_mod) {
    isBusy.value = true;
    try {
      await pyApi.install_mod(gameDir.value);
      startPolling();
    } catch (e) {
      console.error(e);
      isBusy.value = false;
    }
  }
}

async function handleUninstall() {
  if (!isInstalled.value || isBusy.value || securityStatus.value !== 'active') return;
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.uninstall_mod) {
    isBusy.value = true;
    try {
      await pyApi.uninstall_mod(gameDir.value);
      startPolling();
    } catch (e) {
      console.error(e);
      isBusy.value = false;
    }
  }
}

function initFromPy() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.get_status) {
    pyApi.get_status().then((status: any) => {
      if (status) {
        if (status.gameDir) gameDir.value = status.gameDir;
        isInstalled.value = status.isInstalled;
        if (status.securityInfo) {
          applySecurityInfo(status.securityInfo);
        }
        if (status.logs && status.logs.length > 0) {
          logs.value = status.logs;
        }
      }
    }).catch((err: any) => {
      console.warn("get_status error:", err);
    });
    return true;
  }
  return false;
}

onMounted(() => {
  nextTick(() => {
    const pyApi = (window as any).pywebview?.api;
    if (pyApi && pyApi.show_window) {
      pyApi.show_window();
    }
  });

  if (!initFromPy()) {
    window.addEventListener('pywebviewready', () => {
      initFromPy();
      const pyApi = (window as any).pywebview?.api;
      if (pyApi && pyApi.show_window) pyApi.show_window();
    });
    const interval = setInterval(() => {
      if (initFromPy()) {
        const pyApi = (window as any).pywebview?.api;
        if (pyApi && pyApi.show_window) pyApi.show_window();
        clearInterval(interval);
      }
    }, 150);
    setTimeout(() => clearInterval(interval), 4000);
  }
});
</script>
