// Business logic and schedule generation engine for CloudKilat Support Team

export const JUNIOR_PATTERNS = {
  'AABBC': ['A', 'A', 'B', 'B', 'C', 'L', 'L'],
  'AAABC': ['A', 'A', 'A', 'B', 'C', 'L', 'L'],
  'AABCC': ['A', 'A', 'B', 'C', 'C', 'L', 'L'],
  'ABBBC': ['A', 'B', 'B', 'B', 'C', 'L', 'L'],
  'ABBCC': ['A', 'B', 'B', 'C', 'C', 'L', 'L']
};

export const SHIFT_PRIORITY = {
  'A': 0,
  'B': 1,
  'C': 2
};

/**
 * Returns the Monday timestamp (UTC 00:00:00) of the week containing the given date.
 * This is used to continuously group dates into Monday-Sunday calendar weeks.
 */
export function getWeekIndex(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d.getTime());
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Returns which week of the quarter the given date belongs to.
 * Week 1 starts with the week containing the first day of the quarter.
 */
export function getWeekOfQuarter(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const quarterStartDate = new Date(year, quarterStartMonth, 1);
  
  const dateWeekMon = getWeekIndex(date);
  const qStartWeekMon = getWeekIndex(quarterStartDate);
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((dateWeekMon - qStartWeekMon) / msPerWeek) + 1;
}

/**
 * Calculates the weekday shift index (0=A, 1=B, 2=C) for a Senior.
 * Formula: (q1ShiftIndex + quarterOffset + weekOfQuarterOffset) % 3
 */
export function getSeniorWeekdayShiftIndex(q1ShiftIndex, date) {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1; // 1, 2, 3, 4
  const quarterOffset = quarter - 1;
  const weekOfQuarter = getWeekOfQuarter(date);
  const weekOfQuarterOffset = weekOfQuarter - 1;
  
  return (q1ShiftIndex + quarterOffset + weekOfQuarterOffset) % 3;
}

/**
 * Returns the weekday shift name ('A', 'B', 'C') for a Senior.
 */
export function getSeniorWeekdayShift(q1ShiftIndex, date) {
  const shifts = ['A', 'B', 'C'];
  const idx = getSeniorWeekdayShiftIndex(q1ShiftIndex, date);
  return shifts[idx];
}

/**
 * Returns the weekend shifts for a Senior based on their weekday shift for that week.
 * weekdayShift: 'A', 'B', 'C'
 * Returns: { Sat: 'OC'|'L', Sun: 'OC'|'L' }
 */
export function getSeniorWeekendShifts(weekdayShift) {
  if (weekdayShift === 'A') {
    return { Sat: 'OC', Sun: 'L' };
  } else if (weekdayShift === 'B') {
    return { Sat: 'L', Sun: 'OC' };
  } else {
    return { Sat: 'L', Sun: 'L' };
  }
}

/**
 * Helper to get the number of days in a month.
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generates the deterministic schedule for Seniors for the given month.
 */
export function generateSeniorsSchedule(year, month, seniors) {
  const daysCount = getDaysInMonth(year, month);
  const schedule = {};
  
  seniors.forEach(senior => {
    const seniorShifts = [];
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      
      // First, get weekday shift (which determines the weekend shift too)
      const weekdayShift = getSeniorWeekdayShift(senior.q1ShiftIndex, date);
      
      if (isWeekend) {
        const weekendShifts = getSeniorWeekendShifts(weekdayShift);
        if (dayOfWeek === 6) {
          seniorShifts.push(weekendShifts.Sat);
        } else {
          seniorShifts.push(weekendShifts.Sun);
        }
      } else {
        seniorShifts.push(weekdayShift);
      }
    }
    schedule[senior.id] = seniorShifts;
  });
  
  return schedule;
}

/**
 * Validates a complete schedule for the given month.
 * 
 * schedule: { [memberId]: Array<string> } where Array length = days in month
 * activeJuniors: Array of junior objects
 * seniors: Array of senior objects
 * prevMonthSchedule: { [memberId]: Array<string> } (optional)
 * 
 * Returns: { isValid: boolean, errors: Array<{ type: 'junior' | 'daily' | 'senior', message: string, juniorId?: string, day?: number }> }
 */
