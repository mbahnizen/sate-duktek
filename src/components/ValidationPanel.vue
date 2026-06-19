<template>
  <div class="validation-panel glass-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <ShieldAlert class="icon-primary" />
        Panel Verifikasi & Aturan
        <button class="help-btn-inline" @click="showHelpModal = true" title="Penjelasan Aturan & Verifikasi">
          <HelpCircle class="icon-help-inline" />
        </button>
      </h3>
      <div v-if="errors.length > 0" class="error-badge">
        {{ errors.length }} Pelanggaran
      </div>
      <div v-else class="success-badge">
        <CheckCircle class="icon-success-sm" />
        Sesuai Aturan
      </div>
    </div>

    <!-- SUCCESS STATE -->
    <div v-if="errors.length === 0" class="validation-success-state">
      <div class="success-glow-card">
        <CheckCircle class="success-icon-giant" />
        <h4>Roster Sempurna!</h4>
        <p class="text-secondary text-sm">
          Semua aturan ketat Junior, rotasi Senior, dan batasan coverage harian terpenuhi 100%. Roster siap digunakan.
        </p>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else class="validation-error-state">
      <!-- Error Filters -->
      <div class="filter-tabs">
        <button 
          class="filter-tab-btn" 
          :class="{ active: activeFilter === 'all' }" 
          @click="activeFilter = 'all'"
        >
          Semua ({{ errors.length }})
        </button>
        <button 
          class="filter-tab-btn" 
          :class="{ active: activeFilter === 'junior' }" 
          @click="activeFilter = 'junior'"
        >
          Aturan Junior ({{ countByType('junior') }})
        </button>
        <button 
          class="filter-tab-btn" 
          :class="{ active: activeFilter === 'daily' }" 
          @click="activeFilter = 'daily'"
        >
          Coverage Harian ({{ countByType('daily') }})
        </button>
        <button 
          class="filter-tab-btn" 
          :class="{ active: activeFilter === 'senior' }" 
          @click="activeFilter = 'senior'"
        >
          Roster Senior ({{ countByType('senior') }})
        </button>
      </div>

      <!-- Error List -->
      <div class="errors-list">
        <div 
          v-for="(error, index) in filteredErrors" 
          :key="index" 
          class="error-item-card"
          :class="[error.type, { active: isErrorActive(error), clickable: error.day }]"
          @click="handleCardClick(error)"
          :title="error.day ? 'Klik untuk sorot di jadwal' : ''"
        >
          <div class="error-item-icon-wrapper">
            <AlertCircle v-if="error.type === 'junior'" class="icon-error" />
            <AlertTriangle v-else-if="error.type === 'daily'" class="icon-warning" />
            <XCircle v-else class="icon-danger" />
          </div>
          <div class="error-item-content">
            <div class="error-item-msg">{{ error.message }}</div>
            <div class="error-item-meta">
              <span class="category-tag">{{ getCategoryLabel(error.type) }}</span>
              <span v-if="error.day" class="day-tag">Tanggal {{ error.day }}</span>
              <span v-if="error.day" class="click-hint-tag"><MapPin class="icon-inline" /> Klik untuk sorot</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HELP MODAL -->
    <Teleport to="body">
      <div v-if="showHelpModal" class="modal-overlay" @click.self="showHelpModal = false">
        <div class="modal-content help-modal-content">
          <div class="modal-header">
            <HelpCircle class="modal-header-icon" />
            <h3>Aturan & Verifikasi Roster</h3>
          </div>
          <div class="modal-body help-modal-body">
            <div class="rules-section">
              <h5><Shield class="icon-section-help" /> Aturan Ketat Junior Support</h5>
              <ul>
                <li><strong>Maksimal Kerja Berturut-turut:</strong> Maksimal 5 hari kerja berturut-turut dalam satu siklus kerja.</li>
                <li><strong>Minimal Libur Berturut-turut:</strong> Minimal 2 hari libur berturut-turut setelah masa kerja selesai (pola 5 hari kerja + 2 hari libur).</li>
                <li><strong>Transisi Shift Aman:</strong> Tidak diperbolehkan transisi mundur yang membahayakan kesehatan (B ke A, C ke A, C ke B dalam 24 jam).</li>
                <li><strong>Kepatuhan Pola:</strong> Roster junior harus mematuhi salah satu pola rotasi resmi (seperti <code>AABBC</code> atau <code>AAABC</code>).</li>
              </ul>
            </div>
            <div class="rules-section" style="margin-top: 1.25rem;">
              <h5><BarChart3 class="icon-section-help" /> Kapasitas & Coverage Harian</h5>
              <ul>
                <li><strong>Prioritas Urutan Shift:</strong> Jumlah personel harian harus memenuhi urutan <code>Shift A &ge; Shift B &ge; Shift C</code> dengan minimal <code>Shift A &ge; 2</code>.</li>
                <li><strong>Target Hari Kerja:</strong> Distribusi ideal gabungan dukungan di hari kerja adalah <code>A=4, B=3, C=2</code>.</li>
                <li><strong>Target Akhir Pekan:</strong> Beban akhir pekan harus seimbang dengan membatasi maksimal 2 Junior pada Shift A (total Shift A akhir pekan &le; 3).</li>
              </ul>
            </div>
            <div class="rules-section" style="margin-top: 1.25rem;">
              <h5><Briefcase class="icon-section-help" /> Roster Senior Support</h5>
              <ul>
                <li><strong>Rotasi Kuartalan:</strong> Mengikuti shift Q1 yang berputar mingguan secara otomatis.</li>
                <li><strong>Tugas Akhir Pekan:</strong> Senior dijadwalkan secara bergiliran untuk mengawal operasional di hari Sabtu dan Minggu.</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="showHelpModal = false">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  XCircle,
  HelpCircle,
  MapPin,
  Shield,
  BarChart3,
  Briefcase
} from 'lucide-vue-next';

