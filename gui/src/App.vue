<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="relative w-screen h-screen flex flex-col bg-[#090d16] text-[var(--text-main)] select-none overflow-hidden border border-[var(--border-subtle)] rounded-xl shadow-2xl">
      
      <!-- Splash / Loading Screen (~10s on launch) -->
      <div 
        v-if="!splashRemoved"
        class="absolute inset-0 z-50 flex flex-col justify-between bg-[#07090e] select-none transition-opacity duration-700 ease-out"
        :class="splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <!-- Top Drag Bar with Status & Window Controls -->
        <div class="h-11 px-3.5 flex items-center justify-between pywebview-drag-region bg-transparent">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Khởi tạo hệ thống</span>
          </div>
          <div class="flex items-center gap-1 no-drag">
            <button 
              @click="handleMinimize"
              title="Thu nhỏ"
              class="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button 
              @click="handleClose"
              title="Đóng"
              class="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Center Content: Logo & Brand -->
        <div class="flex flex-col items-center justify-center -mt-4 space-y-4">
          <div class="relative">
            <div class="absolute -inset-2 bg-gradient-to-r from-sky-500/25 to-blue-600/25 rounded-2xl blur-xl animate-pulse"></div>
            <img 
              src="./assets/logo.png" 
              alt="FEAR" 
              class="relative h-20 w-20 object-contain rounded-2xl border border-sky-400/30 bg-[#0d121f] p-1.5 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
            />
          </div>

          <div class="text-center space-y-1">
            <h1 class="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-sky-300">
              F-AION 2 TOOLS
            </h1>
            <p class="text-[11px] font-semibold tracking-wider text-sky-400/80 uppercase">
              Mod Manager & Game Optimizer • Team FEΔR
            </p>
          </div>
        </div>

        <!-- Bottom: Progress Bar & Dynamic Status -->
        <div class="px-10 pb-8 space-y-2.5">
          <div class="flex justify-between items-center text-[11px]">
            <div class="flex items-center gap-2 text-slate-300 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
              <span class="font-mono text-slate-300">{{ splashStatusText }}</span>
            </div>
            <div class="font-mono font-bold text-sky-400">
              {{ splashProgress }}%
            </div>
          </div>

          <!-- Sleek Progress Bar -->
          <div class="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div 
              class="h-full bg-gradient-to-r from-sky-600 via-sky-400 to-cyan-300 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(56,189,248,0.6)]"
              :style="{ width: `${splashProgress}%` }"
            ></div>
          </div>

          <div class="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
            <span>Powered by FEΔR Engine</span>
            <span>v{{ currentVersion }}</span>
          </div>
        </div>
      </div>
      
      <!-- Compact Header with Integrated Status Pill & Window Controls -->
      <div class="h-11 px-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[#0d121f]/95 shrink-0 pywebview-drag-region">
        <div class="flex items-center gap-2.5">
          <img src="./assets/logo.png" alt="FEAR" class="h-6 w-6 object-contain rounded-md border border-white/10 shadow-sm" />
          <div class="text-xs font-bold tracking-wider text-slate-200">
            F-Aion 2 Tools
          </div>
        </div>

        <div class="flex items-center gap-2.5 no-drag">
          <!-- Update Required Notification Pill -->
          <div 
            v-if="hasUpdate"
            @click="activeTab = 'about'"
            title="Nhấn để cập nhật ngay phiên bản mới"
            class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-sky-500/50 bg-sky-500/20 text-sky-300 animate-pulse cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-sky-500/30 transition-all"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>YÊU CẦU CẬP NHẬT v{{ latestVersion }}</span>
          </div>

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
          <n-tab name="tools" tab="Tools Mở Rộng" />
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
      <div v-show="activeTab === 'tools'" class="flex-1 p-3.5 overflow-y-auto flex flex-col justify-between">
        <div class="grid grid-cols-2 gap-2.5">
          <div 
            v-for="tool in toolsList" 
            :key="tool.title"
            @click="handleToolClick(tool)"
            class="p-3 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer relative group overflow-hidden"
            :class="tool.active 
              ? 'border-purple-500/50 bg-gradient-to-br from-purple-950/30 via-[var(--bg-card)] to-[#090d16] hover:border-purple-400 hover:shadow-[0_0_18px_rgba(139,92,246,0.3)] active:scale-[0.99]' 
              : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[#1a2337]/80 hover:border-sky-400/30'"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-1.5">
                <span v-if="tool.active" class="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#a855f7]"></span>
                <span class="font-bold text-white text-xs group-hover:text-purple-200 transition-colors">{{ tool.title }}</span>
              </div>
              <span 
                class="text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors"
                :class="tool.active
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 group-hover:bg-purple-600 group-hover:text-white'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'"
              >
                {{ tool.badge }}
              </span>
            </div>
            <div class="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {{ tool.desc }}
            </div>
            <div v-if="tool.active" class="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-purple-900/30 text-purple-300">
              <span class="flex items-center gap-1">
                <span>{{ tool.actionText || 'Khởi chạy' }}</span>
              </span>
              <span class="text-xs group-hover:translate-x-0.5 transition-transform text-purple-300">➔</span>
            </div>
          </div>
        </div>

        <!-- Nút truy cập Trang Web của Tôi (aion2-hub) -->
        <div 
          @click="openHubWeb"
          class="mt-2.5 p-2.5 px-3.5 rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-950/30 via-[var(--bg-card)] to-purple-950/30 hover:border-sky-400 hover:shadow-[0_0_16px_rgba(56,189,248,0.25)] transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-2">
                <span>AION 2 Hub</span>
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">TRANG WEB</span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono">https://aion2-hub-bice.vercel.app/</div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
            <span>Truy cập Web</span>
            <span>➔</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: About & Update -->
      <div v-show="activeTab === 'about'" class="flex-1 p-3.5 flex flex-col gap-2.5 overflow-y-auto">
        <!-- Top Row: App Brand Card -->
        <div class="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
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
          <div class="flex items-center gap-2 text-[11px]">
            <span class="text-slate-400">Tác giả:</span>
            <span class="font-semibold text-slate-200">SrymC (FEΔR Team)</span>
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
                <span>Yêu cầu cập nhật: v{{ latestVersion }} (Hiện tại: v{{ currentVersion }})</span>
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

      <!-- Footer with Website Link & @FEAR Github Link -->
      <div class="h-7 px-4 flex items-center justify-between border-t border-[var(--border-subtle)] bg-[#070a12] text-[11px] text-[var(--text-muted)] shrink-0">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-500/60"></span>
            <span class="text-slate-400 font-medium">cre by srymc</span>
          </div>
          <button 
            @click="openHubWeb"
            class="flex items-center gap-1 text-[10px] text-sky-400/80 hover:text-sky-300 transition-colors cursor-pointer bg-transparent border-0 p-0"
            title="Truy cập aion2-hub-bice.vercel.app"
          >
            <span>🌐</span>
            <span class="hover:underline">aion2-hub</span>
          </button>
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

      <!-- Twitch Drops Miner Modal (FEAR HUD Style) -->
      <n-modal v-model:show="showTwitchModal" :mask-closable="true">
        <div class="w-[620px] max-w-[95vw] bg-[#080b14] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.18)] space-y-4 text-slate-200 select-none">
          <!-- Header -->
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-extrabold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                FEΔR
              </div>
              <div>
                <div class="text-sm font-extrabold text-white tracking-wider flex items-center gap-2">
                  <span>TWITCH DROPS AUTO-MINER</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">DAEMON</span>
                </div>
                <div class="text-[10.5px] text-slate-400">Tự động tích lũy phút xem & nhận thưởng ngầm (0% GPU / Siêu nhẹ máy)</div>
              </div>
            </div>

            <!-- Status Indicator, Pop-out Button & Close Button -->
            <div class="flex items-center gap-2.5">
              <button 
                @click="handleLaunchTwitchWindow" 
                title="Mở cửa sổ rời Tactical Game HUD"
                class="px-2 py-0.5 rounded-md text-[10px] font-bold border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>CỬA SỔ RỜI</span>
                <span>↗</span>
              </button>
              <span 
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all"
                :class="twitchStatus.isRunning 
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="twitchStatus.isRunning ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'"></span>
                <span>{{ twitchStatus.isRunning ? 'ĐANG CÀY NGẦM' : 'TẠM DỪNG' }}</span>
              </span>
              <button 
                @click="showTwitchModal = false" 
                class="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Token Configuration & Controls (Exact DevilXD Formula) -->
          <div class="p-3.5 rounded-xl border border-slate-800/80 bg-[#0d121f] space-y-3">
            
            <!-- 1. Automatic 1-Click OAuth Activation (DevilXD SmartTV Device Code Flow) -->
            <div class="p-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/25 via-[#0c1322] to-purple-950/25 space-y-2">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="twitchStatus.hasToken ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'"></span>
                  <span class="text-xs font-bold text-white tracking-wide">
                    {{ twitchStatus.hasToken ? 'TÀI KHOẢN ĐÃ KẾT NỐI' : 'TỰ ĐỘNG ĐĂNG NHẬP (OAUTH DEVICE FLOW)' }}
                  </span>
                </div>
                <span class="text-[9.5px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  DEVILXD FORMULA
                </span>
              </div>

              <!-- When Connected -->
              <div v-if="twitchStatus.hasToken" class="flex justify-between items-center text-xs">
                <div class="text-slate-300">
                  Đã xác thực tài khoản: <strong class="text-cyan-300 font-mono">{{ twitchStatus.accountName || 'Đã kết nối' }}</strong>
                </div>
                <button 
                  @click="handleStartTwitchOAuth" 
                  :disabled="isStartingOAuth"
                  class="text-[10px] text-slate-400 hover:text-cyan-300 underline cursor-pointer bg-transparent border-0"
                >
                  Đổi tài khoản khác
                </button>
              </div>

              <!-- When Pending User Code -->
              <div v-else-if="twitchStatus.oauthState?.status === 'pending'" class="space-y-2 text-center py-1">
                <div class="text-[11px] text-slate-300">
                  Trình duyệt đã mở <code class="text-cyan-400 font-mono">twitch.tv/activate</code>. Hãy nhấn <strong class="text-white">Kích hoạt (Authorize)</strong>!
                </div>
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span class="text-[10px] text-slate-400 uppercase font-semibold">MÃ CỦA BẠN:</span>
                  <span class="text-sm font-black font-mono tracking-widest text-cyan-300">{{ twitchStatus.oauthState?.user_code }}</span>
                </div>
                <div class="flex items-center justify-center gap-2 text-[10px] text-slate-400 animate-pulse pt-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>Đang tự động chờ nhận Token sau khi bạn xác nhận...</span>
                </div>
              </div>

              <!-- When Idle / Not Connected -->
              <div v-else class="flex justify-between items-center pt-1">
                <div class="text-[10.5px] text-slate-400 leading-tight max-w-[65%]">
                  Tự động sinh mã OAuth SmartTV & mở trang kích hoạt Twitch — không cần F12 lấy cookie thủ công!
                </div>
                <n-button 
                  type="primary" 
                  size="small" 
                  :loading="isStartingOAuth"
                  @click="handleStartTwitchOAuth"
                  class="font-bold text-xs !px-3 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  1-Click Đăng Nhập
                </n-button>
              </div>
            </div>

            <!-- 2. Manual Token Accordion (Fallback) -->
            <div class="pt-1">
              <div 
                @click="showManualToken = !showManualToken" 
                class="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer flex items-center justify-between font-mono"
              >
                <span>Nhập auth-token thủ công (Tùy chọn phụ)</span>
                <span>{{ showManualToken ? '▲' : '▼' }}</span>
              </div>
              <div v-if="showManualToken" class="mt-2 space-y-1.5">
                <div class="flex gap-2">
                  <n-input
                    v-model:value="twitchTokenInput"
                    type="password"
                    show-password-on="click"
                    placeholder="Dán mã auth-token nếu muốn nhập thủ công..."
                    size="small"
                    class="flex-1 font-mono text-xs"
                  />
                  <n-button secondary size="small" @click="handleSaveTwitchToken" class="!px-3 text-xs font-semibold">
                    Lưu
                  </n-button>
                </div>
              </div>
            </div>

            <!-- 3. Toggles & Action Buttons Row -->
            <div class="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
              <div class="flex items-center gap-2">
                <n-switch v-model:value="twitchAutoClaim" size="small" @update:value="handleToggleTwitchAutoClaim" />
                <span class="text-[11px] text-slate-300 font-medium">Tự động Claim khi đủ 100%</span>
              </div>

              <div class="flex items-center gap-2">
                <n-button 
                  size="small" 
                  :type="twitchStatus.isRunning ? 'error' : 'primary'"
                  @click="handleToggleTwitchMiner"
                  class="font-bold text-xs !px-4"
                >
                  {{ twitchStatus.isRunning ? 'DỪNG CÀY NGẦM' : 'BẬT CÀY NGẦM' }}
                </n-button>
                <n-button secondary size="small" @click="handleOpenTwitchInventory" class="text-xs text-purple-400 hover:text-purple-300">
                  Kho Drops
                </n-button>
                <n-button secondary size="small" @click="refreshTwitchStatus" class="text-xs">
                  Quét Lại
                </n-button>
              </div>
            </div>
          </div>

          <!-- Active Streamer Banner when Mining -->
          <div v-if="twitchStatus.isRunning && twitchStatus.currentChannel" class="flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span class="text-xs text-slate-300">Đang cày ngầm kênh:</span>
              <span class="text-xs font-bold font-mono text-cyan-300">{{ twitchStatus.currentChannel.displayName }}</span>
            </div>
            <div class="text-[10.5px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>{{ twitchStatus.currentChannel.viewers ? Number(twitchStatus.currentChannel.viewers).toLocaleString() : '' }} viewers</span>
              <span v-if="twitchStatus.minutesMined" class="text-purple-300 font-semibold">(+{{ twitchStatus.minutesMined }}m)</span>
            </div>
          </div>

          <!-- In-Progress Drops List -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Chiến Dịch Đang Tích Lũy</span>
              <span class="text-[10px] text-slate-500 font-normal font-mono" v-if="twitchStatus.lastChecked">Quét lúc: {{ twitchStatus.lastChecked }}</span>
            </div>

            <div class="max-h-52 overflow-y-auto space-y-2 pr-1">
              <div v-if="!twitchStatus.campaigns || twitchStatus.campaigns.length === 0" class="p-5 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl bg-[#0d121f]">
                {{ twitchStatus.hasToken ? 'Không có chiến dịch Drop nào đang tiến hành hoặc chưa bật stream.' : 'Vui lòng nhập auth-token để kiểm tra các Drop đang hoạt động.' }}
              </div>

              <template v-else v-for="camp in twitchStatus.campaigns" :key="camp.id">
                <div 
                  v-for="drop in (camp.timeBasedDrops || [])" 
                  :key="drop.id"
                  class="p-3 rounded-xl border border-slate-800/90 bg-[#0d121f] space-y-2"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-cyan-300">{{ camp.game?.displayName || camp.name }}</span>
                    <span 
                      class="text-[9.5px] font-bold px-2 py-0.5 rounded border"
                      :class="drop.isClaimed 
                        ? 'bg-slate-800 text-slate-400 border-slate-700' 
                        : (drop.currentMinutesWatched >= drop.requiredMinutesWatched 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.35)]' 
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30')"
                    >
                      {{ drop.isClaimed ? 'ĐÃ NHẬN' : (drop.currentMinutesWatched >= drop.requiredMinutesWatched ? 'SẴN SÀNG NHẬN' : `${Math.min(100, Math.round((drop.currentMinutesWatched / (drop.requiredMinutesWatched || 60)) * 100))}%`) }}
                    </span>
                  </div>

                  <div class="flex justify-between text-[11px] text-slate-300">
                    <span class="truncate max-w-[70%] font-medium">{{ drop.name }}</span>
                    <span class="font-mono text-[10px] text-slate-400">{{ drop.currentMinutesWatched }}/{{ drop.requiredMinutesWatched }}m</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                    <div 
                      class="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      :style="{ width: `${Math.min(100, Math.round((drop.currentMinutesWatched / (drop.requiredMinutesWatched || 60)) * 100))}%` }"
                    ></div>
                  </div>

                  <div v-if="!drop.isClaimed && drop.currentMinutesWatched >= drop.requiredMinutesWatched" class="pt-1 flex justify-end">
                    <button 
                      @click="handleManualClaim(drop.dropInstanceID, drop.name)"
                      class="px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
                    >
                      Nhận Quà Ngay
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Claim History -->
          <div v-if="twitchStatus.claimHistory && twitchStatus.claimHistory.length > 0" class="space-y-1.5 pt-1.5 border-t border-slate-800">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lịch Sử Nhận Quà Gần Đây</div>
            <div class="max-h-20 overflow-y-auto space-y-1 bg-[#06080e] p-2 rounded-lg border border-slate-800/70 text-[10px] font-mono">
              <div v-for="(item, idx) in twitchStatus.claimHistory" :key="idx" class="flex justify-between text-slate-300">
                <span class="text-purple-300 truncate max-w-[80%]">🎁 {{ item.dropName }} ({{ item.gameName }})</span>
                <span class="text-slate-500">{{ item.time }}</span>
              </div>
            </div>
          </div>

        </div>
      </n-modal>

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
  NModal,
  NSwitch,
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
const currentVersion = ref('1.1.0');
const latestVersion = ref('1.1.0');
const hasUpdate = ref(false);
const securityKey = ref('fearAion2Tran-key');
const securityStatus = ref('active');
const securityMessage = ref('Đã xác thực bản quyền FEAR (Active)');
const changelog = ref('');
const lastChecked = ref('');
const isCheckingUpdate = ref(false);

