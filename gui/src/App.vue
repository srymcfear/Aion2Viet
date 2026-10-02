<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="min-h-screen flex items-center justify-center p-6">
      <div class="w-[840px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="px-7 py-5 flex justify-between items-center border-b border-[var(--border-subtle)] bg-[#0d121f]/60">
          <div class="flex items-center gap-3.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#6366f1] flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-sky-500/20">
              Δ
            </div>
            <div>
              <div class="text-[17px] font-extrabold tracking-tight text-white">FEΔR • AION 2 LOCALE MANAGER</div>
            </div>
          </div>
        </div>

        <!-- Tab Bar -->
        <n-tabs v-model:value="activeTab" type="line" class="px-7 pt-2 border-b border-[var(--border-subtle)] bg-[#080b13]/70">
          <n-tab name="locale" tab="Quản lý Việt Hóa" />
          <n-tab name="tools">
            <div class="flex items-center gap-2">
              <span>Tools Mở Rộng</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Đang phát triển</span>
            </div>
          </n-tab>
        </n-tabs>

        <!-- Tab 1: Locale Manager -->
        <div v-show="activeTab === 'locale'" class="p-7 space-y-6">
          
          <!-- Hero Status -->
          <div class="p-5 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-b from-[#1a2337]/50 to-[#121826]/70 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div 
                class="w-3 h-3 rounded-full transition-all duration-300"
                :class="isInstalled ? 'bg-[#38bdf8] shadow-[0_0_16px_#38bdf8]' : 'bg-slate-600 shadow-[0_0_8px_rgba(71,85,105,0.5)]'"
              ></div>
              <div>
                <div class="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Trạng thái</div>
                <div 
                  class="text-lg font-bold tracking-tight"
                  :class="isInstalled ? 'text-[#38bdf8]' : 'text-slate-100'"
                >
                  {{ isInstalled ? 'Đã bật Việt Hóa' : 'Bản gốc (Chưa bật Việt Hóa)' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Directory Card -->
          <div class="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
            <div class="text-xs font-semibold text-[var(--text-muted)]">
              Thư mục cài đặt game AION 2
            </div>
            <div class="flex gap-2.5">
              <n-input
                v-model:value="gameDir"
                placeholder="Chọn đường dẫn cài đặt game AION 2..."
                size="large"
                class="flex-1 font-mono text-[13px]"
              />
              <n-button secondary size="large" @click="handleBrowse" class="!px-5 font-semibold">
                Chọn thư mục
              </n-button>
              <n-button secondary size="large" @click="handleScan" class="!px-5 font-semibold">
                Quét lại
              </n-button>
            </div>
          </div>

          <!-- Progress -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium text-[var(--text-muted)]">
              <span>{{ progressStep }}</span>
              <span class="font-mono text-white font-semibold">{{ progressPct }}%</span>
            </div>
            <n-progress
              type="line"
              :percentage="progressPct"
              :show-indicator="false"
              color="#38bdf8"
              rail-color="rgba(255, 255, 255, 0.06)"
              class="!h-2"
            />
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-4">
            <button
              :disabled="isInstalled || isBusy"
              @click="handleInstall"
              class="p-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex flex-col items-center justify-center cursor-pointer shadow-lg"
              :class="isInstalled || isBusy 
                ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
                : 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white border border-sky-400/40 shadow-sky-500/25 hover:from-[#0ea5e9] hover:to-[#0284c7] hover:shadow-sky-400/40 active:scale-[0.99]'"
            >
              CÀI ĐẶT VIỆT HÓA
            </button>

            <button
              :disabled="!isInstalled || isBusy"
              @click="handleUninstall"
              class="p-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex flex-col items-center justify-center cursor-pointer"
              :class="!isInstalled || isBusy 
                ? 'opacity-35 cursor-not-allowed bg-slate-800 text-slate-500 border border-transparent shadow-none' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-white active:scale-[0.99]'"
            >
              GỠ VIỆT HÓA
            </button>
          </div>

          <!-- Log Console -->
          <div ref="logContainer" class="h-28 bg-[#05070c] border border-[var(--border-subtle)] rounded-xl p-3.5 overflow-y-auto font-mono text-xs leading-relaxed space-y-1">
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
        <div v-show="activeTab === 'tools'" class="p-7">
          <div class="grid grid-cols-2 gap-4">
            <div 
              v-for="tool in toolsList" 
              :key="tool.title"
              class="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[#1a2337]/80 hover:border-sky-400/30 transition-all duration-200 space-y-2"
            >
              <div class="flex justify-between items-center">
                <span class="font-bold text-white text-sm">{{ tool.title }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {{ tool.badge }}
                </span>
              </div>
              <div class="text-xs text-[var(--text-muted)] leading-relaxed">
                {{ tool.desc }}
              </div>
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
    borderRadiusMedium: '10px'
  },
  Input: {
    borderRadius: '10px',
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
  { time: new Date().toLocaleTimeString(), text: 'Hệ thống đã nhận diện thư mục AION 2 tại F:\\NCSoft\\AION 2.', type: 'blue' },
  { time: new Date().toLocaleTimeString(), text: 'Sẵn sàng thực thi.', type: 'success' }
]);

const toolsList = [
  {
    title: 'AION 2 DPS Meter',
    badge: 'PHÁT TRIỂN',
    desc: 'Bảng thống kê sát thương thời gian thực, đo lường DPS Party, Skill Breakdown và ghi log combat không làm giảm FPS.'
  },
  {
    title: 'TCP/UDP Optimizer',
    badge: 'PHÁT TRIỂN',
    desc: 'Tự động cấu hình Reg TCPNoDelay và MTU Packet Size tối ưu cho máy chủ AION 2 Global & TW, hạn chế gián đoạn kết nối.'
  },
  {
    title: 'Góc nhìn FOV Extender',
    badge: 'PHÁT TRIỂN',
    desc: 'Tăng góc nhìn toàn cảnh chiến trường cho Daeva, tùy biến tầm xa của camera khi đi Boss và PvP quy mô lớn.'
  },
  {
    title: 'Quick Macro Controller',
    badge: 'PHÁT TRIỂN',
    desc: 'Tự động xâu chuỗi kỹ năng theo luồng bất đồng bộ (non-blocking) chuẩn FEΔR, có phím dừng khẩn cấp Emergency Stop.'
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

function setProgress(pct: number, step: string) {
  progressPct.value = pct;
  if (step) progressStep.value = step;
}

function handleBrowse() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.browse_folder) {
    pyApi.browse_folder().then((res: any) => {
      if (res && res.gameDir) {
        gameDir.value = res.gameDir;
        isInstalled.value = res.isInstalled;
      }
    });
  } else {
    const res = prompt('Nhập đường dẫn cài đặt game AION 2:', gameDir.value);
    if (res) {
      gameDir.value = res;
      addLog(`Đã đặt đường dẫn game: ${res}`, 'blue');
    }
  }
}

function handleScan() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.scan_game) {
    pyApi.scan_game();
  } else {
    setProgress(35, 'Đang quét Registry hệ thống...');
    addLog('Bắt đầu quét Registry tự động...', 'blue');
    setTimeout(() => {
      setProgress(80, 'Kiểm tra cấu trúc thư mục Aion2...');
      setTimeout(() => {
        setProgress(100, 'Hoàn tất quét!');
        gameDir.value = 'F:\\NCSoft\\AION 2';
        addLog('Đã tìm thấy game AION 2 tại F:\\NCSoft\\AION 2', 'success');
        setTimeout(() => setProgress(0, 'Sẵn sàng'), 800);
      }, 300);
    }, 300);
  }
}

function handleInstall() {
  if (isInstalled.value || isBusy.value) return;
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.install_mod) {
    isBusy.value = true;
    pyApi.install_mod(gameDir.value);
  } else {
    isBusy.value = true;
    addLog('Bắt đầu quy trình cài đặt Việt Hóa...', 'blue');
    setProgress(20, '[1/4] Tạo sao lưu file pak gốc...');
    setTimeout(() => {
      setProgress(45, '[2/4] Tạo mồi Fallback UE5 (15-byte container)...');
      setTimeout(() => {
        setProgress(75, '[3/4] Chép 152,667 chuỗi Việt Hóa vào L10NString.dat...');
        setTimeout(() => {
          setProgress(90, '[4/4] Khóa cập nhật Purple Launcher...');
          setTimeout(() => {
            setProgress(100, 'CÀI ĐẶT HOÀN TẤT!');
            addLog('✔ ĐÃ BẬT TIẾNG VIỆT THÀNH CÔNG! Hãy vào game bằng Purple.', 'success');
            isInstalled.value = true;
            isBusy.value = false;
          }, 300);
        }, 350);
      }, 350);
    }, 300);
  }
}

