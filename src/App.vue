<template>
  <div class="app-layout">
    <!-- WATERMARK BACKGROUND -->
    <div class="app-watermark">
      <img src="/logo-sate-duktek.png" alt="" />
    </div>

    <!-- TOP NAVIGATION BAR (2-Row Command Bar) -->
    <header class="app-header glass-panel">
      <!-- Row 1: Brand + Month Selector -->
      <div class="header-row-1">
        <div class="logo-area">
          <img src="/logo-sate-duktek.png" alt="Logo SATE-DUKTEK" class="logo-img" />
          <div class="logo-text">
            <h2>SATE-DUKTEK</h2>
            <span>Sajian Roster Duktek yang Pas, Matang, &amp; Bebas Bentrok</span>
          </div>
        </div>

        <div class="month-selector-panel">
          <button class="selector-btn" @click="store.changeMonth(-1)">
            <ChevronLeft class="icon-nav" />
          </button>
          <div class="current-month-display">
            <Calendar class="icon-calendar" />
            <span>{{ currentMonthName }} {{ store.currentYear }}</span>
          </div>
          <button class="selector-btn" @click="store.changeMonth(1)">
            <ChevronRight class="icon-nav" />
          </button>
        </div>
      </div>

      <!-- Row 2: Actions + Quick Jump + Shortcuts -->
      <div class="header-row-2">
        <div class="action-buttons-group">
          <!-- Unified Generate Split Button -->
          <div class="split-button-group">
            <button 
              class="btn btn-primary split-main" 
              @click="openBulkModal"
              :disabled="store.activeJuniors.length === 0"
            >
              <CalendarRange class="icon-btn-size" />
              Proyeksikan Roster
            </button>
            <button 
              class="btn btn-primary split-toggle" 
              @click.stop="showGenerateMenu = !showGenerateMenu"
              :disabled="store.activeJuniors.length === 0"
            >
              <ChevronDown class="icon-btn-size" />
            </button>
            <template v-if="showGenerateMenu">
              <div class="split-dropdown-backdrop" @click="showGenerateMenu = false"></div>
              <div class="split-dropdown-menu animate-fade-in">
                <button class="split-dropdown-item" @click="openBulkModal(); showGenerateMenu = false">
                  <CalendarRange class="icon-btn-size" />
                  Proyeksi Multi-Bulan...
                  <kbd>Ctrl+Shift+G</kbd>
                </button>
                <button class="split-dropdown-item" @click="handleGenerate">
                  <Sparkles class="icon-btn-size" />
                  Proyeksikan Bulan Ini
                  <kbd>Ctrl+G</kbd>
                </button>
              </div>
            </template>
          </div>

          <button 
            class="btn btn-secondary" 
            @click="handleExportClick"
            :disabled="generatedMonths.length === 0"
          >
            <Download class="icon-btn-size" />
            Unduh CSV
          </button>
          <button class="btn btn-danger" @click="handleReset">
            <RefreshCw class="icon-btn-size" />
            Reset
          </button>
        </div>

        <div class="header-right-actions">
          <div class="quick-jump-group">
            <button class="quick-jump-btn" @click="scrollToSection('team-section')" title="Loncat ke Kelola Tim">
              <Users class="icon-btn-size" /> Tim
            </button>
            <button 
              class="quick-jump-btn" 
              :class="{ 'has-errors': errors.length > 0 }"
              @click="scrollToSection('validation-section')" 
              title="Loncat ke Panel Verifikasi"
            >
              <CheckCircle2 v-if="errors.length === 0" class="icon-btn-size" />
              <AlertCircle v-else class="icon-btn-size" />
              {{ errors.length > 0 ? errors.length + ' Error' : 'Valid' }}
            </button>
          </div>
          <button class="shortcuts-trigger" @click="showShortcutsPanel = true" title="Pintasan Keyboard (?)">
            <Keyboard class="icon-btn-size" /> Pintasan
          </button>
        </div>
      </div>
    </header>

    <main class="container animate-fade-in">
      <!-- DASHBOARD OVERVIEW CARDS -->
      <section class="dashboard-stats-grid">
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper purple">
            <Users class="stat-icon" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.members.juniors.length }} Orang</div>
            <div class="stat-label">Total Tim Junior</div>
          </div>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper cyan">
            <UserCheck class="stat-icon" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.activeJuniors.length }} Aktif</div>
            <div class="stat-label">Junior Masuk Roster</div>
          </div>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper pink">
            <Calendar class="stat-icon" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ store.daysInCurrentMonth }} Hari</div>
            <div class="stat-label">Durasi Bulan Berjalan</div>
          </div>
        </div>

        <div class="glass-card stat-card" :class="{ 'error-border': errors.length > 0, 'success-border': errors.length === 0 }">
          <div class="stat-icon-wrapper" :class="errors.length > 0 ? 'red' : 'green'">
            <AlertCircle v-if="errors.length > 0" class="stat-icon text-red" />
            <CheckCircle2 v-else class="stat-icon text-green" />
          </div>
          <div class="stat-info">
            <div class="stat-value" :class="errors.length > 0 ? 'text-red' : 'text-green'">
              {{ errors.length > 0 ? `${errors.length} Pelanggaran` : '100% Sesuai' }}
            </div>
            <div class="stat-label">Kepatuhan Aturan Roster</div>
          </div>
        </div>
      </section>

      <!-- ROSTER SHIFT TABLE SECTION -->
      <section class="roster-section">
        <div class="section-title-bar">
          <h3>
            <Calendar class="icon-section" />
            Matriks Roster Dukungan Teknis (Support CloudKilat)
          </h3>
          <span v-if="scheduleStatusText" class="schedule-status-banner" :class="scheduleStatusClass">
            {{ scheduleStatusText }}
          </span>
        </div>
        <ScheduleGrid />
      </section>

      <!-- SUMMARY & LEGEND SECTION -->
      <section class="roster-summary-section" v-if="store.currentMonthSchedule">
        <SummaryTables />
      </section>

      <!-- DUAL PANEL: TEAM MANAGEMENT & VERIFICATION -->
      <section class="dual-panel-layout">
        <div id="team-section" class="panel-column flex-2">
          <TeamManager />
        </div>
        <div id="validation-section" class="panel-column flex-1">
          <ValidationPanel />
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <p class="text-secondary text-xs">
        &copy; {{ new Date().getFullYear() }} Tim Support CloudKilat. SATE-DUKTEK — Sajian Roster Duktek yang Pas, Matang, &amp; Bebas Bentrok.
      </p>
    </footer>

    <!-- BULK GENERATE MODAL -->
    <div v-if="showBulkModal" class="modal-overlay" @click.self="showBulkModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <CalendarRange class="modal-header-icon" />
          <h3>Proyeksi Roster Multi-Bulan</h3>
        </div>
        <div class="modal-body">
          <p class="modal-desc">
            Sistem akan membuat roster secara berurutan mulai dari bulan berjalan dengan membawa riwayat shift bulan sebelumnya secara otomatis agar kontinuitas roster terjaga.
          </p>
          <div class="custom-range-input modal-form-group-top">
            <label for="target-month-select" class="modal-form-label">
              Proyeksikan hingga bulan:
            </label>
            <select 
              id="target-month-select" 
              v-model="bulkMonthsCount" 
              class="modal-form-select"
            >
              <option 
                v-for="opt in targetMonthOptions" 
                :key="opt.label" 
                :value="opt.value"
              >
                {{ opt.label }} (Total {{ opt.value }} Bulan)
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBulkModal = false">Batal</button>
          <button class="btn btn-primary" @click="startBulkGenerate">Mulai Proyeksi</button>
        </div>
      </div>
    </div>

    <!-- EXPORT MULTI-MONTH MODAL -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <Download class="modal-header-icon" />
          <h3>Ekspor Roster Dukungan</h3>
        </div>
        <div class="modal-body">
          <p class="modal-desc">
            Pilih metode ekspor data roster ke format CSV untuk diimpor ke aplikasi spreadsheet seperti Microsoft Excel.
          </p>
          
          <!-- Mode Selection -->
          <div class="modal-form-group">
            <label class="modal-form-label">Pilih Mode Ekspor:</label>
            <div class="modal-radio-group">
              <label class="modal-radio-label">
                <input type="radio" value="single" v-model="exportMode" />
                Bulan Aktif Saja
              </label>
              <label class="modal-radio-label">
                <input type="radio" value="range" v-model="exportMode" />
                Rentang Bulan
              </label>
            </div>
          </div>

          <!-- Single Month Selector -->
          <div v-if="exportMode === 'single'" class="custom-range-input">
            <label for="export-single-select" class="modal-form-sublabel">Bulan Roster:</label>
            <select 
              id="export-single-select" 
              v-model="exportStartKey" 
              class="modal-form-select"
            >
              <option 
                v-for="opt in generatedMonths" 
                :key="opt.key" 
                :value="opt.key"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Month Range Selectors -->
          <div v-else class="modal-range-selectors">
            <div>
              <label for="export-start-select" class="modal-form-sublabel">Mulai Bulan:</label>
              <select 
                id="export-start-select" 
                v-model="exportStartKey" 
                class="modal-form-select"
              >
                <option 
                  v-for="opt in generatedMonths" 
                  :key="opt.key" 
                  :value="opt.key"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label for="export-end-select" class="modal-form-sublabel">Sampai Bulan:</label>
              <select 
                id="export-end-select" 
                v-model="exportEndKey" 
                class="modal-form-select"
              >
                <option 
                  v-for="opt in generatedMonths" 
                  :key="opt.key" 
                  :value="opt.key"
                  :disabled="opt.key < exportStartKey"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showExportModal = false">Batal</button>
          <button class="btn btn-primary" @click="triggerCSVDownload">Unduh CSV</button>
        </div>
      </div>
    </div>

    <!-- BULK GENERATE LOADING OVERLAY -->
    <div v-if="isGeneratingBulk" class="loading-overlay">
      <Loader2 class="spinner-large" />
      <span class="loading-text">Menghitung Proyeksi Roster...</span>
      <span class="loading-subtext">Sedang memproses: {{ currentGeneratingMonth }}</span>
    </div>

    <!-- KEYBOARD SHORTCUTS PANEL -->
    <template v-if="showShortcutsPanel">
      <div class="shortcuts-panel-backdrop" @click="showShortcutsPanel = false"></div>
      <div class="shortcuts-panel animate-fade-in-center">
        <div class="shortcuts-header">
          <h4><Keyboard class="icon-section" /> Pintasan Keyboard</h4>
          <button class="shortcuts-close" @click="showShortcutsPanel = false">&times;</button>
        </div>
        <div class="shortcuts-list">
          <div class="shortcut-row">
            <span>Proyeksikan Bulan Ini</span>
            <div class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>G</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Proyeksi Multi-Bulan</span>
            <div class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Unduh / Ekspor CSV</span>
            <div class="shortcut-keys"><kbd>Ctrl</kbd>+<kbd>E</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Bulan Sebelumnya</span>
            <div class="shortcut-keys"><kbd>PageUp</kbd> <span class="shortcut-or">atau</span> <kbd>Alt</kbd>+<kbd>←</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Bulan Berikutnya</span>
            <div class="shortcut-keys"><kbd>PageDown</kbd> <span class="shortcut-or">atau</span> <kbd>Alt</kbd>+<kbd>→</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Buka / Tutup Panel Ini</span>
            <div class="shortcut-keys"><kbd>?</kbd></div>
          </div>
          <div class="shortcut-row">
            <span>Tutup Modal / Dropdown</span>
            <div class="shortcut-keys"><kbd>Esc</kbd></div>
          </div>
        </div>
      </div>
    </template>

    <!-- TOAST NOTIFICATION STACK -->
    <div class="toast-stack">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-notification" 
        :class="'toast-' + toast.type"
      >
        {{ toast.message }}
      </div>
    </div>

    <!-- CUSTOM CONFIRM DIALOG -->
    <div v-if="confirmDialog.visible" class="modal-overlay" @click.self="confirmNo">
      <div class="modal-content">
        <div class="modal-header">
          <AlertCircle class="modal-header-icon" />
          <h3>{{ confirmDialog.title }}</h3>
        </div>
        <div class="modal-body">
          <p class="confirm-dialog-body">{{ confirmDialog.message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="confirmNo">Batal</button>
          <button class="btn btn-danger" @click="confirmYes">Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, reactive, watch } from 'vue';
import { useScheduleStore } from './stores/scheduleStore';
import ScheduleGrid from './components/ScheduleGrid.vue';
import ValidationPanel from './components/ValidationPanel.vue';
import TeamManager from './components/TeamManager.vue';
import SummaryTables from './components/SummaryTables.vue';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  Loader2,
  Keyboard
} from 'lucide-vue-next';