// Splash / Loading Screen State (~10s)
const splashProgress = ref(0);
const splashStatusText = ref('Khởi tạo hệ thống FEΔR Engine...');
const splashFading = ref(false);
const splashRemoved = ref(false);

const logs = ref<LogItem[]>([
  { time: new Date().toLocaleTimeString(), text: 'Khởi tạo hệ thống quản lý AION 2.', type: 'blue' }
]);

const toolsList = [
  {
    id: 'dps',
    title: 'AION 2 DPS Meter',
    badge: 'PLUGIN',
    desc: 'Đo DPS thời gian thực & Target Tracking.',
    actionText: 'Khởi chạy DPS Meter',
    active: true
  },
  {
    id: 'twitch',
    title: 'Twitch Drops Miner',
    badge: 'FEΔR PLUGIN',
    desc: 'Tự động cày & nhận Drop Twitch ngầm không tốn GPU/RAM.',
    actionText: 'Mở Bảng Điều Khiển',
    active: true
  },
  {
    id: 'tcp',
    title: 'TCP/UDP Optimizer',
    badge: 'PHÁT TRIỂN',
    desc: 'Tối ưu ping & độ trễ kết nối máy chủ.',
    actionText: 'Chi tiết',
    active: false
  },
  {
    id: 'fov',
    title: 'Góc nhìn FOV Extender',
    badge: 'PHÁT TRIỂN',
    desc: 'Mở rộng tầm nhìn và khoảng cách camera.',
    actionText: 'Chi tiết',
    active: false
  }
];

