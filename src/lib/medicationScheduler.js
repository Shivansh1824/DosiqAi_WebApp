/**
 * Dosiq AI Medication Timing & Interval Engine
 * Mathematical calculation for daily medication schedules, high-frequency intervals,
 * and SOS handling based on Dosiq clinical safety standards.
 */

// Format "HH:MM" (24h) → "h:MM AM/PM" (12h)
export const formatTime12h = (time24) => {
  if (!time24) return '--:--';
  const [hh, mm] = time24.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${period}`;
};

// Check if a medication is SOS / As-Needed
export const isMedicationSos = (med) => {
  if (!med) return false;
  if (med.interval_days === 0) return true;
  const timing = med.timing || {};
  if (timing.total_times_per_day === 0) return true;
  const dosage = String(timing.dosage || '').trim().toLowerCase();
  if (dosage === 'sos' || dosage === 'as needed' || dosage === 'prn') return true;
  const instruction = String(med.dosage_instruction || '').toLowerCase();
  if (
    instruction.includes('sos') ||
    instruction.includes('as needed') ||
    instruction.includes('when required') ||
    instruction.includes('prn')
  ) {
    return true;
  }
  return false;
};

/**
 * Generates cyclic / evenly spaced dose times across a 14-hour waking window.
 * Default wake: 08:00 (8:00 AM)
 * Default sleep: 22:00 (10:00 PM)
 * Waking window: 840 minutes (14 hours)
 *
 * Ensures a minimum break between doses (safety standard >= 60-120 mins).
 */
export const calculateDoseSchedule = (frequencyTimesPerDay, wakeTime = '08:00', sleepTime = '22:00') => {
  if (!frequencyTimesPerDay || frequencyTimesPerDay <= 0) {
    return [];
  }

  // Parse wake and sleep in minutes from midnight
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const wakeMinutes = wakeH * 60 + wakeM;
  const sleepMinutes = sleepH * 60 + sleepM;
  const totalWakingMinutes = Math.max(sleepMinutes - wakeMinutes, 360); // min 6h safety

  // 1x Daily
  if (frequencyTimesPerDay === 1) {
    return [
      {
        slotIndex: 0,
        doseNumber: 1,
        time24: '08:00',
        time12: '08:00 AM',
        period: 'Morning',
        periodEmoji: '☀️',
        label: 'Morning Slot',
        subtitle: 'Breakfast slot',
        breakHours: null
      }
    ];
  }

  // 2x Daily
  if (frequencyTimesPerDay === 2) {
    return [
      {
        slotIndex: 0,
        doseNumber: 1,
        time24: '08:00',
        time12: '08:00 AM',
        period: 'Morning',
        periodEmoji: '☀️',
        label: 'Morning Slot',
        subtitle: 'Breakfast slot',
        breakHours: 12
      },
      {
        slotIndex: 1,
        doseNumber: 2,
        time24: '20:00',
        time12: '08:00 PM',
        period: 'Night',
        periodEmoji: '🌙',
        label: 'Night Slot',
        subtitle: 'Dinner slot',
        breakHours: 12
      }
    ];
  }

  // 3x Daily (Standard Morning, Afternoon, Night)
  if (frequencyTimesPerDay === 3) {
    return [
      {
        slotIndex: 0,
        doseNumber: 1,
        time24: '08:00',
        time12: '08:00 AM',
        period: 'Morning',
        periodEmoji: '☀️',
        label: 'Morning Slot',
        subtitle: 'Breakfast slot',
        breakHours: 6
      },
      {
        slotIndex: 1,
        doseNumber: 2,
        time24: '14:00',
        time12: '02:00 PM',
        period: 'Afternoon',
        periodEmoji: '🌤️',
        label: 'Afternoon Slot',
        subtitle: 'Lunch slot',
        breakHours: 6
      },
      {
        slotIndex: 2,
        doseNumber: 3,
        time24: '20:00',
        time12: '08:00 PM',
        period: 'Night',
        periodEmoji: '🌙',
        label: 'Night Slot',
        subtitle: 'Dinner slot',
        breakHours: 6
      }
    ];
  }

  // Mathematical Calculation for High Frequency (4x, 5x, 6x):
  // Interval = (Waking Window) / (N - 1)
  // Safety constraint: minimum interval >= 60 minutes (1-2 hour safety rule).
  const rawIntervalMinutes = totalWakingMinutes / (frequencyTimesPerDay - 1);
  const intervalMinutes = Math.max(Math.round(rawIntervalMinutes / 15) * 15, 60); // rounded to nearest 15 mins, min 60m
  const breakHours = Number((intervalMinutes / 60).toFixed(1));

  const slots = [];
  for (let i = 0; i < frequencyTimesPerDay; i++) {
    const currentMins = wakeMinutes + i * intervalMinutes;
    const hh = Math.floor(currentMins / 60);
    const mm = currentMins % 60;
    const time24 = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const time12 = formatTime12h(time24);

    let period = 'Day';
    let periodEmoji = '🌤️';
    if (hh < 11) {
      period = 'Morning';
      periodEmoji = '☀️';
    } else if (hh < 14) {
      period = 'Mid-Day';
      periodEmoji = '🌤️';
    } else if (hh < 17) {
      period = 'Afternoon';
      periodEmoji = '☀️';
    } else if (hh < 21) {
      period = 'Evening';
      periodEmoji = '🌇';
    } else {
      period = 'Night';
      periodEmoji = '🌙';
    }

    slots.push({
      slotIndex: i,
      doseNumber: i + 1,
      time24,
      time12,
      period,
      periodEmoji,
      label: `Dose ${i + 1} (${period})`,
      subtitle: i === 0 ? 'First morning dose' : i === frequencyTimesPerDay - 1 ? 'Last bedtime dose' : `${breakHours}h after previous dose`,
      breakHours
    });
  }

  return slots;
};

/**
 * Evaluates whether a medication is:
 * - 'completed' / 'done': The prescribed course has ended based on start_date + duration_days
 * - 'pending' / 'connect': The course is current or ongoing, but Telegram Care Loop is not linked/started
 * - 'active': The course is current AND Care Loop / Telegram is linked and active
 *
 * @param {Object} med The medication item
 * @param {Object} profile The associated patient/family profile
 * @returns {Object} status analysis with label, status, type, badgeClass, icon
 */
export const getMedicationStatus = (med, profile) => {
  if (!med) {
    return {
      status: 'pending',
      type: 'pending',
      label: 'Connect to Start',
      sub: 'Not started',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: 'pending'
    };
  }

  // 1. Explicit status override check
  if (med.status === 'completed' || med.status === 'done') {
    return {
      status: 'completed',
      type: 'done',
      label: 'Course Done',
      sub: 'Finished',
      badgeClass: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: 'done'
    };
  }

  // 2. Check if the prescription / start date + duration has elapsed
  const startDateStr = med.start_date || med.visit_date;
  const isOngoing = med.duration === 'Ongoing' ||
    (typeof med.duration === 'string' && med.duration.toLowerCase().includes('ongoing')) ||
    (typeof med.category === 'string' && (
      med.category.toLowerCase().includes('blood pressure') ||
      med.category.toLowerCase().includes('hypertension') ||
      med.category.toLowerCase().includes('chronic') ||
      med.category.toLowerCase().includes('diabetes')
    ));

  let isDatePast = false;
  if (startDateStr && !isOngoing) {
    const startDate = new Date(startDateStr);
    if (!isNaN(startDate.getTime())) {
      const now = new Date();
      // Parse duration days: e.g. 5, 7, 10, or parse from duration string
      let days = parseInt(med.duration_days, 10);
      if (isNaN(days) || days <= 0) {
        if (typeof med.duration === 'string') {
          const match = med.duration.match(/\d+/);
          days = match ? parseInt(match[0], 10) : 7;
        } else {
          days = 7; // standard prescription course default
        }
      }

      // End date is start date + days
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      if (now.getTime() > endDate.getTime()) {
        isDatePast = true;
      }
    }
  }

  if (isDatePast) {
    return {
      status: 'completed',
      type: 'done',
      label: 'Course Done',
      sub: med.start_date ? `Ended (${med.duration_days || 7}d course)` : 'Prescription ended',
      badgeClass: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: 'done'
    };
  }

  // 3. Check Care Loop / Telegram integration
  const isTelegramLinked = !!profile?.telegram_linked || !!profile?.care_loop_enabled;
  const isSyncedAndActive = !!med.is_synced && med.status === 'active';

  // If user hasn't started Telegram Care Loop
  if (!isTelegramLinked && !isSyncedAndActive) {
    return {
      status: 'pending',
      type: 'pending',
      label: 'Connect to Start',
      sub: 'Telegram offline',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
      icon: 'pending'
    };
  }

  // 4. Truly Active
  return {
    status: 'active',
    type: 'active',
    label: 'Active Dose',
    sub: med.time ? `Next: ${med.time}` : 'Scheduled',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: 'active'
  };
};

/**
 * Counts truly active medications based on prescription dates & Care Loop status.
 */
export const getActiveMedicationsCount = (medications = [], profiles = [], activeProfile = null) => {
  if (!Array.isArray(medications) || medications.length === 0) return 0;
  return medications.filter(med => {
    const prof = profiles.find(p => p.id === med.family_member_id) || activeProfile || {};
    const statusObj = getMedicationStatus(med, prof);
    return statusObj.status === 'active';
  }).length;
};