const store = useScheduleStore();

// Bulk generate state
const showBulkModal = ref(false);
const bulkMonthsCount = ref(6);
const isGeneratingBulk = ref(false);
const currentGeneratingMonth = ref('');

// Export state
const showExportModal = ref(false);
const exportMode = ref('single'); // 'single' | 'range'
const exportStartKey = ref('');
const exportEndKey = ref('');

// UI Enhancement state
const showGenerateMenu = ref(false);
const showShortcutsPanel = ref(false);

// Toast notification system
const toasts = ref([]);
let toastIdCounter = 0;

function showToast(message, type = 'success', duration = 3000) {
  const id = ++toastIdCounter;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
}

// Custom confirm dialog
const confirmDialog = reactive({
  visible: false,
  title: '',
  message: '',
  resolve: null
});

function showConfirm(title, message) {
  return new Promise((resolve) => {
    confirmDialog.title = title;
    confirmDialog.message = message;
    confirmDialog.visible = true;
    confirmDialog.resolve = resolve;
  });
}

function confirmYes() {
  confirmDialog.visible = false;
  if (confirmDialog.resolve) confirmDialog.resolve(true);
}

function confirmNo() {
  confirmDialog.visible = false;
  if (confirmDialog.resolve) confirmDialog.resolve(false);
}

