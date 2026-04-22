"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prevDay = prevDay;
exports.calculateStreak = calculateStreak;
const prisma_1 = require("./prisma");
function prevDay(d) {
    const dt = new Date(`${d}T00:00:00.000Z`);
    dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
}
async function calculateStreak(userId) {
    const rows = await prisma_1.prisma.readingDay.findMany({
        where: { user_id: userId },
        select: { read_date: true },
        orderBy: { read_date: 'desc' },
    });
    const seen = new Set();
    const dates = [];
    for (const row of rows) {
        const d = row.read_date.toISOString().slice(0, 10);
        if (!seen.has(d)) {
            seen.add(d);
            dates.push(d);
        }
    }
    const totalDaysRead = dates.length;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = prevDay(today);
    let currentStreak = 0;
    if (dates.length > 0) {
        let cursor = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
        if (cursor) {
            currentStreak = 1;
            for (let i = 1; i < dates.length; i++) {
                if (dates[i] === prevDay(cursor)) {
                    currentStreak++;
                    cursor = dates[i];
                }
                else {
                    break;
                }
            }
        }
    }
    let maxStreak = dates.length > 0 ? 1 : 0;
    let run = dates.length > 0 ? 1 : 0;
    for (let i = 1; i < dates.length; i++) {
        if (dates[i] === prevDay(dates[i - 1])) {
            run++;
            if (run > maxStreak)
                maxStreak = run;
        }
        else {
            run = 1;
        }
    }
    return { current_streak: currentStreak, max_streak: maxStreak, total_days_read: totalDaysRead };
}
