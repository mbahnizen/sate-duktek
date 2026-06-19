import { defineStore } from 'pinia';
import { 
  generateSchedule, 
  validateSchedule, 
  generateSeniorsSchedule,
  getDaysInMonth,
  JUNIOR_PATTERNS,
  getSeniorWeekdayShift,
  getSeniorWeekendShifts
} from '../utils/scheduleEngine';

const DEFAULT_MEMBERS = {
  leader: { id: 'leader-1', name: 'Manan Imam Gozali', role: 'leader' },
  seniors: [
    { id: 'senior-1', name: 'M. Ardiansyah', role: 'senior', q1ShiftIndex: 0 },
    { id: 'senior-2', name: 'Erlan Andriansyah', role: 'senior', q1ShiftIndex: 1 },
    { id: 'senior-3', name: 'Yusuf Ischak', role: 'senior', q1ShiftIndex: 2 }
  ],
  juniors: [
    { id: 'junior-1', name: 'Bayu Ilham Mutaqin', role: 'junior', active: true },
    { id: 'junior-2', name: 'Fadli Muhammad H.', role: 'junior', active: true },
    { id: 'junior-3', name: 'Fikri Andra Irham', role: 'junior', active: true },
    { id: 'junior-4', name: 'Fadly Ilham Fatahilah', role: 'junior', active: true },
    { id: 'junior-5', name: 'Solideo Manuel', role: 'junior', active: true },
    { id: 'junior-6', name: 'M. Luthfiandra Tsaqif', role: 'junior', active: true },
    { id: 'junior-7', name: 'M. Mulki Al Karim Siregar', role: 'junior', active: true },
    { id: 'junior-8', name: 'M. Aditya Luthfiansyah', role: 'junior', active: true }
  ]
};

function getSeniorShift(senior, date) {
  const dayOfWeek = date.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  const weekdayShift = getSeniorWeekdayShift(senior.q1ShiftIndex, date);
  if (isWeekend) {
    const weekendShifts = getSeniorWeekendShifts(weekdayShift);
    return dayOfWeek === 6 ? weekendShifts.Sat : weekendShifts.Sun;
  }
  return weekdayShift;
}

function getDayName(year, month, day) {
  const date = new Date(year, month, day);
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return dayNames[date.getDay()];
}