// Quick jump scroll
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const generatedMonths = computed(() => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return Object.keys(store.schedules)
    .filter(key => store.schedules[key]?.schedule)
    .sort()
    .map(key => {
      const [year, month] = key.split('-').map(Number);
      return {
        key,
        label: `${monthNames[month - 1]} ${year}`,
        year,
        month: month - 1
      };
    });
});

watch(exportStartKey, (newStart) => {
  if (exportEndKey.value < newStart) {
    exportEndKey.value = newStart;
  }
});

const targetMonthOptions = computed(() => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const options = [];
  let m = store.currentMonth;
  let y = store.currentYear;
  
  for (let i = 1; i <= 24; i++) {
    options.push({
      value: i,
      label: `${monthNames[m]} ${y}`,
      month: m,
      year: y
    });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return options;
});

function openBulkModal() {
  showBulkModal.value = true;
  const decOption = targetMonthOptions.value.find(opt => opt.month === 11 && opt.year === store.currentYear);
  if (decOption) {
    bulkMonthsCount.value = decOption.value;
  } else {
    bulkMonthsCount.value = 6;
  }
}

const errors = computed(() => store.validationErrors);

const currentMonthName = computed(() => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return monthNames[store.currentMonth];
});

const scheduleStatusText = computed(() => {
  const sched = store.schedules[store.currentKey];
  if (!sched) return 'Belum Diinisialisasi';
  if (sched.metadata?.success) return 'Roster Valid (Otomatis)';
  if (sched.metadata?.patterns && Object.keys(sched.metadata.patterns).length > 0) return 'Roster Kustom';
  return 'Roster Kosong / Manual';
});

