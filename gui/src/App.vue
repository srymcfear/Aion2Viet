<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-[#090d16] text-[var(--text-main)] select-none overflow-hidden border border-[var(--border-subtle)] rounded-xl shadow-2xl">
      
      <!-- Compact Header with Integrated Status Pill & Window Controls -->
      <div class="h-11 px-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[#0d121f]/95 shrink-0 pywebview-drag-region">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-[#0284c7] to-[#6366f1] flex items-center justify-center font-extrabold text-white text-[11px] shadow-sm shadow-sky-500/20">
            F
          </div>
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

      <!-- Tab Bar -->
      <div class="px-3.5 border-b border-[var(--border-subtle)] bg-[#080b13]/80 shrink-0">
        <n-tabs v-model:value="activeTab" type="line" size="small">
          <n-tab name="locale" tab="Quản lý Việt Hóa" />
          <n-tab name="tools">
            <div class="flex items-center gap-1.5">
              <span>Tools Mở Rộng</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">Đang phát triển</span>
            </div>
          </n-tab>
        </n-tabs>
      </div>

      <!-- Tab 1: Locale Manager -->
      <div v-show="activeTab === 'locale'" class="flex-1 p-3.5 flex flex-col justify-between gap-2.5 overflow-hidden">
        
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
            :disabled="isInstalled || isBusy"
            @click="handleInstall"
            class="h-10 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
            :class="isInstalled || isBusy 
              ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
              : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white border border-sky-400/40 shadow-sky-500/20 hover:from-[#0ea5e9] hover:to-[#0284c7] hover:shadow-sky-400/40 active:scale-[0.99]'"
          >
            CÀI ĐẶT VIỆT HÓA
          </button>

          <button
            :disabled="!isInstalled || isBusy"
            @click="handleUninstall"
            class="h-10 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer"
            :class="!isInstalled || isBusy 
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

      <!-- Footer with @FEAR Github Link -->
      <div class="h-7 px-4 flex items-center justify-between border-t border-[var(--border-subtle)] bg-[#070a12] text-[11px] text-[var(--text-muted)] shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500/60"></span>
          <span class="text-slate-400 font-medium">Standalone Engine v2.0</span>
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
  if (isInstalled.value || isBusy.value) return;
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
  if (!isInstalled.value || isBusy.value) return;
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
  if (!initFromPy()) {
    window.addEventListener('pywebviewready', () => {
      initFromPy();
    });
    const interval = setInterval(() => {
      if (initFromPy()) {
        clearInterval(interval);
      }
    }, 150);
    setTimeout(() => clearInterval(interval), 4000);
  }
});
</script>
