// SlipSense Financial Intelligence & Analytics Engine
// 100% On-Device & Private Computation (No Cloud, No Tracking)

import { THAI_BANKS, getBankById } from '../data/banks';
import { getCategoryById } from '../data/defaultCategories';

/**
 * Calculate comprehensive Financial Health Score (0 - 100)
 */
export function calculateFinancialHealth(transactions = [], currentDate = new Date(), budgets = {}) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalSpent = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  if (monthTxs.length === 0) {
    return {
      score: 85,
      grade: 'A',
      title: 'พร้อมเริ่มต้นการวิเคราะห์',
      color: '#10B981',
      bgGradient: 'from-emerald-500/20 to-teal-500/10',
      insights: [
        'สแกนหรือเพิ่มสลิป เพื่อปลดล็อกการวิเคราะห์พฤติกรรมการเงินเชิงลึก',
        'ระบบวิเคราะห์จะช่วยตรวจจับรูรั่วทางการเงิน และพยากรณ์ยอดสิ้นเดือน',
        'ข้อมูลทั้งหมดจะถูกประมวลผลในเครื่องของคุณ 100% ไม่ส่งออกภายนอก'
      ],
      metrics: {
        burnRateScore: 90,
        leakScore: 90,
        budgetScore: 90,
        diversityScore: 70
      }
    };
  }

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : new Date(curYear, curMonth, 0).getDate();
  const totalDays = new Date(curYear, curMonth, 0).getDate();
  const dailyBurn = totalSpent / daysPassed;

  // 1. Burn Rate Stability (0-25)
  // Higher volatility or extreme spikes reduce score
  const dailySpends = {};
  monthTxs.forEach(tx => {
    const d = tx.date;
    dailySpends[d] = (dailySpends[d] || 0) + Number(tx.amount);
  });
  const spends = Object.values(dailySpends);
  const avg = spends.length > 0 ? totalSpent / spends.length : 0;
  let variance = 0;
  spends.forEach(s => { variance += Math.pow(s - avg, 2); });
  const stdDev = spends.length > 1 ? Math.sqrt(variance / spends.length) : 0;
  const cv = avg > 0 ? stdDev / avg : 0; // coefficient of variation
  let burnRateScore = Math.max(10, Math.min(25, 25 - cv * 8));

  // 2. Money Leak Detection Score (0-25)
  // High ratio of micro-transactions (< 100฿) reduces score
  const microTxs = monthTxs.filter(tx => Number(tx.amount) > 0 && Number(tx.amount) <= 120);
  const microTotal = microTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const microRatio = totalSpent > 0 ? microTotal / totalSpent : 0;
  let leakScore = 25;
  if (microRatio > 0.35) leakScore = 12;
  else if (microRatio > 0.22) leakScore = 18;
  else if (microRatio > 0.12) leakScore = 22;

  // 3. Category Balance / Diversification (0-25)
  // Overspending on single category (e.g. food > 60%) reduces score
  const catTotals = {};
  monthTxs.forEach(tx => {
    const cid = tx.categoryId || 'other';
    catTotals[cid] = (catTotals[cid] || 0) + Number(tx.amount);
  });
  const maxCatRatio = Math.max(...Object.values(catTotals)) / Math.max(1, totalSpent);
  let diversityScore = 25;
  if (maxCatRatio > 0.65) diversityScore = 14;
  else if (maxCatRatio > 0.45) diversityScore = 20;

  // 4. Budget Adherence Score (0-25)
  let budgetScore = 25;
  const totalBudget = Object.values(budgets).reduce((a, b) => a + Number(b || 0), 0);
  if (totalBudget > 0) {
    const expectedSpendPace = (totalBudget / totalDays) * daysPassed;
    const paceRatio = totalSpent / Math.max(1, expectedSpendPace);
    if (paceRatio > 1.3) budgetScore = 10;
    else if (paceRatio > 1.1) budgetScore = 16;
    else if (paceRatio > 0.9) budgetScore = 22;
  }

  const rawScore = Math.round(burnRateScore + leakScore + diversityScore + budgetScore);
  const finalScore = Math.max(30, Math.min(99, rawScore));

  let grade = 'B+';
  let title = 'การเงินคล่องตัวดี';
  let color = '#10B981';
  let bgGradient = 'from-emerald-500/20 to-teal-500/10';

  if (finalScore >= 90) {
    grade = 'A+';
    title = 'สุขภาพการเงินยอดเยี่ยม 💎';
    color = '#10B981';
    bgGradient = 'from-emerald-500/25 to-cyan-500/15';
  } else if (finalScore >= 80) {
    grade = 'A';
    title = 'ควบคุมรายจ่ายได้ดีมาก ✨';
    color = '#06B6D4';
    bgGradient = 'from-cyan-500/25 to-blue-500/15';
  } else if (finalScore >= 70) {
    grade = 'B+';
    title = 'การเงินอยู่ในเกณฑ์ดี 👍';
    color = '#3B82F6';
    bgGradient = 'from-blue-500/25 to-indigo-500/15';
  } else if (finalScore >= 60) {
    grade = 'B';
    title = 'เริ่มมีสัญญาณรายจ่ายสูง ⚠️';
    color = '#F59E0B';
    bgGradient = 'from-amber-500/25 to-orange-500/15';
  } else {
    grade = 'C';
    title = 'ต้องระวังเงินรั่วไหล 🚨';
    color = '#EF4444';
    bgGradient = 'from-rose-500/25 to-orange-500/15';
  }

  // Generate personalized actionable insights
  const insights = [];

  // Insight 1: Spending Velocity Forecast
  const projectedTotal = dailyBurn * totalDays;
  insights.push(
    `อัตราใช้จ่ายเฉลี่ย ฿${Math.round(dailyBurn).toLocaleString()} / วัน คาดการณ์ยอดสิ้นเดือนอยู่ที่ประมาณ ฿${Math.round(projectedTotal).toLocaleString()}`
  );

  // Insight 2: Micro leak detection
  if (microTxs.length >= 3) {
    insights.push(
      `พบการจ่ายย่อย < ฿120 สะสม ${microTxs.length} ครั้ง รวม ฿${Math.round(microTotal).toLocaleString()} (${Math.round(microRatio * 100)}% ของรายจ่ายทั้งหมด)`
    );
  } else {
    insights.push('ไม่พบรูรั่วจากการใช้จ่ายย่อยที่ไม่จำเป็น สัดส่วนการใช้เงินกระชับดีมาก');
  }

  // Insight 3: Dominant Category
  let topCatId = 'food';
  let topCatAmount = 0;
  for (const [cid, amt] of Object.entries(catTotals)) {
    if (amt > topCatAmount) {
      topCatAmount = amt;
      topCatId = cid;
    }
  }
  const topCat = getCategoryById([], topCatId);
  const topCatPct = totalSpent > 0 ? Math.round((topCatAmount / totalSpent) * 100) : 0;
  insights.push(
    `หมวด ${topCat.name} เป็นรายจ่ายหลัก ฿${Math.round(topCatAmount).toLocaleString()} (${topCatPct}%) แนะนำตั้งงบประมาณจำกัดไม่ให้เกินเกณฑ์`
  );

  return {
    score: finalScore,
    grade,
    title,
    color,
    bgGradient,
    insights,
    metrics: {
      burnRateScore: Math.round(burnRateScore),
      leakScore: Math.round(leakScore),
      diversityScore: Math.round(diversityScore),
      budgetScore: Math.round(budgetScore),
    }
  };
}