const scheduleStatusClass = computed(() => {
  const sched = store.schedules[store.currentKey];
  if (!sched) return 'status-muted';
  if (sched.metadata?.success && errors.value.length === 0) return 'status-success';
  if (errors.value.length > 0) return 'status-error';
  return 'status-warning';
});

function handleKeyDown(e) {
  const activeEl = document.activeElement;
  if (activeEl && (
    activeEl.tagName === 'INPUT' ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.tagName === 'SELECT' ||
    activeEl.isContentEditable
  )) {
    return;
  }
  
  const isCtrl = e.ctrlKey || e.metaKey;
  const isAlt = e.altKey;
  const isShift = e.shiftKey;

  // Escape — close any open modal/dropdown/panel
  if (e.key === 'Escape') {
    showGenerateMenu.value = false;
    showShortcutsPanel.value = false;
    showBulkModal.value = false;
    showExportModal.value = false;
    e.preventDefault();
    return;
  }
  
  // ? — toggle shortcuts panel
  if (e.key === '?') {
    showShortcutsPanel.value = !showShortcutsPanel.value;
    e.preventDefault();
    return;
  }

  // Ctrl+G — generate current month
  if (isCtrl && !isShift && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault();
    if (store.activeJuniors.length > 0) handleGenerate();
    return;
  }

  // Ctrl+Shift+G — bulk generate
  if (isCtrl && isShift && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault();
    if (store.activeJuniors.length > 0) openBulkModal();
    return;
  }

  // Ctrl+E — export
  if (isCtrl && (e.key === 'e' || e.key === 'E')) {
    e.preventDefault();
    handleExportClick();
    return;
  }

  // PageUp / Alt+Left — previous month
  if (e.key === 'PageUp' || (isAlt && e.key === 'ArrowLeft')) {
    store.changeMonth(-1);
    e.preventDefault();
  } else if (e.key === 'PageDown' || (isAlt && e.key === 'ArrowRight')) {
    store.changeMonth(1);
    e.preventDefault();
  }
}

