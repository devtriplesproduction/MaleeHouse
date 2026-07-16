const reports = [{date: '2026-06-30'}, {date: '2026-07-01'}];

function calculateStreak(reports) {
  if (!reports || reports.length === 0) return 0;

  const sorted = [...reports]
    .sort((a, b) => a.date.localeCompare(b.date));

  const uniqueDates = Array.from(new Set(sorted.map((r) => r.date)));

  const pad = (n) => n.toString().padStart(2, '0');
  const getLocalStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Fake current date for testing
  const now = new Date(2026, 6, 1); // July 1, 2026 local time
  const todayStr = getLocalStr(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalStr(yesterday);

  const lastIndex = uniqueDates.length - 1;
  const lastReportDateStr = uniqueDates[lastIndex];

  if (lastReportDateStr !== todayStr && lastReportDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  const [y, m, d] = lastReportDateStr.split('-').map(Number);
  let checkDate = new Date(y, m - 1, d);

  for (let i = lastIndex; i >= 0; i--) {
    const currentReportStr = uniqueDates[i];
    const expectedStr = getLocalStr(checkDate);

    if (currentReportStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

console.log("Local time streak:", calculateStreak(reports));