export function validateSchedule(year, month, schedule, activeJuniors, seniors, prevMonthSchedule = null) {
  const daysCount = getDaysInMonth(year, month);
  const errors = [];
  
  // 1. VALIDASI ATURAN INDIVIDU JUNIOR
  activeJuniors.forEach(junior => {
    const currentShifts = schedule[junior.id] || [];
    if (currentShifts.length < daysCount) return; // Schedule incomplete
    
    // Ambil data bulan sebelumnya untuk melihat transisi boundary (ambil maks 7 hari terakhir)
    const prevShifts = prevMonthSchedule && prevMonthSchedule[junior.id] 
      ? prevMonthSchedule[junior.id].slice(-7)
      : [];
    
    // Gabungkan riwayat
    const combinedShifts = [...prevShifts, ...currentShifts];
    const offset = prevShifts.length; // Indeks day 1 bulan ini di combinedShifts
    
    // Cek setiap hari di bulan berjalan
    for (let i = offset; i < combinedShifts.length; i++) {
      const dayNum = i - offset + 1;
      const shift = combinedShifts[i];
      
      // Aturan 1: Maks 3 hari kerja shift yang sama berturut-turut
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        if (
          i >= 3 &&
          combinedShifts[i-1] === shift &&
          combinedShifts[i-2] === shift &&
          combinedShifts[i-3] === shift
        ) {
          errors.push({
            type: 'junior',
            juniorId: junior.id,
            day: dayNum,
            message: `Junior ${junior.name}: Bekerja shift "${shift}" selama 4+ hari berturut-turut pada tanggal ${dayNum}.`
          });
        }
      }
      
      // Aturan 2: Tidak boleh upgrade shift pada consecutive work days (A=0, B=1, C=2)
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        const prevShift = combinedShifts[i-1];
        if (prevShift && prevShift !== 'L' && prevShift !== 'NS' && prevShift !== 'OC') {
          const prioCurrent = SHIFT_PRIORITY[shift];
          const prioPrev = SHIFT_PRIORITY[prevShift];
          if (prioCurrent < prioPrev) {
            errors.push({
              type: 'junior',
              juniorId: junior.id,
              day: dayNum,
              message: `Junior ${junior.name}: Terjadi upgrade shift dari "${prevShift}" ke "${shift}" pada tanggal ${dayNum} (consecutive work days).`
            });
          }
        }
      }
      
      // Aturan 3: Hari kerja terakhir sebelum libur harus shift C
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        const nextShift = combinedShifts[i+1];
        if (nextShift === 'L') {
          if (shift !== 'C') {
            errors.push({
              type: 'junior',
              juniorId: junior.id,
              day: dayNum,
              message: `Junior ${junior.name}: Hari kerja terakhir sebelum libur harus shift C, tetapi pada tanggal ${dayNum} adalah shift "${shift}".`
            });
          }
        }
      }
      
      // Aturan 4: Maks 3 hari libur berturutan
      if (shift === 'L') {
        if (
          i >= 3 &&
          combinedShifts[i-1] === 'L' &&
          combinedShifts[i-2] === 'L' &&
          combinedShifts[i-3] === 'L'
        ) {
          errors.push({
            type: 'junior',
            juniorId: junior.id,
            day: dayNum,
            message: `Junior ${junior.name}: Libur berturut-turut lebih dari 3 hari pada tanggal ${dayNum}.`
          });
        }
      }
    }
  });
  
  // 2. VALIDASI ATURAN COVERAGE HARIAN & SENIOR
  let totalWeekdayStaff = 0;
  let totalWeekendStaff = 0;
  let weekdayDays = 0;
  let weekendDays = 0;
  
  // Tampung total staff per hari kerja untuk verifikasi Senin >= Selasa >= ... >= Jumat
  // Kita simpan per index minggu kalender
  const weeklyWeekdayCounts = {}; // { [weekMonTimestamp]: { 1: count, 2: count, ... 5: count } }
  
  for (let day = 1; day <= daysCount; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // Hitung junior pada shift A, B, C
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countWorkingJuniors = 0;
    
    activeJuniors.forEach(junior => {
      const shift = schedule[junior.id]?.[day - 1];
      if (shift === 'A') { countA++; countWorkingJuniors++; }
      else if (shift === 'B') { countB++; countWorkingJuniors++; }
      else if (shift === 'C') { countC++; countWorkingJuniors++; }
    });
    
    // Hitung senior pada shift A, B, C (untuk weekday)
    let seniorCountA = 0;
    let seniorCountB = 0;
    let seniorCountC = 0;
    
    seniors.forEach(senior => {
      const shift = schedule[senior.id]?.[day - 1];
      if (shift === 'A') seniorCountA++;
      else if (shift === 'B') seniorCountB++;
      else if (shift === 'C') seniorCountC++;
    });
    
    const totalWorkingStaffThisDay = countWorkingJuniors + (isWeekend ? 0 : (seniorCountA + seniorCountB + seniorCountC));
    
    if (isWeekend) {
      totalWeekendStaff += totalWorkingStaffThisDay;
      weekendDays++;
      
      // Aturan Weekend: Minimal A >= 1, B >= 1, C >= 1 (murni dari junior)
      if (countA < 1 || countB < 1 || countC < 1) {
        errors.push({
          type: 'daily',
          day: day,
          message: `Tanggal ${day} (Weekend): Kurang coverage! A=${countA}, B=${countB}, C=${countC} (Minimal masing-masing 1 junior).`
        });
      }
    } else {
      totalWeekdayStaff += totalWorkingStaffThisDay;
      weekdayDays++;
      
      // Aturan Weekday 1: A >= B >= C (total harian junior di roster)
      if (countA < countB || countB < countC) {
        errors.push({
          type: 'daily',
          day: day,
          message: `Tanggal ${day} (Weekday): Pelanggaran prioritas coverage! A=${countA}, B=${countB}, C=${countC}. Seharusnya A >= B >= C.`
        });
      }
      
      // Aturan Weekday 2: Shift A minimal 2 orang (junior) setiap hari kerja
      if (countA < 2) {
        errors.push({
          type: 'daily',
          day: day,
          message: `Tanggal ${day} (Weekday): Shift A hanya ${countA} orang (Minimal 2 junior).`
        });
      }
      
      // Aturan Weekday 3: Setiap shift A, B, C harus ada minimal 1 senior
      if (seniorCountA < 1) {
        errors.push({
          type: 'senior',
          day: day,
          message: `Tanggal ${day} (Weekday): Tidak ada Senior di Shift A!`
        });
      }
      if (seniorCountB < 1) {
        errors.push({
          type: 'senior',
          day: day,
          message: `Tanggal ${day} (Weekday): Tidak ada Senior di Shift B!`
        });
      }
      if (seniorCountC < 1) {
        errors.push({
          type: 'senior',
          day: day,
          message: `Tanggal ${day} (Weekday): Tidak ada Senior di Shift C!`
        });
      }
      
      // Catat total kerja untuk aturan Senin >= Selasa >= ... >= Jumat
      const weekMon = getWeekIndex(date);
      if (!weeklyWeekdayCounts[weekMon]) {
        weeklyWeekdayCounts[weekMon] = {};
      }
      weeklyWeekdayCounts[weekMon][dayOfWeek] = totalWorkingStaffThisDay;
    }
  }
  
  // Aturan 5: Weekday lebih banyak staff daripada weekend (pada rata-rata harian)
  const avgWeekday = weekdayDays > 0 ? totalWeekdayStaff / weekdayDays : 0;
  const avgWeekend = weekendDays > 0 ? totalWeekendStaff / weekendDays : 0;
  if (avgWeekday <= avgWeekend) {
    errors.push({
      type: 'daily',
      message: `Rata-rata staf hari kerja (${avgWeekday.toFixed(1)}) tidak lebih banyak dari hari libur/weekend (${avgWeekend.toFixed(1)}).`
    });
  }
  
  // Aturan Tambahan: Senin >= Selasa >= Rabu >= Kamis >= Jumat (untuk setiap minggu penuh)
  Object.keys(weeklyWeekdayCounts).forEach(weekMonStr => {
    const weekData = weeklyWeekdayCounts[weekMonStr];
    // Check transitions: Mon(1) -> Tue(2) -> Wed(3) -> Thu(4) -> Fri(5)
    // Hanya periksa jika hari tersebut terdefinisi (bisa saja terpotong awal/akhir bulan)
    const daysPresent = [1, 2, 3, 4, 5].filter(d => weekData[d] !== undefined);
    
    for (let idx = 0; idx < daysPresent.length - 1; idx++) {
      const d1 = daysPresent[idx];
      const d2 = daysPresent[idx+1];
      if (weekData[d1] < weekData[d2]) {
        const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
        const weekMonDate = new Date(Number(weekMonStr));
        const dayForIndex = (dIndex) => {
          const d = new Date(weekMonDate.getTime());
          d.setDate(weekMonDate.getDate() + (dIndex - 1));
          return d.getDate();
        };
        errors.push({
          type: 'daily',
          day: dayForIndex(d2),
          message: `Pelanggaran urutan staff mingguan: Total staff hari ${dayNames[d1]} (${weekData[d1]}) < hari ${dayNames[d2]} (${weekData[d2]}).`
        });
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a schedule for the given month using randomized trial-and-error search.
 * It assigns each junior a pattern and a startCyclePos.
 * 
 * Returns: { schedule: { [id]: Array<string> }, patterns: { [id]: string }, startPositions: { [id]: number }, success: boolean }
 */
export function generateSchedule(year, month, activeJuniors, seniors, prevMonthSchedule = null) {
  const daysCount = getDaysInMonth(year, month);
  const seniorsSchedule = generateSeniorsSchedule(year, month, seniors);
  
  // Jika tidak ada junior aktif, langsung kembalikan jadwal senior saja
  if (activeJuniors.length === 0) {
    return {
      schedule: seniorsSchedule,
      patterns: {},
      startPositions: {},
      success: true
    };
  }
  
  // Daftar pola yang tersedia
  const patternKeys = Object.keys(JUNIOR_PATTERNS);
  
  // Ambil data pattern & start cycle pos bulan lalu untuk validasi keunikan
  const prevPatterns = prevMonthSchedule?.metadata?.patterns || {};
  const prevStartPositions = prevMonthSchedule?.metadata?.startPositions || {};
  
  let bestAttempt = null;
  let minErrorsCount = Infinity;
  let nodesVisited = 0;
  let maxNodes = 20000;
  
  const currentPatterns = {};
  const currentStartPositions = {};
  const tempSchedule = { ...seniorsSchedule };
  
  // Helper for single junior rules validation
  function validateSingleJunior(junior, shifts) {
    const prevShifts = prevMonthSchedule?.schedule?.[junior.id] 
      ? prevMonthSchedule.schedule[junior.id].slice(-7)
      : [];
    const combinedShifts = [...prevShifts, ...shifts];
    const offset = prevShifts.length;
    
    for (let i = offset; i < combinedShifts.length; i++) {
      const dayNum = i - offset + 1;
      const shift = combinedShifts[i];
      
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        if (i >= 3 && combinedShifts[i-1] === shift && combinedShifts[i-2] === shift && combinedShifts[i-3] === shift) {
          return false;
        }
      }
      
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        const prevShift = combinedShifts[i-1];
        if (prevShift && prevShift !== 'L' && prevShift !== 'NS' && prevShift !== 'OC') {
          if (SHIFT_PRIORITY[shift] < SHIFT_PRIORITY[prevShift]) {
            return false;
          }
        }
      }
      
      if (shift !== 'L' && shift !== 'NS' && shift !== 'OC') {
        const nextShift = combinedShifts[i+1];
        if (nextShift === 'L' && shift !== 'C') {
          return false;
        }
      }
      
      if (shift === 'L') {
        if (i >= 3 && combinedShifts[i-1] === 'L' && combinedShifts[i-2] === 'L' && combinedShifts[i-3] === 'L') {
          return false;
        }
      }
    }
    return true;
  }
  
  // Helper to validate bounds at each node
  function checkPartialBounds(juniorIndex, weekdayPref, weekendPref) {
    const remaining = activeJuniors.length - juniorIndex;
    
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      
      let countA = 0, countB = 0, countC = 0;
      for (let j = 0; j < juniorIndex; j++) {
        const jId = activeJuniors[j].id;
        const s = tempSchedule[jId][day - 1];
        if (s === 'A') countA++;
        else if (s === 'B') countB++;
        else if (s === 'C') countC++;
      }
      
      const maxA = countA + remaining;
      const maxB = countB + remaining;
      const maxC = countC + remaining;
      
      if (isWeekend) {
        if (maxA < 1 || maxB < 1 || maxC < 1) return false;
        
        // Weekend preference (Shift A <= 2 for Juniors)
        if (weekendPref && countA > 2) return false;
      } else {
        if (maxA < countB) return false;
        if (maxB < countC) return false;
        if (maxA < 2) return false;
        
        // Weekday preference (Shift A <= 3 for Juniors)
        if (weekdayPref && countA > 3) return false;
      }
    }
    return true;
  }
  
  function backtrack(juniorIndex, weekdayPref, weekendPref) {
    nodesVisited++;
    if (nodesVisited >= maxNodes) {
      return false;
    }
    
    if (!checkPartialBounds(juniorIndex, weekdayPref, weekendPref)) {
      return false;
    }
    
    if (juniorIndex === activeJuniors.length) {
      const validation = validateSchedule(year, month, tempSchedule, activeJuniors, seniors, prevMonthSchedule);
      if (validation.isValid) {
        bestAttempt = {
          schedule: JSON.parse(JSON.stringify(tempSchedule)),
          patterns: { ...currentPatterns },
          startPositions: { ...currentStartPositions },
          success: true
        };
        return true;
      }
      
      if (validation.errors.length < minErrorsCount) {
        minErrorsCount = validation.errors.length;
        bestAttempt = {
          schedule: JSON.parse(JSON.stringify(tempSchedule)),
          patterns: { ...currentPatterns },
          startPositions: { ...currentStartPositions },
          success: false,
          errors: validation.errors
        };
      }
      return false;
    }
    
    const junior = activeJuniors[juniorIndex];
    const prevPat = prevPatterns[junior.id];
    const prevPos = prevStartPositions[junior.id];
    
    const allowedPatterns = prevPat ? patternKeys.filter(k => k !== prevPat) : patternKeys;
    
    // Sort allowed positions to balance start cycle positions across juniors
    const posUsage = Array(7).fill(0);
    for (let j = 0; j < juniorIndex; j++) {
      const p = currentStartPositions[activeJuniors[j].id];
      posUsage[p]++;
    }
    
    const basePositions = prevPos !== undefined ? [0,1,2,3,4,5,6].filter(p => p !== prevPos) : [0,1,2,3,4,5,6];
    const allowedPositions = basePositions.sort((a, b) => posUsage[a] - posUsage[b]);
    
    for (const pattern of allowedPatterns) {
      for (const pos of allowedPositions) {
        currentPatterns[junior.id] = pattern;
        currentStartPositions[junior.id] = pos;
        
        const patternArray = JUNIOR_PATTERNS[pattern];
        const juniorShifts = [];
        for (let day = 1; day <= daysCount; day++) {
          const shiftIdx = (pos + day - 1) % 7;
          juniorShifts.push(patternArray[shiftIdx]);
        }
        
        if (validateSingleJunior(junior, juniorShifts)) {
          tempSchedule[junior.id] = juniorShifts;
          if (backtrack(juniorIndex + 1, weekdayPref, weekendPref)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function runSearch(weekdayPref, weekendPref, nodeLimit) {
    nodesVisited = 0;
    maxNodes = nodeLimit;
    
    // Clear tempSchedule of junior entries to start clean
    Object.keys(tempSchedule).forEach(k => {
      if (!k.startsWith('senior-')) {
        delete tempSchedule[k];
      }
    });
    
    // Clear current metadata
    Object.keys(currentPatterns).forEach(k => delete currentPatterns[k]);
    Object.keys(currentStartPositions).forEach(k => delete currentStartPositions[k]);
    
    return backtrack(0, weekdayPref, weekendPref);
  }
  
  // Pass 1: Weekday & Weekend Preferences
  let success = runSearch(true, true, 15000);
  
  if (!success) {
    // Pass 2: Weekday Preference only
    success = runSearch(true, false, 15000);
  }
  
  if (!success) {
    // Pass 3: Weekend Preference only
    success = runSearch(false, true, 15000);
  }
  
  if (!success) {
    // Pass 4: Fallback to standard
    success = runSearch(false, false, 100000);
  }
  
  if (success && bestAttempt) {
    return bestAttempt;
  }
  
  if (bestAttempt) {
    return bestAttempt;
  }
  
  return {
    schedule: seniorsSchedule,
    patterns: {},
    startPositions: {},
    success: false
  };
}