/**
 * Month-End Spending Velocity & Forecast
 */
export function calculateSpendingForecast(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalSpent = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const totalDays = new Date(curYear, curMonth, 0).getDate();
  const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : totalDays;
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  const dailyBurn = totalSpent / Math.max(1, daysPassed);
  const projectedTotal = dailyBurn * totalDays;

  // Previous month comparison
  const prevMonthDate = new Date(curYear, curMonth - 2, 1);
  const prevPrefix = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const prevTxs = transactions.filter(tx => tx.date && tx.date.startsWith(prevPrefix));
  const prevTotal = prevTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const diffFromPrev = prevTotal > 0 ? ((projectedTotal - prevTotal) / prevTotal) * 100 : 0;

  return {
    totalSpent,
    dailyBurn,
    projectedTotal,
    daysPassed,
    daysRemaining,
    totalDays,
    prevTotal,
    diffFromPrev: Math.round(diffFromPrev),
    isPacingFaster: diffFromPrev > 5,
  };
}

/**
 * Detect Money Leaks (< ฿120 transactions, repeated snacks, coffees)
 */
export function detectMoneyLeaks(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalSpent = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const leaks = monthTxs.filter(tx => {
    const amt = Number(tx.amount);
    return amt > 0 && amt <= 120;
  });

  const leakTotal = leaks.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const leakPct = totalSpent > 0 ? Math.round((leakTotal / totalSpent) * 100) : 0;

  // Count recurring leak venues
  const venueCounts = {};
  leaks.forEach(tx => {
    const v = tx.payee || 'ไม่ระบุ';
    venueCounts[v] = (venueCounts[v] || 0) + 1;
  });

  const topLeakVenues = Object.entries(venueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  return {
    count: leaks.length,
    totalAmount: leakTotal,
    percentage: leakPct,
    topLeakVenues,
    items: leaks.slice(0, 8)
  };
}

/**
 * Weekday vs Weekend spending breakdown
 */
export function getWeekdayVsWeekendBreakdown(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));

  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  monthTxs.forEach(tx => {
    if (!tx.date) return;
    const dayOfWeek = new Date(tx.date).getDay(); // 0 is Sunday, 6 is Saturday
    const amt = Number(tx.amount) || 0;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendTotal += amt;
      weekendCount++;
    } else {
      weekdayTotal += amt;
      weekdayCount++;
    }
  });

  const total = weekdayTotal + weekendTotal;
  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;

  return {
    weekday: {
      total: weekdayTotal,
      count: weekdayCount,
      avg: weekdayAvg,
      percentage: total > 0 ? Math.round((weekdayTotal / total) * 100) : 0
    },
    weekend: {
      total: weekendTotal,
      count: weekendCount,
      avg: weekendAvg,
      percentage: total > 0 ? Math.round((weekendTotal / total) * 100) : 0
    },
    prefersWeekend: weekendAvg > weekdayAvg * 1.3
  };
}