// Twitch Drops Miner State & Handlers (DevilXD Formula)
const showTwitchModal = ref(false);
const showManualToken = ref(false);
const isStartingOAuth = ref(false);
const twitchTokenInput = ref('');
const twitchAutoClaim = ref(true);
let oauthPollTimer: any = null;

const twitchStatus = ref({
  isRunning: false,
  hasToken: false,
  autoClaim: true,
  accountName: '',
  userId: '',
  currentChannel: null as any,
  minutesMined: 0,
  lastChecked: '',
  campaigns: [] as any[],
  claimHistory: [] as any[],
  oauthState: {
    status: 'idle',
    user_code: '',
    activate_url: 'https://www.twitch.tv/activate'
  }
});

function handleToolClick(tool: any) {
  if (tool.id === 'dps') {
    handleLaunchDpsMeter();
  } else if (tool.id === 'twitch') {
    handleLaunchTwitchWindow();
  } else {
    addLog(`Công cụ [${tool.title}] đang trong lộ trình phát triển của Team FEΔR.`, 'blue');
  }
}

function handleLaunchTwitchWindow() {
  showTwitchModal.value = false;
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.launch_twitch_window) {
    pyApi.launch_twitch_window();
  } else {
    openTwitchModal();
  }
}

function openTwitchModal() {
  showTwitchModal.value = true;
  refreshTwitchStatus();
}