function isWeekend(year, month, day) {
  const date = new Date(year, month, day);
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export const useScheduleStore = defineStore('schedule', {
  state: () => {
    // Load members
    const savedMembers = localStorage.getItem('ck_schedule_members');
    let members = savedMembers ? JSON.parse(savedMembers) : null;

    // Cache migration: if leader is not Manan, force reset members & schedules
    if (members && members.leader?.name !== 'Manan Imam Gozali') {
      localStorage.removeItem('ck_schedule_members');
      localStorage.removeItem('ck_schedules');
      members = null;
    }

    if (!members) {
      members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
    }

    // Load schedules
    const savedSchedules = localStorage.getItem('ck_schedules');
    const schedules = savedSchedules ? JSON.parse(savedSchedules) : {};

    // Get current date
    const now = new Date();
    
    return {
      members,
      schedules,
      currentMonth: now.getMonth(), // 0-11
      currentYear: now.getFullYear(),
      validationErrors: [],
      highlightedDay: null,
      highlightedJuniorId: null
    };
  },

  getters: {
    currentKey(state) {
      const monthStr = String(state.currentMonth + 1).padStart(2, '0');
      return `${state.currentYear}-${monthStr}`;
    },

    prevKey(state) {
      let prevM = state.currentMonth - 1;
      let prevY = state.currentYear;
      if (prevM < 0) {
        prevM = 11;
        prevY -= 1;
      }
      const monthStr = String(prevM + 1).padStart(2, '0');
      return `${prevY}-${monthStr}`;
    },

    activeJuniors(state) {
      return state.members.juniors.filter(j => j.active);
    },

    currentMonthSchedule(state) {
      const key = this.currentKey;
      return state.schedules[key]?.schedule || null;
    },

    currentMonthPatterns(state) {
      const key = this.currentKey;
      return state.schedules[key]?.metadata?.patterns || {};
    },

    currentMonthStartPositions(state) {
      const key = this.currentKey;
      return state.schedules[key]?.metadata?.startPositions || {};
    },

    daysInCurrentMonth(state) {
      return getDaysInMonth(state.currentYear, state.currentMonth);
    },

    prevMonthLastDays(state) {
      let prevM = state.currentMonth - 1;
      let prevY = state.currentYear;
      if (prevM < 0) {
        prevM = 11;
        prevY -= 1;
      }
      
      const prevKey = this.prevKey;
      const prevSched = state.schedules[prevKey]?.schedule || null;
      const prevDaysCount = getDaysInMonth(prevY, prevM);
      
      const d1 = prevDaysCount - 1;
      const d2 = prevDaysCount;
      
      const result = {
        days: [
          { dayNum: d1, dayName: getDayName(prevY, prevM, d1), isWeekend: isWeekend(prevY, prevM, d1) },
          { dayNum: d2, dayName: getDayName(prevY, prevM, d2), isWeekend: isWeekend(prevY, prevM, d2) }
        ],
        shifts: {}
      };
      
      const allMembers = [
        state.members.leader,
        ...state.members.seniors,
        ...state.members.juniors
      ];
      
      allMembers.forEach(m => {
        let s1 = '-';
        let s2 = '-';
        
        if (prevSched && prevSched[m.id]) {
          s1 = prevSched[m.id][d1 - 1] || 'L';
          s2 = prevSched[m.id][d2 - 1] || 'L';
        } else {
          if (m.role === 'leader') {
            s1 = 'NS';
            s2 = 'NS';
          } else if (m.role === 'senior') {
            const date1 = new Date(prevY, prevM, d1);
            const date2 = new Date(prevY, prevM, d2);
            s1 = getSeniorShift(m, date1);
            s2 = getSeniorShift(m, date2);
          } else {
            s1 = 'L';
            s2 = 'L';
          }
        }
        
        result.shifts[m.id] = [s1, s2];
      });
      
      return result;
    }
  },

  actions: {
    saveToLocalStorage() {
      localStorage.setItem('ck_schedule_members', JSON.stringify(this.members));
      localStorage.setItem('ck_schedules', JSON.stringify(this.schedules));
    },

    setHighlight(day, juniorId) {
      if (this.highlightedDay === day && this.highlightedJuniorId === juniorId) {
        this.highlightedDay = null;
        this.highlightedJuniorId = null;
      } else {
        this.highlightedDay = day;
        this.highlightedJuniorId = juniorId || null;
      }
    },

    clearHighlight() {
      this.highlightedDay = null;
      this.highlightedJuniorId = null;
    },

    addJunior(name) {
      if (!name.trim()) return;

      // Check for duplicate name (case-insensitive)
      const nameExists = 
        this.members.leader.name.toLowerCase() === name.trim().toLowerCase() ||
        this.members.seniors.some(s => s.name.toLowerCase() === name.trim().toLowerCase()) ||
        this.members.juniors.some(j => j.name.toLowerCase() === name.trim().toLowerCase());
        
      if (nameExists) {
        alert(`Anggota dengan nama "${name.trim()}" sudah ada!`);
        return;
      }

      const newJunior = {
        id: `junior-${Date.now()}`,
        name: name.trim(),
        role: 'junior',
        active: true
      };
      
      this.members.juniors.push(newJunior);
      
      // Initialize schedule array for the new junior in all existing active schedules
      Object.keys(this.schedules).forEach(key => {
        if (this.schedules[key] && this.schedules[key].schedule) {
          const [year, month] = key.split('-').map(Number);
          const daysCount = getDaysInMonth(year, month - 1);
          if (!this.schedules[key].schedule[newJunior.id]) {
            this.schedules[key].schedule[newJunior.id] = Array(daysCount).fill('L');
          }
        }
      });

      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    updateMemberName(id, role, newName) {
      if (!newName.trim()) return false;

      // Check for duplicate name (case-insensitive, excluding current member)
      const isDuplicate = (mId, mName) => mId !== id && mName.toLowerCase() === newName.trim().toLowerCase();
      const duplicateExists = 
        (this.members.leader.id !== id && isDuplicate(this.members.leader.id, this.members.leader.name)) ||
        this.members.seniors.some(s => isDuplicate(s.id, s.name)) ||
        this.members.juniors.some(j => isDuplicate(j.id, j.name));
      
      if (duplicateExists) {
        alert(`Anggota dengan nama "${newName.trim()}" sudah ada!`);
        return false;
      }
      
      if (role === 'leader' && this.members.leader.id === id) {
        this.members.leader.name = newName.trim();
      } else if (role === 'senior') {
        const senior = this.members.seniors.find(s => s.id === id);
        if (senior) {
          senior.name = newName.trim();
        }
      } else if (role === 'junior') {
        const junior = this.members.juniors.find(j => j.id === id);
        if (junior) {
          junior.name = newName.trim();
        }
      }
      
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
      return true;
    },

    removeJunior(id) {
      this.members.juniors = this.members.juniors.filter(j => j.id !== id);
      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    toggleJuniorActive(id) {
      const junior = this.members.juniors.find(j => j.id === id);
      if (junior) {
        junior.active = !junior.active;
        this.clearHighlight();
        this.saveToLocalStorage();
        this.validateCurrentSchedule();
      }
    },

    updateSeniorQ1(id, index) {
      const senior = this.members.seniors.find(s => s.id === id);
      if (senior) {
        // Cek apakah index sudah dipakai senior lain
        const otherSenior = this.members.seniors.find(s => s.id !== id && s.q1ShiftIndex === index);
        if (otherSenior) {
          // Tukar index
          otherSenior.q1ShiftIndex = senior.q1ShiftIndex;
        }
        senior.q1ShiftIndex = index;
        this.clearHighlight();
        this.saveToLocalStorage();
        this.regenerateSeniorsOnly();
      }
    },

    regenerateSeniorsOnly() {
      const key = this.currentKey;
      if (!this.schedules[key]) return;
      
      const newSeniorsSchedule = generateSeniorsSchedule(this.currentYear, this.currentMonth, this.members.seniors);
      // Gabungkan ke jadwal yang sudah ada
      Object.keys(newSeniorsSchedule).forEach(seniorId => {
        this.schedules[key].schedule[seniorId] = newSeniorsSchedule[seniorId];
      });
      
      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    generateCurrentSchedule() {
      const key = this.currentKey;
      const prevSched = this.schedules[this.prevKey] || null;
      
      const result = generateSchedule(
        this.currentYear,
        this.currentMonth,
        this.activeJuniors,
        this.members.seniors,
        prevSched
      );
      
      // leader schedule (always NS)
      const daysCount = this.daysInCurrentMonth;
      const leaderSchedule = Array(daysCount).fill('NS');
      result.schedule[this.members.leader.id] = leaderSchedule;
      
      this.schedules[key] = {
        schedule: result.schedule,
        metadata: {
          patterns: result.patterns,
          startPositions: result.startPositions,
          success: result.success
        }
      };
      
      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    updateCellShift(memberId, dayIndex, newShift) {
      const key = this.currentKey;
      if (!this.schedules[key]) {
        this.initializeEmptySchedule();
      }
      
      if (!this.schedules[key].schedule[memberId]) {
        const daysCount = this.daysInCurrentMonth;
        this.schedules[key].schedule[memberId] = Array(daysCount).fill('L');
      }
      
      this.schedules[key].schedule[memberId][dayIndex] = newShift;
      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    updateJuniorMetadata(juniorId, pattern, startPosition) {
      const key = this.currentKey;
      if (!this.schedules[key]) return;
      
      if (!this.schedules[key].metadata) {
        this.schedules[key].metadata = { patterns: {}, startPositions: {} };
      }
      if (!this.schedules[key].metadata.patterns) {
        this.schedules[key].metadata.patterns = {};
      }
      if (!this.schedules[key].metadata.startPositions) {
        this.schedules[key].metadata.startPositions = {};
      }
      
      this.schedules[key].metadata.patterns[juniorId] = pattern;
      this.schedules[key].metadata.startPositions[juniorId] = startPosition;
      
      // Regenerate shifts for this junior based on new pattern and startPosition
      const patternArray = JUNIOR_PATTERNS[pattern];
      const daysCount = this.daysInCurrentMonth;
      const newShifts = [];
      for (let day = 1; day <= daysCount; day++) {
        const shiftIdx = (startPosition + day - 1) % 7;
        newShifts.push(patternArray[shiftIdx]);
      }
      this.schedules[key].schedule[juniorId] = newShifts;
      this.clearHighlight();
      this.saveToLocalStorage();
      this.validateCurrentSchedule();
    },

    initializeEmptySchedule() {
      const key = this.currentKey;
      const daysCount = this.daysInCurrentMonth;
      
      const newSchedule = {};
      
      // Leader always NS
      newSchedule[this.members.leader.id] = Array(daysCount).fill('NS');
      
      // Seniors
      const seniorsSchedule = generateSeniorsSchedule(this.currentYear, this.currentMonth, this.members.seniors);
      Object.assign(newSchedule, seniorsSchedule);
      
      // Juniors (default all L or A)
      this.members.juniors.forEach(j => {
        newSchedule[j.id] = Array(daysCount).fill('L');
      });
      
      this.schedules[key] = {
        schedule: newSchedule,
        metadata: {
          patterns: {},
          startPositions: {},
          success: false
        }
      };
      
      this.saveToLocalStorage();
    },

    validateCurrentSchedule() {
      const key = this.currentKey;
      if (!this.schedules[key] || !this.schedules[key].schedule) {
        this.validationErrors = [];
        return;
      }
      
      const prevSched = this.schedules[this.prevKey] || null;
      
      const result = validateSchedule(
        this.currentYear,
        this.currentMonth,
        this.schedules[key].schedule,
        this.activeJuniors,
        this.members.seniors,
        prevSched ? prevSched.schedule : null
      );
      
      this.validationErrors = result.errors;
    },

    resetAllData() {
      localStorage.removeItem('ck_schedule_members');
      localStorage.removeItem('ck_schedules');
      this.members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
      this.schedules = {};
      this.validationErrors = [];
      this.clearHighlight();
      this.initializeEmptySchedule();
      this.validateCurrentSchedule();
    },

    changeMonth(delta) {
      let newM = this.currentMonth + delta;
      let newY = this.currentYear;
      if (newM > 11) {
        newM = 0;
        newY += 1;
      } else if (newM < 0) {
        newM = 11;
        newY -= 1;
      }
      this.currentMonth = newM;
      this.currentYear = newY;
      
      const key = this.currentKey;
      if (!this.schedules[key]) {
        this.initializeEmptySchedule();
      }
      
      this.clearHighlight();
      this.validateCurrentSchedule();
    }
  }
});