/**
 * Day of Week breakdown (จันทร์ - อาทิตย์)
 */
export function getDayOfWeekBreakdown(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));

  const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const fullDayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

  const stats = [0, 1, 2, 3, 4, 5, 6].map(idx => ({
    dayIdx: idx,
    shortName: dayNames[idx],
    fullName: fullDayNames[idx],
    amount: 0,
    count: 0
  }));

  monthTxs.forEach(tx => {
    if (!tx.date) return;
    const d = new Date(tx.date).getDay();
    if (stats[d]) {
      stats[d].amount += Number(tx.amount) || 0;
      stats[d].count += 1;
    }
  });

  const maxSpend = Math.max(1, ...stats.map(s => s.amount));
  const peakDay = [...stats].sort((a, b) => b.amount - a.amount)[0];

  return {
    days: stats.map(s => ({
      ...s,
      barPercent: Math.round((s.amount / maxSpend) * 100)
    })),
    peakDay
  };
}

/**
 * Time of Day spending analysis (เช้า / บ่าย / เย็น / ดึก)
 */
export function getTimeOfDayBreakdown(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));

  const slots = [
    { id: 'morning', label: 'ช่วงเช้า (06:00 - 11:59)', icon: '🌅', amount: 0, count: 0 },
    { id: 'afternoon', label: 'ช่วงบ่าย (12:00 - 17:59)', icon: '☀️', amount: 0, count: 0 },
    { id: 'evening', label: 'ช่วงค่ำ (18:00 - 23:59)', icon: '🌆', amount: 0, count: 0 },
    { id: 'night', label: 'ช่วงดึก (00:00 - 05:59)', icon: '🌙', amount: 0, count: 0 },
  ];

  monthTxs.forEach(tx => {
    const t = tx.time || '12:00';
    const hour = parseInt(t.split(':')[0], 10) || 12;
    const amt = Number(tx.amount) || 0;

    if (hour >= 6 && hour < 12) {
      slots[0].amount += amt;
      slots[0].count += 1;
    } else if (hour >= 12 && hour < 18) {
      slots[1].amount += amt;
      slots[1].count += 1;
    } else if (hour >= 18 && hour < 24) {
      slots[2].amount += amt;
      slots[2].count += 1;
    } else {
      slots[3].amount += amt;
      slots[3].count += 1;
    }
  });

  const total = slots.reduce((a, b) => a + b.amount, 0);
  const slotsWithPct = slots.map(s => ({
    ...s,
    percentage: total > 0 ? Math.round((s.amount / total) * 100) : 0
  }));

  const peakSlot = [...slotsWithPct].sort((a, b) => b.amount - a.amount)[0];

  return {
    slots: slotsWithPct,
    peakSlot
  };
}

/**
 * Bank Share breakdown (which bank drains the fastest)
 */
export function getBankShareBreakdown(transactions = [], currentDate = new Date()) {
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const total = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const bankMap = {};
  monthTxs.forEach(tx => {
    const bid = tx.bankId || 'KBANK';
    if (!bankMap[bid]) {
      bankMap[bid] = { amount: 0, count: 0 };
    }
    bankMap[bid].amount += Number(tx.amount) || 0;
    bankMap[bid].count += 1;
  });

  return Object.entries(bankMap)
    .map(([bid, stat]) => {
      const bank = getBankById(bid);
      return {
        bankId: bid,
        name: bank.name,
        color: bank.color,
        amount: stat.amount,
        count: stat.count,
        percentage: total > 0 ? Math.round((stat.amount / total) * 100) : 0
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