function refreshTwitchStatus() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.get_twitch_drops_status) {
    pyApi.get_twitch_drops_status().then((res: any) => {
      if (res) {
        twitchStatus.value = res;
        twitchAutoClaim.value = res.autoClaim ?? true;
      }
    }).catch((e: any) => console.warn(e));
  }
}

function handleStartTwitchOAuth() {
  const pyApi = (window as any).pywebview?.api;
  if (!pyApi || !pyApi.start_twitch_oauth) return;
  isStartingOAuth.value = true;
  pyApi.start_twitch_oauth().then((res: any) => {
    isStartingOAuth.value = false;
    if (res && res.success) {
      addLog(`Mã kích hoạt Twitch: [${res.userCode}]. Đang mở trang xác thực...`, 'blue');
      refreshTwitchStatus();
      if (oauthPollTimer) clearInterval(oauthPollTimer);
      oauthPollTimer = setInterval(() => {
        refreshTwitchStatus();
        if (twitchStatus.value.oauthState?.status === 'success' || twitchStatus.value.hasToken) {
          clearInterval(oauthPollTimer);
          oauthPollTimer = null;
        }
      }, 3000);
    } else {
      addLog(`Lỗi khởi tạo OAuth: ${res?.error || 'Không xác định'}`, 'red');
    }
  }).catch((e: any) => {
    isStartingOAuth.value = false;
    console.warn(e);
  });
}