function handleUninstall() {
  if (!isInstalled.value || isBusy.value) return;
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.uninstall_mod) {
    isBusy.value = true;
    pyApi.uninstall_mod(gameDir.value);
  } else {
    isBusy.value = true;
    addLog('Bắt đầu khôi phục bản gốc NCSoft...', 'blue');
    setProgress(30, '[1/3] Khôi phục file pak gốc từ bản sao lưu...');
    setTimeout(() => {
      setProgress(65, '[2/3] Xóa các file rời L10N...');
      setTimeout(() => {
        setProgress(90, '[3/3] Xóa cấu hình ExcludedUpdateList...');
        setTimeout(() => {
          setProgress(100, 'ĐÃ KHÔI PHỤC BẢN GỐC!');
          addLog('✔ Khôi phục 100% nguyên bản nhà phát hành hoàn tất.', 'success');
          isInstalled.value = false;
          isBusy.value = false;
        }, 300);
      }, 300);
    }, 300);
  }
}

onMounted(() => {
  // Bind pywebview callbacks
  (window as any).frontendApp = {
    log: (msg: string, type: string) => addLog(msg, type),
    setProgress: (pct: number, step: string) => {
      setProgress(pct, step);
      if (pct === 100) isBusy.value = false;
    },
    setState: (val: boolean) => {
      isInstalled.value = val;
      isBusy.value = false;
    },
    applyScanResult: (dir: string, installed: boolean) => {
      if (dir) gameDir.value = dir;
      isInstalled.value = installed;
      isBusy.value = false;
    }
  };

  window.addEventListener('pywebviewready', () => {
    const pyApi = (window as any).pywebview?.api;
    if (pyApi && pyApi.get_initial_state) {
      pyApi.get_initial_state().then((res: any) => {
        if (res) {
          if (res.gameDir) gameDir.value = res.gameDir;
          isInstalled.value = res.isInstalled;
        }
      });
    }
  });
});
</script>
