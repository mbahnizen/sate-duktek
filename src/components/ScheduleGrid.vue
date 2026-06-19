<template>
  <div class="schedule-grid-container glass-panel">
    <div class="grid-header-actions">
      <div class="group-info">
        <span class="legend-item"><span class="badge-shift readonly-shift shift-A">A</span> Pagi</span>
        <span class="legend-item"><span class="badge-shift readonly-shift shift-B">B</span> Sore</span>
        <span class="legend-item"><span class="badge-shift readonly-shift shift-C">C</span> Malam</span>
        <span class="legend-item"><span class="badge-shift readonly-shift shift-L">L</span> Libur</span>
        <span class="legend-item"><span class="badge-shift readonly-shift shift-NS">NS</span> Non-Shift</span>
        <span class="legend-item"><span class="badge-shift readonly-shift shift-OC">OC</span> On-Call</span>
      </div>
      <div class="text-secondary text-sm">
        * Kolom abu-abu di awal adalah preview 2 hari dari bulan lalu (read-only).
      </div>
    </div>

    <div class="table-scroll-wrapper">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="sticky-col header-cell border-r">Nama</th>
            <!-- Preview 2 Hari Bulan Lalu -->
            <th 
              v-for="pDay in prevMonthInfo.days" 
              :key="'prev-' + pDay.dayNum" 
              class="day-header is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              <div class="day-num">{{ pDay.dayNum }}</div>
              <div class="day-name">{{ pDay.dayName }}</div>
            </th>
            
            <!-- Hari Bulan Berjalan -->
            <th 
              v-for="day in daysInMonth" 
              :key="day" 
              :id="'day-header-' + day"
              class="day-header"
              :class="{ 
                'is-weekend': isWeekend(day),
                'day-highlighted-pulse': store.highlightedDay === day
              }"
            >
              <div class="day-num">{{ day }}</div>
              <div class="day-name">{{ getDayName(day) }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- LEADER SECTION -->
          <tr class="role-divider-row">
            <td :colspan="daysInMonth + 3" class="role-divider-title">
              LEADER
            </td>
          </tr>
          <tr class="member-row">
            <td class="sticky-col member-info-cell border-r">
              <div class="member-name">{{ members.leader.name }}</div>
              <div class="member-role">Leader Support</div>
            </td>
            <!-- Preview 2 Hari Bulan Lalu -->
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'prev-leader-' + idx"
              class="shift-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              <span class="badge-shift readonly-shift shift-NS">
                {{ prevMonthInfo.shifts[members.leader.id]?.[idx] }}
              </span>
            </td>
            <!-- Hari Bulan Berjalan -->
            <td 
              v-for="day in daysInMonth" 
              :key="day" 
              class="shift-cell"
              :class="{ 
                'is-weekend': isWeekend(day),
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              <span class="badge-shift shift-NS">
                {{ getShift(members.leader.id, day - 1) }}
              </span>
            </td>
          </tr>

          <!-- SENIOR SECTION -->
          <tr class="role-divider-row">
            <td :colspan="daysInMonth + 3" class="role-divider-title">
              SENIOR SUPPORT
            </td>
          </tr>
          <tr 
            v-for="senior in members.seniors" 
            :key="senior.id" 
            class="member-row"
          >
            <td class="sticky-col member-info-cell border-r">
              <div class="member-name">{{ senior.name }}</div>
              <div class="member-role">Senior (Q1: {{ getQ1ShiftName(senior.q1ShiftIndex) }})</div>
            </td>
            <!-- Preview 2 Hari Bulan Lalu -->
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'prev-senior-' + senior.id + '-' + idx"
              class="shift-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              <span 
                class="badge-shift readonly-shift"
                :class="getShiftClass(prevMonthInfo.shifts[senior.id]?.[idx])"
              >
                {{ prevMonthInfo.shifts[senior.id]?.[idx] }}
              </span>
            </td>
            <!-- Hari Bulan Berjalan -->
            <td 
              v-for="day in daysInMonth" 
              :key="day" 
              class="shift-cell"
              :class="{ 
                'is-weekend': isWeekend(day),
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              <span 
                class="badge-shift"
                :class="getShiftClass(getShift(senior.id, day - 1))"
              >
                {{ getShift(senior.id, day - 1) }}
              </span>
            </td>
          </tr>

          <!-- JUNIOR SECTION -->
          <tr class="role-divider-row">
            <td :colspan="daysInMonth + 3" class="role-divider-title">
              JUNIOR SUPPORT
            </td>
          </tr>
          <tr 
            v-for="junior in activeJuniors" 
            :key="junior.id" 
            class="member-row"
          >
            <td class="sticky-col member-info-cell border-r">
              <div class="member-name">{{ junior.name }}</div>
              <div class="member-meta">
                <span class="meta-tag" v-if="getJuniorPattern(junior.id)">
                  {{ getJuniorPattern(junior.id) }} (S:{{ getJuniorStartPos(junior.id) }})
                </span>
                <span class="meta-tag no-pattern" v-else>
                  Manual
                </span>
              </div>
            </td>
            <!-- Preview 2 Hari Bulan Lalu -->
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'prev-junior-' + junior.id + '-' + idx"
              class="shift-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              <span 
                class="badge-shift readonly-shift"
                :class="getShiftClass(prevMonthInfo.shifts[junior.id]?.[idx])"
              >
                {{ prevMonthInfo.shifts[junior.id]?.[idx] }}
              </span>
            </td>
            <!-- Hari Bulan Berjalan -->
            <td 
              v-for="day in daysInMonth" 
              :key="day" 
              :id="'cell-' + junior.id + '-' + (day - 1)"
              class="shift-cell editable"
              :class="{ 
                'is-weekend': isWeekend(day),
                'cell-highlighted-pulse': store.highlightedDay === day && store.highlightedJuniorId === junior.id,
                'column-highlighted-pulse': store.highlightedDay === day && store.highlightedJuniorId !== junior.id
              }"
              @click.stop="openSelector(junior.id, day - 1, $event)"
            >
              <span 
                class="badge-shift"
                :class="getShiftClass(getShift(junior.id, day - 1))"
              >
                {{ getShift(junior.id, day - 1) }}
              </span>
            </td>
          </tr>

          <!-- TOTALS SECTION -->
          <tr class="totals-divider-row">
            <td :colspan="daysInMonth + 3" class="totals-divider-title">
              TOTAL DAILY COVERAGE (SENIOR + JUNIOR)
            </td>
          </tr>
          <tr class="total-row">
            <td class="sticky-col total-header border-r">Total Shift A CK</td>
            <!-- Prev Month Totals -->
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'total-A-prev-' + idx"
              class="total-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              {{ getDailyTotal(idx, true).A }}
            </td>
            <!-- Current Month Totals -->
            <td 
              v-for="day in daysInMonth" 
              :key="'total-A-' + day"
              class="total-cell"
              :class="{ 
                'is-weekend': isWeekend(day), 
                'val-one': getDailyTotal(day - 1, false).A === 1,
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              {{ getDailyTotal(day - 1, false).A }}
            </td>
          </tr>
          
          <tr class="total-row">
            <td class="sticky-col total-header border-r">Total Shift B CK</td>
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'total-B-prev-' + idx"
              class="total-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              {{ getDailyTotal(idx, true).B }}
            </td>
            <td 
              v-for="day in daysInMonth" 
              :key="'total-B-' + day"
              class="total-cell"
              :class="{ 
                'is-weekend': isWeekend(day), 
                'val-one': getDailyTotal(day - 1, false).B === 1,
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              {{ getDailyTotal(day - 1, false).B }}
            </td>
          </tr>

          <tr class="total-row">
            <td class="sticky-col total-header border-r">Total Shift C CK</td>
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'total-C-prev-' + idx"
              class="total-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              {{ getDailyTotal(idx, true).C }}
            </td>
            <td 
              v-for="day in daysInMonth" 
              :key="'total-C-' + day"
              class="total-cell"
              :class="{ 
                'is-weekend': isWeekend(day), 
                'val-one': getDailyTotal(day - 1, false).C === 1,
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              {{ getDailyTotal(day - 1, false).C }}
            </td>
          </tr>

          <tr class="total-row">
            <td class="sticky-col total-header border-r">Total OC CK</td>
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'total-OC-prev-' + idx"
              class="total-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              {{ getDailyTotal(idx, true).OC }}
            </td>
            <td 
              v-for="day in daysInMonth" 
              :key="'total-OC-' + day"
              class="total-cell"
              :class="{ 
                'is-weekend': isWeekend(day), 
                'val-one': getDailyTotal(day - 1, false).OC === 1, 
                'oc-zero': getDailyTotal(day - 1, false).OC === 0,
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              {{ getDailyTotal(day - 1, false).OC }}
            </td>
          </tr>

          <tr class="total-row">
            <td class="sticky-col total-header border-r">Total L CK</td>
            <td 
              v-for="(pDay, idx) in prevMonthInfo.days" 
              :key="'total-L-prev-' + idx"
              class="total-cell is-prev-month"
              :class="{ 'is-weekend-prev': pDay.isWeekend }"
            >
              {{ getDailyTotal(idx, true).L }}
            </td>
            <td 
              v-for="day in daysInMonth" 
              :key="'total-L-' + day"
              class="total-cell"
              :class="{ 
                'is-weekend': isWeekend(day), 
                'val-one': getDailyTotal(day - 1, false).L === 1,
                'column-highlighted-pulse': store.highlightedDay === day
              }"
            >
              {{ getDailyTotal(day - 1, false).L }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- CUSTOM FLOATING DROPDOWN SELECTOR -->
      <div 
        v-if="selector.visible" 
        class="shift-dropdown-selector glass-panel animate-fade-in"
        :style="selectorStyle"
        v-click-outside="closeSelector"
      >
        <div class="selector-header">Edit Shift</div>
        <div class="selector-options">
          <button 
            v-for="shiftOpt in ['A', 'B', 'C', 'L']" 
            :key="shiftOpt" 
            class="badge-shift selector-option-btn"
            :class="getShiftClass(shiftOpt)"
            @click="selectShift(shiftOpt)"
          >
            {{ shiftOpt }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';

const store = useScheduleStore();

const members = computed(() => store.members);
const activeJuniors = computed(() => store.activeJuniors);
const daysInMonth = computed(() => store.daysInCurrentMonth);
const prevMonthInfo = computed(() => store.prevMonthLastDays);

// Selector overlay state
const selector = reactive({
  visible: false,
  memberId: '',
  dayIndex: -1,
  x: 0,
  y: 0
});

const selectorStyle = computed(() => ({
  top: `${selector.y}px`,
  left: `${selector.x}px`
}));

function isWeekend(day) {
  const date = new Date(store.currentYear, store.currentMonth, day);
  const dow = date.getDay();
  return dow === 0 || dow === 6; // 0 = Sun, 6 = Sat
}

function getDayName(day) {
  const date = new Date(store.currentYear, store.currentMonth, day);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return dayNames[date.getDay()];
}

function getQ1ShiftName(idx) {
  return ['A', 'B', 'C'][idx] || '';
}

function getShift(memberId, dayIdx) {
  const sched = store.currentMonthSchedule;
  if (!sched || !sched[memberId]) return '-';
  return sched[memberId][dayIdx] || 'L';
}

function getJuniorPattern(juniorId) {
  return store.currentMonthPatterns[juniorId] || '';
}

function getJuniorStartPos(juniorId) {
  return store.currentMonthStartPositions[juniorId] !== undefined 
    ? store.currentMonthStartPositions[juniorId] 
    : '';
}

function getShiftClass(shift) {
  if (!shift || shift === '-') return 'shift-L';
  return `shift-${shift}`;
}

function getDailyTotal(dayIdx, isPrev) {
  let countA = 0;
  let countB = 0;
  let countC = 0;
  let countOC = 0;
  let countL = 0;
  
  const sched = store.currentMonthSchedule;
  
  // Count Seniors
  store.members.seniors.forEach(senior => {
    let shift = '-';
    if (isPrev) {
      shift = store.prevMonthLastDays.shifts[senior.id]?.[dayIdx] || '-';
    } else {
      shift = sched?.[senior.id]?.[dayIdx] || '-';
    }
    
    if (shift === 'A') countA++;
    else if (shift === 'B') countB++;
    else if (shift === 'C') countC++;
    else if (shift === 'OC') countOC++;
    else if (shift === 'L') countL++;
  });
  
  // Count active Juniors
  store.activeJuniors.forEach(junior => {
    let shift = '-';
    if (isPrev) {
      shift = store.prevMonthLastDays.shifts[junior.id]?.[dayIdx] || '-';
    } else {
      shift = sched?.[junior.id]?.[dayIdx] || '-';
    }
    
    if (shift === 'A') countA++;
    else if (shift === 'B') countB++;
    else if (shift === 'C') countC++;
    else if (shift === 'OC') countOC++;
    else if (shift === 'L') countL++;
  });
  
  return { A: countA, B: countB, C: countC, OC: countOC, L: countL };
}

function openSelector(memberId, dayIdx, event) {
  if (!store.currentMonthSchedule) return;

  const cellElement = event.currentTarget;
  const container = cellElement.closest('.table-scroll-wrapper');
  if (!container) return;

  if (selector.visible && selector.memberId === memberId && selector.dayIndex === dayIdx) {
    closeSelector();
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const cellRect = cellElement.getBoundingClientRect();
  
  selector.memberId = memberId;
  selector.dayIndex = dayIdx;
  
  // Center the popover below the cell
  const popoverWidth = 125; 
  const cellCenter = cellRect.left - containerRect.left + container.scrollLeft + (cellRect.width / 2);
  
  selector.x = Math.max(10, cellCenter - (popoverWidth / 2));
  selector.y = cellRect.bottom - containerRect.top + container.scrollTop + 4;
  selector.visible = true;
}

function closeSelector() {
  selector.visible = false;
}

function selectShift(shift) {
  if (selector.memberId && selector.dayIndex !== -1) {
    store.updateCellShift(selector.memberId, selector.dayIndex, shift);
  }
  closeSelector();
}

// Click outside directive helper
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  }
};
</script>

<style scoped>
.schedule-grid-container {
  padding: 1rem;
  overflow: visible; /* changed to visible to allow popover without clipping */
  margin-bottom: 1.5rem;
  background-color: #ffffff;
  border: 1px solid #d2d0ce;
  position: relative; /* added relative context */
}

.grid-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.group-info {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}



.table-scroll-wrapper {
  overflow-x: auto;
  border: 1px solid #d2d0ce;
  position: relative; /* added relative context for popover */
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.75rem;
  background-color: #ffffff;
  table-layout: fixed;
}

/* Sticky column styling (SharePoint theme) */
.sticky-col {
  position: sticky;
  left: 0;
  background-color: #f3f2f1;
  z-index: 10;
  width: 120px;
  min-width: 120px;
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-right: 2px solid #a19f9d !important;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
}

th {
  background-color: #f3f2f1;
  font-family: var(--font-heading);
  font-weight: 600;
  padding: 0.4rem;
  border: 1px solid #d2d0ce;
  color: #323130;
  vertical-align: middle;
}

.day-header {
  padding: 0.2rem 0.05rem;
}

.day-num {
  font-size: 0.85rem;
  font-weight: 700;
}

.day-name {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

/* Saturday & Sunday red highlights in header */
.day-header.is-weekend {
  background-color: #ef4444;
  color: #ffffff !important;
  border-color: #b91c1c;
}
.day-header.is-weekend .day-num {
  color: #ffffff;
}
.day-header.is-weekend .day-name {
  color: rgba(255, 255, 255, 0.8);
}

/* Preview Month styling */
.is-prev-month {
  background-color: #eaeaea !important;
  color: #797775 !important;
  border-color: #d2d0ce;
  opacity: 0.9;
}

.day-header.is-prev-month.is-weekend-prev {
  background-color: #f3d6d6 !important;
  color: #a80000 !important;
}

.shift-cell.is-prev-month {
  background-color: #f8f8f8;
  border-right: 1px solid #e1dfdd;
}

.readonly-shift {
  opacity: 0.75;
  cursor: not-allowed !important;
  pointer-events: none;
}

.role-divider-row {
  background-color: #f3f2f1;
}

.role-divider-title {
  text-align: left;
  padding: 0.35rem 0.75rem;
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--primary);
  border: 1px solid #d2d0ce;
  background-color: #deecf9;
}

.member-row {
  border-bottom: 1px solid #e1dfdd;
}

.member-row:hover {
  background-color: #f3f2f1;
}

.member-row:hover .sticky-col {
  background-color: #eaeaea;
}

.member-info-cell {
  background-color: #f3f2f1;
}

.member-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.75rem;
  white-space: normal;
  line-height: 1.15;
  word-break: break-word;
}