function handleSaveTwitchToken() {
  if (!twitchTokenInput.value.trim()) {
    addLog('Vui lòng nhập Twitch OAuth token.', 'red');
    return;
  }
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.set_twitch_auth_token) {
    pyApi.set_twitch_auth_token(twitchTokenInput.value.trim()).then(() => {
      addLog('Đã cập nhật token Twitch Drops Miner.', 'blue');
      twitchTokenInput.value = '';
      setTimeout(refreshTwitchStatus, 1200);
    }).catch((e: any) => console.warn(e));
  }
}

function handleToggleTwitchAutoClaim(val: boolean) {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.set_twitch_auto_claim) {
    pyApi.set_twitch_auto_claim(val).then(() => {
      refreshTwitchStatus();
    }).catch((e: any) => console.warn(e));
  }
}

let minerPollTimer: any = null;

function handleToggleTwitchMiner() {
  const pyApi = (window as any).pywebview?.api;
  if (!pyApi) return;
  if (twitchStatus.value.isRunning) {
    if (pyApi.stop_twitch_miner) {
      pyApi.stop_twitch_miner().then(() => {
        refreshTwitchStatus();
        if (minerPollTimer) {
          clearInterval(minerPollTimer);
          minerPollTimer = null;
        }
      }).catch((e: any) => console.warn(e));
    }
  } else {
    if (pyApi.start_twitch_miner) {
      pyApi.start_twitch_miner().then(() => {
        setTimeout(refreshTwitchStatus, 1500);
        if (!minerPollTimer) {
          minerPollTimer = setInterval(refreshTwitchStatus, 15000);
        }
      }).catch((e: any) => console.warn(e));
    }
  }
}

