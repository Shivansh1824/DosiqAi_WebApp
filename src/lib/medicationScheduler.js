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
