<template>
  <div class="team-manager-container">
    <div class="tabs-header glass-panel">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'juniors' }"
        @click="activeTab = 'juniors'"
      >
        <Users class="icon-sm" /> Kelola Junior Support
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'seniors' }"
        @click="activeTab = 'seniors'"
      >
        <UserCheck class="icon-sm" /> Kelola Senior Support
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'patterns' }"
        @click="activeTab = 'patterns'"
      >
        <RotateCcw class="icon-sm" /> Pola & Posisi Junior (Bulan Ini)
      </button>
    </div>

    <!-- TAB 1: KELOLA JUNIOR -->
    <div v-if="activeTab === 'juniors'" class="tab-content-panel glass-panel animate-fade-in">
      <div class="panel-inner-header">
        <h4>Daftar Junior Support ({{ juniors.length }} total)</h4>
        <form @submit.prevent="handleAddJunior" class="add-junior-form">
          <input 
            type="text" 
            v-model="newJuniorName" 
            placeholder="Nama Junior baru..." 
            class="form-input"
            required
          />
          <button type="submit" class="btn btn-primary">
            <UserPlus class="icon-sm" /> Tambah
          </button>
        </form>
      </div>

      <div class="members-list-grid">
        <div 
          v-for="junior in juniors" 
          :key="junior.id" 
          class="member-card"
          :class="{ inactive: !junior.active }"
        >
          <div class="member-card-main flex-grow">
            <div class="member-card-avatar">
              {{ getInitials(junior.name) }}
            </div>
            <div class="member-card-details flex-grow">
              <div v-if="editingId === junior.id" class="edit-name-inline">
                <input 
                  type="text" 
                  v-model="editNameValue" 
                  class="form-input edit-inline-input" 
                  @keyup.enter="saveEdit(junior.id, 'junior')"
                  @keyup.esc="cancelEdit"
                  v-focus
                />
                <button class="inline-save-btn" @click="saveEdit(junior.id, 'junior')" title="Simpan">
                  <Check class="icon-inline-save" />
                </button>
                <button class="inline-cancel-btn" @click="cancelEdit" title="Batal">
                  <X class="icon-inline-cancel" />
                </button>
              </div>
              <div v-else class="member-card-name-row">
                <div class="member-card-name">{{ junior.name }}</div>
                <button class="btn-edit-inline" @click="startEdit(junior)" title="Edit Nama">
                  <Edit3 class="icon-inline-edit" />
                </button>
              </div>
              <div class="member-card-status">
                {{ junior.active ? 'Aktif (Masuk Roster)' : 'Non-Aktif (Libur Panjang)' }}
              </div>
            </div>
          </div>
          <div class="member-card-actions" v-if="editingId !== junior.id">
            <button 
              class="action-btn"
              :class="junior.active ? 'btn-deactivate' : 'btn-activate'"
              :title="junior.active ? 'Nonaktifkan dari Roster' : 'Aktifkan ke Roster'"
              @click="store.toggleJuniorActive(junior.id)"
            >
              <UserMinus v-if="junior.active" class="icon-xs" />
              <UserCheck v-else class="icon-xs" />
            </button>
            <button 
              class="action-btn btn-delete" 
              title="Hapus Anggota"
              @click="confirmDelete(junior)"
            >
              <Trash2 class="icon-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: KELOLA SENIOR & LEADER -->
    <div v-if="activeTab === 'seniors'" class="tab-content-panel glass-panel animate-fade-in">
      <div class="panel-inner-header">
        <h4>Leader &amp; Senior Support</h4>
        <p class="text-secondary text-sm">
          Kelola nama dan konfigurasi tim senior. Setiap Senior harus memiliki index awal Q1 yang unik (0, 1, atau 2) agar distribusi shift weekdays merata.
        </p>
      </div>

      <!-- LEADER SECTION -->
      <div class="leader-section-wrapper">
        <h5 class="sub-section-title">Leader Support</h5>
        <div class="senior-row-card leader-row-card">
          <div class="senior-avatar-badge leader-avatar-badge">LD</div>
          <div class="senior-info flex-grow">
            <div v-if="editingId === leader.id" class="edit-name-inline">
              <input 
                type="text" 
                v-model="editNameValue" 
                class="form-input edit-inline-input" 
                @keyup.enter="saveEdit(leader.id, 'leader')"
                @keyup.esc="cancelEdit"
                v-focus
              />
              <button class="inline-save-btn" @click="saveEdit(leader.id, 'leader')" title="Simpan">
                <Check class="icon-inline-save" />
              </button>
              <button class="inline-cancel-btn" @click="cancelEdit" title="Batal">
                <X class="icon-inline-cancel" />
              </button>
            </div>
            <div v-else class="member-card-name-row">
              <span class="senior-name">{{ leader.name }}</span>
              <button class="btn-edit-inline" @click="startEdit(leader)" title="Edit Nama">
                <Edit3 class="icon-inline-edit" />
              </button>
            </div>
            <span class="text-muted text-xs">Role: Leader Support (Selalu Non-Shift / NS)</span>
          </div>
        </div>
      </div>

      <!-- SENIORS SECTION -->
      <div class="seniors-section-wrapper">
        <h5 class="sub-section-title">Daftar Senior Support (Tepat 3 Anggota)</h5>
        <div class="seniors-list">
          <div 
            v-for="senior in seniors" 
            :key="senior.id" 
            class="senior-row-card"
          >
            <div class="senior-avatar-badge">SR</div>
            <div class="senior-info flex-grow">
              <div v-if="editingId === senior.id" class="edit-name-inline">
                <input 
                  type="text" 
                  v-model="editNameValue" 
                  class="form-input edit-inline-input" 
                  @keyup.enter="saveEdit(senior.id, 'senior')"
                  @keyup.esc="cancelEdit"
                  v-focus
                />
                <button class="inline-save-btn" @click="saveEdit(senior.id, 'senior')" title="Simpan">
                  <Check class="icon-inline-save" />
                </button>
                <button class="inline-cancel-btn" @click="cancelEdit" title="Batal">
                  <X class="icon-inline-cancel" />
                </button>
              </div>
              <div v-else class="member-card-name-row">
                <span class="senior-name">{{ senior.name }}</span>
                <button class="btn-edit-inline" @click="startEdit(senior)" title="Edit Nama">
                  <Edit3 class="icon-inline-edit" />
                </button>
              </div>
              <span class="text-muted text-xs">Role: Senior Support</span>
            </div>
            <div class="senior-q1-selector" v-if="editingId !== senior.id">
              <label class="text-xs text-secondary">Q1 Shift Index:</label>
              <select 
                :value="senior.q1ShiftIndex" 
                @change="updateSeniorIndex(senior.id, parseInt($event.target.value))"
                class="form-select"
              >
                <option :value="0">0 (Mulai Shift A)</option>
                <option :value="1">1 (Mulai Shift B)</option>
                <option :value="2">2 (Mulai Shift C)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: POLA & POSISI JUNIOR -->
    <div v-if="activeTab === 'patterns'" class="tab-content-panel glass-panel animate-fade-in">
      <div class="panel-inner-header">
        <h4>Konfigurasi Pola & Posisi Awal Bulan Ini</h4>
        <p class="text-secondary text-sm">
          Anda dapat menyesuaikan pola shift 7 hari dan posisi awal index (0-6) secara manual untuk setiap junior aktif. Shifts mereka akan langsung dibuat ulang berdasarkan konfigurasi ini.
        </p>
      </div>

      <div class="patterns-table-wrapper">
        <table class="patterns-table">
          <thead>
            <tr>
              <th class="text-left">Nama Junior</th>
              <th>Pola Shift (Pattern)</th>
              <th>Posisi Awal (startCyclePos)</th>
              <th>Review Pola (7 Hari)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="junior in activeJuniors" :key="junior.id">
              <td class="text-left font-semibold">{{ junior.name }}</td>
              <td>
                <select 
                  :value="getPattern(junior.id)" 
                  @change="updateJuniorPattern(junior.id, $event.target.value, getStartPos(junior.id))"
                  class="form-select select-table"
                >
                  <option value="">-- Pilih Pola --</option>
                  <option value="AAABC">AAABC (3A, 1B, 1C)</option>
                  <option value="AABBC">AABBC (2A, 2B, 1C)</option>
                  <option value="AABCC">AABCC (2A, 1B, 2C)</option>
                  <option value="ABBBC">ABBBC (1A, 3B, 1C)</option>
                  <option value="ABBCC">ABBCC (1A, 2B, 2C)</option>
                </select>
              </td>
              <td>
                <select 
                  :value="getStartPos(junior.id)" 
                  @change="updateJuniorPattern(junior.id, getPattern(junior.id), parseInt($event.target.value))"
                  class="form-select select-table"
                >
                  <option 
                    v-for="pos in [0,1,2,3,4,5,6]" 
                    :key="pos" 
                    :value="pos"
                  >
                    Index {{ pos }}
                  </option>
                </select>
              </td>
              <td>
                <div class="pattern-preview-flow" v-if="getPattern(junior.id)">
                  <span 
                    v-for="(s, sIdx) in getPatternPreview(junior.id)" 
                    :key="sIdx"
                    class="badge-shift-xs"
                    :class="s === 'L' ? 'bg-slate' : 'bg-primary'"
                  >
                    {{ s }}
                  </span>
                </div>
                <span class="text-muted text-xs" v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';