function handleOpenTwitchInventory() {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.open_twitch_inventory) {
    pyApi.open_twitch_inventory();
  } else {
    window.open('https://www.twitch.tv/drops/inventory', '_blank');
  }
}

function handleManualClaim(dropId: string, dropName: string) {
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.claim_twitch_drop) {
    addLog(`Đang gửi yêu cầu claim: ${dropName}...`, 'blue');
    pyApi.claim_twitch_drop(dropId, dropName).then(() => {
      setTimeout(refreshTwitchStatus, 1000);
    }).catch((e: any) => console.warn(e));
  }
}

function handleLaunchDpsMeter() {
  addLog('Đang kích hoạt Plugin AION 2 DPS Meter (ProgramData)...', 'blue');
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.launch_dps_meter) {
    pyApi.launch_dps_meter();
  } else if (pyApi && pyApi.launch_dps_overlay) {
    pyApi.launch_dps_overlay();
  } else {
    window.open('dps_overlay.html', '_blank', 'width=1000,height=660');
    addLog('Mở cửa sổ DPS trong trình duyệt.', 'success');
  }
}

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

function openHubWeb() {
  addLog('Đang mở trang web AION 2 Hub (aion2-hub-bice.vercel.app)...', 'blue');
  const pyApi = (window as any).pywebview?.api;
  if (pyApi && pyApi.open_hub_web) {
    pyApi.open_hub_web();
  } else if (pyApi && pyApi.open_url) {
    pyApi.open_url('https://aion2-hub-bice.vercel.app/');
  } else {
    window.open('https://aion2-hub-bice.vercel.app/', '_blank');
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
  if (hasUpdate.value) {
    addLog(`⚠️ YÊU CẦU CẬP NHẬT: Đã có phiên bản v${latestVersion.value} (Hiện tại: v${currentVersion.value}). Vui lòng cập nhật phần mềm trước khi cài đặt!`, 'red');
    activeTab.value = 'about';
    return;
  }
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
  // 10s Splash Screen Sequence (100 steps * 100ms = 10,000ms)
  const splashInterval = setInterval(() => {
    splashProgress.value += 1;
    if (splashProgress.value <= 20) {
      splashStatusText.value = 'Khởi tạo hệ thống FEΔR Engine...';
    } else if (splashProgress.value <= 45) {
      splashStatusText.value = 'Quét cấu trúc thư mục & Registry AION 2...';
    } else if (splashProgress.value <= 70) {
      splashStatusText.value = 'Xác thực gói ngôn ngữ L10N & mã hóa...';
    } else if (splashProgress.value <= 90) {
      splashStatusText.value = 'Kiểm tra kết nối máy chủ & cập nhật...';
    } else if (splashProgress.value < 100) {
      splashStatusText.value = 'Hoàn tất khởi tạo môi trường...';
    } else {
      splashStatusText.value = 'Sẵn sàng khởi chạy giao diện!';
      clearInterval(splashInterval);
      setTimeout(() => {
        splashFading.value = true;
        setTimeout(() => {
          splashRemoved.value = true;
        }, 700);
      }, 400);
    }
  }, 100);

  setupWindowDrag();

  let attempts = 0;
  const initInterval = setInterval(async () => {
    attempts++;
    const pyApi = (window as any).pywebview?.api;
    if (pyApi && pyApi.get_status) {
      try {
        const status = await pyApi.get_status();
        if (status) {
          if (status.gameDir) gameDir.value = status.gameDir;
          isInstalled.value = status.isInstalled;
          if (status.securityInfo) applySecurityInfo(status.securityInfo);
          if (status.logs && status.logs.length > 0) {
            for (const item of status.logs) {
              addLog(item.text, item.type);
            }
          }
          if (status.gameDir || attempts > 20) {
            clearInterval(initInterval);
          }
        }
      } catch (err) {
        console.warn("get_status error:", err);
      }
    }
    if (attempts > 30) clearInterval(initInterval);
  }, 200);
});