const store = useScheduleStore();
const errors = computed(() => store.validationErrors);

const activeFilter = ref('all');
const showHelpModal = ref(false);

const filteredErrors = computed(() => {
  if (activeFilter.value === 'all') return errors.value;
  return errors.value.filter(e => e.type === activeFilter.value);
});

function countByType(type) {
  return errors.value.filter(e => e.type === type).length;
}

function getCategoryLabel(type) {
  if (type === 'junior') return 'Aturan Ketat Junior';
  if (type === 'daily') return 'Kapasitas / Coverage';
  if (type === 'senior') return 'Rotasi Senior';
  return 'Lainnya';
}

function handleCardClick(error) {
  if (!error.day) return;
  
  store.setHighlight(error.day, error.juniorId);
  
  // Wait for DOM update
  setTimeout(() => {
    let targetId = '';
    if (error.juniorId) {
      targetId = `cell-${error.juniorId}-${error.day - 1}`;
    } else {
      targetId = `day-header-${error.day}`;
    }
    
    const el = document.getElementById(targetId);
    if (el) {
      // 1. Horizontal scroll within the table wrapper
      const scrollWrapper = el.closest('.table-scroll-wrapper');
      if (scrollWrapper) {
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        const cellRect = el.getBoundingClientRect();
        const cellLeftInWrapper = cellRect.left - wrapperRect.left + scrollWrapper.scrollLeft;
        const targetLeft = cellLeftInWrapper - (wrapperRect.width / 2) + (cellRect.width / 2);
        
        scrollWrapper.scrollTo({
          left: targetLeft,
          behavior: 'smooth'
        });
      }
      
      // 2. Vertical scroll of the main window (accounting for sticky header)
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementY = rect.top + scrollTop;
      
      // Position the element closer to the vertical center of the viewport (e.g. 45% height)
      // to ensure it's well below the sticky header and its context is visible.
      const offset = Math.max(280, window.innerHeight * 0.45);
      const targetTop = elementY - offset;
      
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    }
  }, 50);
}

function isErrorActive(error) {
  return store.highlightedDay === error.day && store.highlightedJuniorId === error.juniorId;
}
</script>

<style scoped>
.validation-panel {
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.icon-primary {
  color: var(--primary);
}

.error-badge {
  background-color: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--error);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.success-badge {
  background-color: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.icon-success-sm {
  width: 14px;
  height: 14px;
  color: var(--success);
}

/* SUCCESS STATE */
.validation-success-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem 0;
}

.success-glow-card {
  text-align: center;
  max-width: 450px;
  background: rgba(16, 185, 129, 0.03);
  border: 1px solid rgba(16, 185, 129, 0.1);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.05);
}

.success-icon-giant {
  width: 48px;
  height: 48px;
  color: var(--success);
  margin-bottom: 1rem;
}

.success-glow-card h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

/* ERROR STATE */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-tab-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--border-color-hover);
}

.filter-tab-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  box-shadow: 0 2px 8px var(--primary-glow);
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.error-item-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.01);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.error-item-card.clickable {
  cursor: pointer;
}

.error-item-card.clickable:hover {
  transform: translateX(4px);
  border-color: var(--border-color-hover);
  background: rgba(255, 255, 255, 0.03);
}

.error-item-card.active {
  border-color: var(--primary) !important;
  box-shadow: 0 0 10px rgba(0, 120, 212, 0.15);
  background-color: var(--primary-glow) !important;
  transform: translateX(6px);
}

.click-hint-tag {
  font-size: 0.65rem;
  color: var(--primary);
  font-weight: 600;
  margin-left: auto;
}

.error-item-card.junior {
  border-left: 3px solid var(--error);
  background: rgba(239, 68, 68, 0.02);
}

.error-item-card.daily {
  border-left: 3px solid var(--warning);
  background: rgba(245, 158, 11, 0.02);
}

.error-item-card.senior {
  border-left: 3px solid #f43f5e;
  background: rgba(244, 63, 94, 0.02);
}

.error-item-icon-wrapper {
  display: flex;
  align-items: flex-start;
  padding-top: 0.1rem;
}

.icon-error {
  color: var(--error);
  width: 18px;
  height: 18px;
}

.icon-warning {
  color: var(--warning);
  width: 18px;
  height: 18px;
}

.icon-danger {
  color: #f43f5e;
  width: 18px;
  height: 18px;
}

.error-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-item-msg {
  font-size: 0.825rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.error-item-meta {
  display: flex;
  gap: 0.5rem;
}

.category-tag {
  font-size: 0.65rem;
  color: var(--text-muted);
  background-color: rgba(255,255,255,0.04);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
}

.day-tag {
  font-size: 0.65rem;
  color: var(--primary);
  font-weight: 600;
}

.help-btn-inline {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border-radius: 50%;
  transition: all 0.15s ease;
  margin-left: 0.25rem;
}

.help-btn-inline:hover {
  background-color: var(--bg-surface-hover);
  color: var(--primary);
}

.icon-help-inline {
  width: 16px;
  height: 16px;
}

.icon-inline {
  width: 12px;
  height: 12px;
  display: inline-block;
  vertical-align: middle;
  margin-top: -2px;
  margin-right: 2px;
}

.icon-section-help {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
  margin-top: -2px;
  margin-right: 4px;
  color: var(--primary);
}
</style>