import { JUNIOR_PATTERNS } from '../utils/scheduleEngine';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  UserMinus, 
  UserCheck, 
  RotateCcw,
  Edit3,
  Check,
  X
} from 'lucide-vue-next';

const store = useScheduleStore();

const activeTab = ref('juniors');
const newJuniorName = ref('');

const juniors = computed(() => store.members.juniors);
const activeJuniors = computed(() => store.activeJuniors);
const seniors = computed(() => store.members.seniors);
const leader = computed(() => store.members.leader);

const editingId = ref(null);
const editNameValue = ref('');

// Auto focus directive helper
const vFocus = {
  mounted: (el) => el.focus()
};

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function handleAddJunior() {
  if (newJuniorName.value.trim()) {
    store.addJunior(newJuniorName.value);
    newJuniorName.value = '';
  }
}

function confirmDelete(junior) {
  if (confirm(`Apakah Anda yakin ingin menghapus "${junior.name}"?`)) {
    store.removeJunior(junior.id);
  }
}

function updateSeniorIndex(id, index) {
  store.updateSeniorQ1(id, index);
}

function getPattern(juniorId) {
  return store.currentMonthPatterns[juniorId] || '';
}

function getStartPos(juniorId) {
  return store.currentMonthStartPositions[juniorId] !== undefined
    ? store.currentMonthStartPositions[juniorId]
    : 0;
}