.member-role {
  font-size: 0.6rem;
  color: var(--text-secondary);
  line-height: 1.1;
  margin-top: 0.1rem;
}

.member-meta {
  margin-top: 0.15rem;
}

.meta-tag {
  display: inline-block;
  background-color: #ffffff;
  border: 1px solid #d2d0ce;
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.meta-tag.no-pattern {
  color: var(--text-muted);
  border-style: dashed;
}

.shift-cell {
  padding: 0.15rem 0.05rem;
  border: 1px solid #d2d0ce;
  vertical-align: middle;
}

.shift-cell.is-weekend {
  background-color: #ffeef0;
}

.shift-cell.editable {
  cursor: pointer;
}

.shift-cell.editable:hover {
  background-color: #eaeaea;
}

/* FLOATING DROPDOWN SELECTOR */
.shift-dropdown-selector {
  position: absolute;
  z-index: 100;
  padding: 0.4rem;
  background-color: #ffffff;
  border: 1px solid #a19f9d;
  box-shadow: var(--shadow-md);
  border-radius: 3px;
  width: 125px;
}

.selector-header {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.3rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid #e1dfdd;
  text-align: center;
}

.selector-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}

.selector-option-btn {
  width: 100%;
  height: 24px;
  font-size: 0.7rem;
}

