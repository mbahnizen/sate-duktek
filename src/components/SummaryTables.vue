<template>
  <div class="summary-section-layout">
    <!-- LEFT TABLE: SUMMARY COUNTS -->
    <div class="summary-table-panel glass-panel">
      <div class="panel-header-clean">
        <h4>Total Shift, Hari Kerja dan Libur</h4>
      </div>
      <div class="summary-table-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th rowspan="2" class="text-left font-bold border-r">Nama</th>
              <th colspan="7" class="border-b">Total Hari</th>
            </tr>
            <tr>
              <th class="col-shift">A</th>
              <th class="col-shift">B</th>
              <th class="col-shift">C</th>
              <th class="col-shift">NS</th>
              <th class="col-shift">OC</th>
              <th class="col-shift">L</th>
              <th class="col-shift highlight-col">M</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="stat in memberSummaryStats" 
              :key="stat.id"
              :class="{ 'row-leader': stat.role === 'leader', 'row-senior': stat.role === 'senior' }"
            >
              <td class="text-left font-semibold border-r">{{ stat.name }}</td>
              <td>{{ stat.A }}</td>
              <td>{{ stat.B }}</td>
              <td>{{ stat.C }}</td>
              <td>{{ stat.NS }}</td>
              <td>{{ stat.OC }}</td>
              <td>{{ stat.L }}</td>
              <td 
                class="highlight-val"
                :class="{ 
                  'val-below-avg': stat.isBelowAvg, 
                  'val-far-above-avg': stat.isFarAboveAvg 
                }"
              >
                {{ stat.M }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RIGHT CARD: SHIFT HOURS & EXPLANATIONS -->
    <div class="reference-panel">
      <div class="reference-card glass-panel">
        <div class="panel-header-clean">
          <h4>Waktu Shift</h4>
        </div>
        <table class="ref-table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>Masuk</th>
              <th>Selesai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">A</td>
              <td>07.45</td>
              <td>16.45</td>
            </tr>
            <tr>
              <td class="font-bold">B</td>
              <td>15.45</td>
              <td>00.45</td>
            </tr>
            <tr>
              <td class="font-bold">C</td>
              <td>23.45</td>
              <td>08.45</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="reference-card glass-panel">
        <div class="panel-header-clean">
          <h4>Keterangan</h4>
        </div>
        <ul class="keterangan-list">
          <li><span class="abbr-badge shift-A">A</span> <span class="abbr-desc">Shift Pagi</span></li>
          <li><span class="abbr-badge shift-B">B</span> <span class="abbr-desc">Shift Sore</span></li>
          <li><span class="abbr-badge shift-C">C</span> <span class="abbr-desc">Shift Malam</span></li>
          <li><span class="abbr-badge shift-NS">NS</span> <span class="abbr-desc">Non Shift</span></li>
          <li><span class="abbr-badge shift-OC">OC</span> <span class="abbr-desc">On Call</span></li>
          <li><span class="abbr-badge shift-L">L</span> <span class="abbr-desc">Libur</span></li>
          <li><span class="abbr-badge shift-M">M</span> <span class="abbr-desc font-bold">Hari Masuk/Kerja</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useScheduleStore } from '../stores/scheduleStore';

const store = useScheduleStore();

const juniorStatsHelper = computed(() => {
  const sched = store.currentMonthSchedule;
  if (!sched) return { avg: 0, max: 0 };
  
  const activeJuniors = store.activeJuniors;
  if (activeJuniors.length === 0) return { avg: 0, max: 0 };
  
  const daysCount = store.daysInCurrentMonth;
  let totalM = 0;
  let maxM = 0;
  
  activeJuniors.forEach(junior => {
    const memberShifts = sched[junior.id] || [];
    let countM = 0;
    for (let d = 0; d < daysCount; d++) {
      const shift = memberShifts[d];
      if (shift === 'A' || shift === 'B' || shift === 'C' || shift === 'NS' || shift === 'OC') {
        countM++;
      }
    }
    totalM += countM;
    if (countM > maxM) {
      maxM = countM;
    }
  });
  
  return {
    avg: totalM / activeJuniors.length,
    max: maxM
  };
});

