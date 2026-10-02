<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-[#090d16] text-[var(--text-main)] select-none overflow-hidden">
      
      <!-- Compact Header with Integrated Status Pill -->
      <div class="h-12 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[#0d121f]/90 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0284c7] to-[#6366f1] flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-sky-500/20">
            Δ
          </div>
          <div class="text-[13px] font-bold tracking-tight text-white uppercase">
            FEΔR • AION 2 LOCALE MANAGER
          </div>
        </div>

        <!-- Integrated Status Pill -->
        <div 
          class="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-300"
          :class="isInstalled 
            ? 'bg-sky-500/10 border-sky-400/40 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]' 
            : 'bg-slate-800/80 border-slate-700/60 text-slate-400'"
        >
          <span 
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="isInstalled ? 'bg-[#38bdf8] animate-pulse shadow-[0_0_8px_#38bdf8]' : 'bg-slate-500'"
          ></span>
          <span>{{ isInstalled ? 'ĐÃ BẬT VIỆT HÓA' : 'BẢN GỐC (CHƯA BẬT)' }}</span>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="px-4 border-b border-[var(--border-subtle)] bg-[#080b13]/80 shrink-0">
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
      <div v-show="activeTab === 'locale'" class="flex-1 p-4 flex flex-col justify-between gap-3 overflow-hidden">
        
        <!-- Game Directory Section -->
        <div class="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2">
          <div class="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Thư mục cài đặt game AION 2
          </div>
          <div class="flex gap-2">
            <n-input
              v-model:value="gameDir"
              placeholder="Đường dẫn cài đặt game AION 2..."
              size="medium"
              class="flex-1 font-mono text-xs"
            />
            <n-button secondary size="medium" @click="handleBrowse" class="!px-3.5 font-semibold text-xs">
              Chọn thư mục
            </n-button>
            <n-button secondary size="medium" @click="handleScan" class="!px-3.5 font-semibold text-xs">
              Quét lại
            </n-button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-1.5 px-0.5">
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
        <div class="grid grid-cols-2 gap-3">
          <button
            :disabled="isInstalled || isBusy"
            @click="handleInstall"
            class="h-11 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md"
            :class="isInstalled || isBusy 
              ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
              : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white border border-sky-400/40 shadow-sky-500/20 hover:from-[#0ea5e9] hover:to-[#0284c7] hover:shadow-sky-400/40 active:scale-[0.99]'"
          >
            CÀI ĐẶT VIỆT HÓA
          </button>

          <button
            :disabled="!isInstalled || isBusy"
            @click="handleUninstall"
            class="h-11 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 flex items-center justify-center cursor-pointer"
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
      <div v-show="activeTab === 'tools'" class="flex-1 p-4 overflow-y-auto">
        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="tool in toolsList" 
            :key="tool.title"
            class="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[#1a2337]/80 hover:border-sky-400/30 transition-all duration-200 space-y-1.5"
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

onMounted(() => {
  const initFromPy = () => {
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
      });
    }
  };

  if ((window as any).pywebview) {
    initFromPy();
  } else {
    window.addEventListener('pywebviewready', initFromPy);
  }
});
</script>
