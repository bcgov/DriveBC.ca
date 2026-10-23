export const getCurrentPacificDateString = () => {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Vancouver' }).split(',')[0];
}

export const getPacficMidnight = (UTCDateString) => {
  // DateTime of midnight GMT+0 of the dateString in current timezone
  // e.g. '2025-02-12' -> Tue Feb 11 2025 16:00:00 GMT-0800 (Pacific Standard Time)
  // e.g. '2025-04-12' -> Fri Apr 11 2025 17:00:00 GMT-0700 (Pacific Daylight Time)
  const dt = new Date(UTCDateString ? UTCDateString : getCurrentPacificDateString());

  // Add 8 hours to correct the timezone difference
  // e.g. Wed Feb 12 2025 00:00:00 GMT-0800 (Pacific Standard Time)
  // e.g. Sat Apr 12 2025 01:00:00 GMT-0700 (Pacific Daylight Time)
  dt.setUTCHours(8, 0, 0, 0);

  // Set to hour 0 to offset the extra hour in Pacific Daylight Time
  // e.g. Wed Feb 12 2025 00:00:00 GMT-0800 (Pacific Standard Time)
  // Sat Apr 12 2025 00:00:00 GMT-0700 (Pacific Daylight Time)
  dt.setHours(0, 0, 0, 0); // offset extra hour in Pacific Daylight Time

  return dt;
}

export const isDaylightSavingTime = (dateString) => {
  const dateTime = getPacficMidnight(dateString);
  const startOfYear = getPacficMidnight(dateTime.getFullYear().toString() + "-01-01");
  const midYear = getPacficMidnight(dateTime.getFullYear().toString() + "-06-01");

  // If the timezone offset of the current date is less than the offset at the start of the year,
  // it means the current date is in DST.
  return dateTime.getTimezoneOffset() < Math.max(startOfYear.getTimezoneOffset(), midYear.getTimezoneOffset());
}

// DBC22-7627: official BC/AB abbreviations from Nov 1 2026 02:00 local, not in browser tzdata
export const TZ_CHANGES = {
  'America/Vancouver': { abbreviation: 'PCT', start: Date.UTC(2026, 10, 1, 9) },
  'America/Edmonton': { abbreviation: 'MDT', start: Date.UTC(2026, 10, 1, 8) },
};

export const formatDateTime = (date, options) => {
  const dt = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const change = TZ_CHANGES[formatter.resolvedOptions().timeZone];
  if (!change || dt < change.start) {
    return formatter.format(dt);
  }

  return formatter.formatToParts(dt)
    .map((part) => part.type === 'timeZoneName' ? change.abbreviation : part.value)
    .join('');
}