onMounted(() => {
  const key = store.currentKey;
  if (!store.schedules[key]) {
    store.initializeEmptySchedule();
  }
  store.validateCurrentSchedule();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function handleGenerate() {
  showGenerateMenu.value = false;
  store.generateCurrentSchedule();
  if (errors.value.length > 0) {
    showToast('Roster dibuat, tetapi beberapa batasan dilanggar karena keterbatasan staf. Silakan sesuaikan secara manual.', 'warning', 5000);
  } else {
    showToast('Roster berhasil disusun 100% valid!', 'success');
  }
}

async function startBulkGenerate() {
  if (bulkMonthsCount.value < 1) return;
  
  isGeneratingBulk.value = true;
  showBulkModal.value = false;
  
  // Biarkan modal menutup dan render overlay
  await new Promise(r => setTimeout(r, 100));
  
  const startMonth = store.currentMonth;
  const startYear = store.currentYear;
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  try {
    for (let i = 0; i < bulkMonthsCount.value; i++) {
      currentGeneratingMonth.value = `${monthNames[store.currentMonth]} ${store.currentYear}`;
      
      // Delay singkat untuk visual progress
      await new Promise(r => setTimeout(r, 200));
      
      store.generateCurrentSchedule();
      
      // Maju ke bulan berikutnya
      let nextM = store.currentMonth + 1;
      let nextY = store.currentYear;
      if (nextM > 11) {
        nextM = 0;
        nextY += 1;
      }
      store.currentMonth = nextM;
      store.currentYear = nextY;
    }
  } catch (err) {
    console.error(err);
    showToast('Terjadi kesalahan saat melakukan proyeksi roster.', 'error', 5000);
  } finally {
    // Kembalikan ke pilihan bulan awal
    store.currentMonth = startMonth;
    store.currentYear = startYear;
    isGeneratingBulk.value = false;
    store.validateCurrentSchedule();
    
    showToast(`Sukses melakukan proyeksi roster untuk ${bulkMonthsCount.value} bulan!`, 'success');
  }
}

async function handleReset() {
  const confirmed = await showConfirm(
    'Reset Semua Data?',
    'Apakah Anda yakin ingin menyetel ulang semua data? Semua kustomisasi roster yang telah dibuat akan dihapus secara permanen.'
  );
  if (confirmed) {
    store.resetAllData();
    showToast('Semua data berhasil direset.', 'info');
  }
}

function generateSingleMonthCSV(key) {
  const sched = store.schedules[key]?.schedule;
  if (!sched) return '';
  
  const [year, month] = key.split('-').map(Number);
  const daysCount = new Date(year, month, 0).getDate();
  
  let csv = 'Nama Anggota,Role,';
  for (let i = 1; i <= daysCount; i++) {
    csv += `${i},`;
  }
  csv += '\n';
  
  csv += `${store.members.leader.name},Leader,`;
  for (let d = 0; d < daysCount; d++) {
    csv += `${sched[store.members.leader.id]?.[d] || 'NS'},`;
  }
  csv += '\n';
  
  store.members.seniors.forEach(senior => {
    csv += `${senior.name},Senior,`;
    for (let d = 0; d < daysCount; d++) {
      csv += `${sched[senior.id]?.[d] || '-'},`;
    }
    csv += '\n';
  });
  
  store.activeJuniors.forEach(junior => {
    csv += `${junior.name},Junior,`;
    for (let d = 0; d < daysCount; d++) {
      csv += `${sched[junior.id]?.[d] || '-'},`;
    }
    csv += '\n';
  });
  
  return csv;
}

function generateMultiMonthCSV(startKey, endKey) {
  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  
  const keysToExport = generatedMonths.value
    .map(m => m.key)
    .filter(k => k >= startKey && k <= endKey);
    
  let csvContent = '';
  keysToExport.forEach((key, idx) => {
    const [year, month] = key.split('-').map(Number);
    const monthName = monthNames[month - 1];
    
    if (idx > 0) {
      csvContent += '\n';
    }
    
    csvContent += `=== ROSTER ${monthName} ${year} ===\n`;
    csvContent += generateSingleMonthCSV(key);
  });
  
  return csvContent;
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleExportClick() {
  const months = generatedMonths.value;
  if (months.length === 0) {
    showToast('Belum ada roster yang diinisialisasi atau diproyeksikan.', 'warning');
    return;
  }
  
  if (months.length <= 1) {
    const singleKey = months[0].key;
    const [year, month] = singleKey.split('-').map(Number);
    const csvContent = generateSingleMonthCSV(singleKey);
    triggerDownload(csvContent, `Roster_CloudKilat_${year}_${month}.csv`);
    return;
  }
  
  exportStartKey.value = store.currentKey;
  if (!months.some(m => m.key === exportStartKey.value)) {
    exportStartKey.value = months[0].key;
  }
  
  exportEndKey.value = months[months.length - 1].key;
  if (exportEndKey.value < exportStartKey.value) {
    exportEndKey.value = exportStartKey.value;
  }
  
  exportMode.value = 'single';
  showExportModal.value = true;
}

function triggerCSVDownload() {
  if (exportMode.value === 'single') {
    const key = exportStartKey.value;
    const [year, month] = key.split('-').map(Number);
    const csvContent = generateSingleMonthCSV(key);
    triggerDownload(csvContent, `Roster_CloudKilat_${year}_${month}.csv`);
  } else {
    const start = exportStartKey.value;
    const end = exportEndKey.value;
    if (end < start) {
      showToast('Bulan selesai tidak boleh sebelum bulan mulai.', 'error');
      return;
    }
    const csvContent = generateMultiMonthCSV(start, end);
    const [sYear, sMonth] = start.split('-').map(Number);
    const [eYear, eMonth] = end.split('-').map(Number);
    triggerDownload(csvContent, `Roster_CloudKilat_${sYear}_${sMonth}_ke_${eYear}_${eMonth}.csv`);
  }
  showExportModal.value = false;
}
</script>

<style>
/* App Layout Specific (SharePoint Light Theme) */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  position: relative;
}

.app-watermark {
  position: fixed;
  bottom: -80px;
  right: -80px;
  width: 500px;
  height: 500px;
  opacity: 0.03; /* Sangat redup agar tidak mengganggu keterbacaan */
  pointer-events: none; /* Agar tidak memblokir klik mouse pada elemen di atasnya */
  z-index: 0;
  transform: rotate(-15deg);
  user-select: none;
}

.app-watermark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply; /* Menyamarkan background putih gambar ke warna dasar aplikasi */
}

.app-header {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 2rem;
  margin: 0;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  gap: 0.5rem;
}

@media (min-width: 1025px) {
  .app-header {
    position: sticky;
    top: 0;
    z-index: 500;
  }
}

@media (max-width: 1024px) {
  .app-header {
    padding: 1rem;
  }
  .header-row-1,
  .header-row-2 {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  .header-right-actions {
    justify-content: flex-start;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.logo-text h2 {
  font-size: 1.1rem;
  color: #201f1e;
  line-height: 1.1;
  font-weight: 700;
}

.logo-text span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Month Selector */
.month-selector-panel {
  display: flex;
  align-items: center;
  background: #f3f2f1;
  border: 1px solid var(--border-color);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
}

.selector-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.selector-btn:hover {
  background: #e1dfdd;
  color: var(--text-primary);
}

.current-month-display {
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  min-width: 180px;
}

.icon-calendar {
  color: var(--primary);
  width: 16px;
  height: 16px;
}

.icon-nav {
  width: 18px;
  height: 18px;
}

/* Action Buttons Header */
.action-buttons-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 640px) {
  .action-buttons-group {
    width: 100%;
    flex-wrap: wrap;
  }
}

.icon-btn-size {
  width: 14px;
  height: 14px;
}

/* Stats Cards */
.dashboard-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #d2d0ce;
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.purple { background-color: rgba(99, 102, 241, 0.1); color: var(--primary); }
.stat-icon-wrapper.cyan { background-color: rgba(6, 182, 212, 0.1); color: #038387; }
.stat-icon-wrapper.pink { background-color: rgba(236, 72, 153, 0.1); color: #5c2d91; }
.stat-icon-wrapper.green { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
.stat-icon-wrapper.red { background-color: rgba(239, 68, 68, 0.1); color: var(--error); }

.stat-icon {
  width: 18px;
  height: 18px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.error-border {
  border-color: #fbc4c4 !important;
  box-shadow: 0 0 8px rgba(168, 0, 0, 0.05);
}

.success-border {
  border-color: #c8e8c4 !important;
  box-shadow: 0 0 8px rgba(16, 124, 65, 0.05);
}

.text-red { color: var(--error) !important; }
.text-green { color: var(--success) !important; }

/* Roster Title Bar */
.section-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title-bar h3 {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #323130;
}

.icon-section {
  color: var(--primary);
  width: 18px;
  height: 18px;
}

.schedule-status-banner {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 2px;
  text-transform: uppercase;
}

.status-muted { background: #f3f2f1; border: 1px solid #d2d0ce; color: #605e5c; }
.status-success { background: #dff6dd; border: 1px solid #c8e8c4; color: #107c41; }
.status-warning { background: #fff4ce; border: 1px solid #fde7e9; color: #813e00; }
.status-error { background: #fde7e9; border: 1px solid #fbc4c4; color: #a80000; }

/* Dual Panel Layout */
.dual-panel-layout {
  display: flex;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dual-panel-layout {
    flex-direction: column;
  }
}

.panel-column {
  display: flex;
  flex-direction: column;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

/* Footer */
.app-footer {
  margin-top: auto;
  padding: 1.5rem;
  text-align: center;
  border-top: 1px solid var(--border-color);
  background: #ffffff;
}

/* Toast Notification */
.toast-notification {
  position: relative;
  padding: 0.75rem 1.25rem;
  border-radius: 2px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: var(--shadow-md);
  z-index: 9999;
}

.toast-success {
  background: var(--success);
}

.animate-spin-hover:hover {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