/* Totals Rows Styling */
.totals-divider-title {
  text-align: left;
  padding: 0.35rem 0.75rem;
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  color: #323130;
  background-color: #f3f2f1;
  border: 1px solid #d2d0ce;
}

.total-row {
  background-color: #fdf3f3; /* Light pink background */
  font-weight: 700;
}

.total-header {
  background-color: #e1dfdd;
  color: #323130;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.total-cell {
  padding: 0.4rem 0.25rem;
  border: 1px solid #d2d0ce;
  font-size: 0.85rem;
  vertical-align: middle;
}

.total-cell.val-one {
  background-color: #fff4ce; /* Yellow highlight for low staff */
  color: #813e00;
}

.total-cell.oc-zero {
  background-color: #fde7e9; /* Pink highlight for zero on call */
  color: #a80000;
}

/* Validation Highlights & Animations */
@keyframes cellPulse {
  0% {
    box-shadow: inset 0 0 0 2px #0078d4, 0 0 8px rgba(0, 120, 212, 0.4);
  }
  50% {
    box-shadow: inset 0 0 0 2px #0078d4, 0 0 16px rgba(0, 120, 212, 0.8);
    background-color: rgba(0, 120, 212, 0.15) !important;
  }
  100% {
    box-shadow: inset 0 0 0 2px #0078d4, 0 0 8px rgba(0, 120, 212, 0.4);
  }
}

.cell-highlighted-pulse {
  animation: cellPulse 1.5s infinite;
  z-index: 10;
  position: relative;
  outline: 2px solid #0078d4 !important;
  outline-offset: -2px;
}

.day-highlighted-pulse {
  outline: 3px solid #0078d4 !important;
  z-index: 15;
  position: relative;
  background-color: #c7e0f4 !important;
  color: #0078d4 !important;
}

.day-highlighted-pulse .day-name {
  color: #0078d4 !important;
}

.column-highlighted-pulse {
  background-color: rgba(0, 120, 212, 0.05) !important;
}
</style>