function setupWindowDrag() {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafPending = false;
  let isMoving = false;

  const nonDraggableSelectors = [
    'button',
    'input',
    'textarea',
    'select',
    'a',
    '.no-drag',
    '.n-button',
    '.n-base-select-menu',
    '.n-input',
    '.n-tabs-tab',
    '.n-modal',
    '.cursor-pointer',
    '[role="button"]',
    '[role="tab"]'
  ];

  function isInteractive(target: HTMLElement | null): boolean {
    if (!target || target === document.body || target === document.documentElement) return false;
    for (const sel of nonDraggableSelectors) {
      if (target.closest && target.closest(sel)) return true;
    }
    return false;
  }

  window.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (isInteractive(target)) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    targetX = Math.round(e.screenX - startX);
    targetY = Math.round(e.screenY - startY);

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(async () => {
        rafPending = false;
        if (!isDragging || isMoving) return;
        isMoving = true;
        try {
          const curX = targetX;
          const curY = targetY;
          const pyApi = (window as any).pywebview?.api;
          if (pyApi && pyApi.move_main_window) {
            await pyApi.move_main_window(curX, curY);
          } else if ((window as any).pywebview?._jsApiCallback) {
            (window as any).pywebview._jsApiCallback('pywebviewMoveWindow', [curX, curY], 'move');
          }
        } catch {
        } finally {
          isMoving = false;
        }
      });
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    rafPending = false;
    isMoving = false;
  });
}
</script>
