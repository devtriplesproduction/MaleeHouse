const dates = ['2026-07-14', '2026-07-15', '2026-07-16'];

function calculateStreak(reports) {
  if (!reports || reports.length === 0) return 0;

  // Sort reports by date ascending to make calculations easy
  const sorted = [...reports]
    .map((r) => new Date(r.date))
    .sort((a, b) => a.getTime() - b.getTime());

  // Get unique dates (in case of duplicates)
  const uniqueDates = Array.from(new Set(sorted.map((d) => d.toISOString().split('T')[0])));

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  console.log("todayStr", todayStr, "yesterdayStr", yesterdayStr);
  console.log("uniqueDates", uniqueDates);

  const lastIndex = uniqueDates.length - 1;
  const lastReportDateStr = uniqueDates[lastIndex];

  // If the last report is neither today nor yesterday, the streak is broken
  if (lastReportDateStr !== todayStr && lastReportDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(lastReportDateStr);

  // Go backwards and count consecutive days
  for (let i = lastIndex; i >= 0; i--) {
    const currentReportStr = uniqueDates[i];
    const expectedStr = checkDate.toISOString().split('T')[0];

    if (currentReportStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

console.log(calculateStreak([{date: '2026-07-14'}, {date: '2026-07-15'}, {date: '2026-07-16'}]));