const memberSummaryStats = computed(() => {
  const stats = [];
  const sched = store.currentMonthSchedule;
  if (!sched) return [];
  
  const allMembers = [
    store.members.leader,
    ...store.members.seniors,
    ...store.members.juniors
  ];
  
  const daysCount = store.daysInCurrentMonth;
  const activeJuniorIds = new Set(store.activeJuniors.map(j => j.id));
  
  allMembers.forEach(member => {
    // Tampilkan hanya junior aktif
    if (member.role === 'junior' && !activeJuniorIds.has(member.id)) {
      return;
    }
    
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countNS = 0;
    let countOC = 0;
    let countL = 0;
    
    const memberShifts = sched[member.id] || [];
    for (let d = 0; d < daysCount; d++) {
      const shift = memberShifts[d];
      if (shift === 'A') countA++;
      else if (shift === 'B') countB++;
      else if (shift === 'C') countC++;
      else if (shift === 'NS') countNS++;
      else if (shift === 'OC') countOC++;
      else countL++;
    }
    
    const countM = countA + countB + countC + countNS + countOC;
    const isBelowAvg = member.role === 'junior' && (juniorStatsHelper.value.max - countM) >= 3;
    const isFarAboveAvg = member.role === 'junior' && countM >= juniorStatsHelper.value.avg + 3;
    
    stats.push({
      id: member.id,
      name: member.name,
      role: member.role,
      A: countA,
      B: countB,
      C: countC,
      NS: countNS,
      OC: countOC,
      L: countL,
      M: countM,
      isBelowAvg,
      isFarAboveAvg
    });
  });
  
  return stats;
});
</script>

<style scoped>
.summary-section-layout {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .summary-section-layout {
    flex-direction: column;
    align-items: stretch;
  }
}

.summary-table-panel {
  flex: 2;
  background-color: #ffffff;
  border: 1px solid #d2d0ce;
  padding: 1.25rem;
}

.panel-header-clean {
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #e1dfdd;
}

.panel-header-clean h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #323130;
}

.summary-table-wrapper {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: center;
  background-color: #ffffff;
}

.summary-table th, .summary-table td {
  border: 1px solid #d2d0ce;
  padding: 0.4rem 0.5rem;
}

.summary-table th {
  background-color: #f3f2f1;
  font-weight: 600;
  color: #323130;
}

.col-shift {
  width: 50px;
}

.border-r {
  border-right: 2px solid #a19f9d !important;
}

.border-b {
  border-bottom: 1px solid #d2d0ce;
}

.text-left {
  text-align: left;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.row-leader {
  background-color: rgba(99, 102, 241, 0.03);
}

.row-senior {
  background-color: rgba(6, 182, 212, 0.02);
}

.highlight-col {
  background-color: #e1dfdd !important;
  font-weight: 700;
}

.highlight-val {
  background-color: #f3f2f1;
  font-weight: 700;
  color: #0078d4;
}

.highlight-val.val-below-avg {
  background-color: #fff4ce !important;
  color: #813e00 !important;
}

.highlight-val.val-far-above-avg {
  background-color: #fde7e9 !important;
  color: #a80000 !important;
}

/* REFERENCE PANEL */
.reference-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.reference-card {
  background-color: #ffffff;
  border: 1px solid #d2d0ce;
  padding: 1.25rem;
}

.ref-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.825rem;
  text-align: center;
}

.ref-table th, .ref-table td {
  border: 1px solid #d2d0ce;
  padding: 0.35rem;
}

.ref-table th {
  background-color: #f3f2f1;
  font-weight: 600;
}

.keterangan-list {
  list-style: none;
  font-size: 0.825rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.keterangan-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.abbr-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 20px;
  border-radius: 2px;
  font-weight: 700;
  font-size: 0.7rem;
  user-select: none;
}

.abbr-badge.shift-A {
  background-color: var(--color-shift-a);
  border: 1px solid #d2d0ce;
  color: #323130;
}

.abbr-badge.shift-B {
  background-color: var(--color-shift-b);
  border: 1px solid #7eb3f7;
  color: #005a9e;
}

.abbr-badge.shift-C {
  background-color: var(--color-shift-c);
  border: 1px solid #ccadff;
  color: #4a148c;
}

.abbr-badge.shift-NS {
  background-color: var(--color-shift-ns);
  border: 1px solid #94e1ac;
  color: #1b5e20;
}

.abbr-badge.shift-OC {
  background-color: var(--color-shift-oc);
  border: 1px solid #ffd066;
  color: #813e00;
}

.abbr-badge.shift-L {
  background-color: var(--color-shift-l);
  border: 1px solid #ff9da6;
  color: #a80000;
}

.abbr-badge.shift-M {
  background-color: #b9dcfd;
  border: 1px solid #7eb3f7;
  color: #005a9e;
}

.abbr-desc {
  color: #605e5c;
}
</style>