function updateJuniorPattern(juniorId, pattern, startPos) {
  if (!pattern) return;
  store.updateJuniorMetadata(juniorId, pattern, startPos);
}

function getPatternPreview(juniorId) {
  const pattern = getPattern(juniorId);
  const startPos = getStartPos(juniorId);
  if (!pattern || !JUNIOR_PATTERNS[pattern]) return [];
  
  const patternArray = JUNIOR_PATTERNS[pattern];
  const preview = [];
  for (let i = 0; i < 7; i++) {
    const idx = (startPos + i) % 7;
    preview.push(patternArray[idx]);
  }
  return preview;
}

function startEdit(member) {
  editingId.value = member.id;
  editNameValue.value = member.name;
}

function cancelEdit() {
  editingId.value = null;
  editNameValue.value = '';
}

function saveEdit(id, role) {
  if (editNameValue.value.trim()) {
    const success = store.updateMemberName(id, role, editNameValue.value);
    if (success) {
      editingId.value = null;
      editNameValue.value = '';
    }
  }
}
</script>

<style scoped>
.team-manager-container {
  margin-bottom: 2rem;
}

.tabs-header {
  display: flex;
  padding: 0.5rem;
  margin-bottom: 1rem;
  gap: 0.5rem;
  border-radius: var(--radius-md);
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px var(--primary-glow);
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.tab-content-panel {
  padding: 1.5rem;
}

.panel-inner-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.panel-inner-header h4 {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.add-junior-form {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.85rem;
  outline: none;
  min-width: 220px;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

/* Members Grid */
.members-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.member-card {
  background: #ffffff;
  border: 1px solid #e1dfdd;
  border-left: 4px solid var(--primary);
  border-radius: var(--radius-sm);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,0.05);
}

.member-card:hover {
  border-color: var(--border-color-hover);
  border-left-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.member-card.inactive {
  border-left-color: #a19f9d;
  background-color: #faf9f8;
  opacity: 0.8;
}

.member-card-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #deecf9;
  border: 1px solid #accdf7;
  color: #0078d4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  box-shadow: var(--shadow-sm);
}

.member-card.inactive .member-card-avatar {
  background-color: #f3f2f1;
  border-color: #d2d0ce;
  color: #a19f9d;
}

.member-card-details {
  display: flex;
  flex-direction: column;
}

.member-card-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.member-card-status {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.member-card-actions {
  display: flex;
  gap: 0.35rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.btn-activate:hover {
  border-color: var(--success);
  color: var(--success);
  background-color: rgba(16, 185, 129, 0.1);
}

.btn-deactivate:hover {
  border-color: var(--warning);
  color: var(--warning);
  background-color: rgba(245, 158, 11, 0.1);
}

.btn-delete:hover {
  border-color: var(--error);
  color: var(--error);
  background-color: rgba(239, 68, 68, 0.1);
}

.icon-xs {
  width: 14px;
  height: 14px;
}

/* Senior List */
.seniors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
}

.senior-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
  gap: 1rem;
}

.senior-avatar-badge {
  background-color: #deecf9;
  border: 1px solid #accdf7;
  color: #0078d4;
  font-family: var(--font-heading);
  font-weight: 700;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.senior-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.senior-name {
  font-weight: 600;
  color: var(--text-primary);
}

.senior-q1-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-select {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.75rem;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.8rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.form-select:focus {
  border-color: var(--primary);
}

/* Patterns Table */
.patterns-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.patterns-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.85rem;
}

.patterns-table th, .patterns-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.patterns-table th {
  background-color: #f3f2f1;
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--text-secondary);
}

.font-semibold {
  font-weight: 600;
}

.select-table {
  width: 100%;
  max-width: 200px;
}

.pattern-preview-flow {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.badge-shift-xs {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
}

.badge-shift-xs.bg-primary {
  background-color: rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
}

.badge-shift-xs.bg-slate {
  background-color: rgba(51, 65, 85, 0.3);
  border: 1px solid rgba(51, 65, 85, 0.5);
  color: #94a3b8;
}

/* Inline Edit Styling */
.member-card-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-edit-inline {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.btn-edit-inline:hover {
  color: var(--primary);
  background-color: var(--bg-surface-hover);
}

.icon-inline-edit {
  width: 13px;
  height: 13px;
}

.edit-name-inline {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  max-width: 280px;
}

.edit-inline-input {
  flex-grow: 1;
  padding: 0.25rem 0.5rem !important;
  font-size: 0.85rem !important;
  height: 28px;
  min-width: unset !important;
}

.inline-save-btn, .inline-cancel-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.inline-save-btn {
  color: var(--success);
  border-color: rgba(16, 124, 65, 0.3);
}

.inline-save-btn:hover {
  background-color: rgba(16, 124, 65, 0.1);
}

.inline-cancel-btn {
  color: var(--error);
  border-color: rgba(168, 0, 0, 0.3);
}

.inline-cancel-btn:hover {
  background-color: rgba(168, 0, 0, 0.1);
}

.icon-inline-save, .icon-inline-cancel {
  width: 14px;
  height: 14px;
}

.sub-section-title {
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.leader-section-wrapper {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.leader-row-card {
  border-left: 4px solid #722ed1 !important;
}

.leader-avatar-badge {
  background-color: #f9f0ff !important;
  border-color: #d3adf7 !important;
  color: #722ed1 !important;
}

.flex-grow {
  flex-grow: 1;
}
</style>
