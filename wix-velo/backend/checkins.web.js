import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';
import { evaluateBadges } from 'backend/badges/evaluate';

export const recordCheckIn = webMethod(
  Permissions.SiteMember,
  async (ritualId, mood) => {
    const member = await currentMember.getMember();
    const memberId = member._id;
    const now = new Date();
    const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const day = now.getDate();

    const existing = await wixData.query("CheckIns")
      .eq("memberId", memberId)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .eq("day", day)
      .find({ suppressAuth: true });

    if (existing.items.length > 0) {
      return { alreadyCheckedIn: true, checkIn: existing.items[0] };
    }

    const checkIn = await wixData.insert("CheckIns", {
      memberId,
      ritualId,
      cycleId,
      day,
      practicedAt: now,
      mood: mood || ""
    }, { suppressAuth: true });

    const newBadges = await evaluateBadges(memberId, ritualId, cycleId);

    return { alreadyCheckedIn: false, checkIn, newBadges };
  }
);

export const getStreak = webMethod(
  Permissions.SiteMember,
  async (memberId, ritualId) => {
    const now = new Date();
    const allCheckIns = [];

    for (let offset = 0; offset <= 1; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const cId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const results = await wixData.query("CheckIns")
        .eq("memberId", memberId)
        .eq("ritualId", ritualId)
        .eq("cycleId", cId)
        .ascending("day")
        .find({ suppressAuth: true });
      allCheckIns.push(...results.items.map(ci => {
        const [y, m] = ci.cycleId.split("-").map(Number);
        return new Date(y, m - 1, ci.day);
      }));
    }

    allCheckIns.sort((a, b) => b - a);

    let streak = 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 0; i < allCheckIns.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const ciDate = new Date(
        allCheckIns[i].getFullYear(),
        allCheckIns[i].getMonth(),
        allCheckIns[i].getDate()
      );
      if (ciDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, totalCheckIns: allCheckIns.length };
  }
);

export const getCycleProgress = webMethod(
  Permissions.SiteMember,
  async (memberId, ritualId, cycleId) => {
    const results = await wixData.query("CheckIns")
      .eq("memberId", memberId)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .find({ suppressAuth: true });

    const days = results.items.map(ci => ci.day).sort((a, b) => a - b);
    const totalDays = results.items.length;
    const completionPct = Math.round((totalDays / 30) * 100);

    let currentStreak = 0;
    const now = new Date();
    const today = now.getDate();
    for (let d = today; d >= 1; d--) {
      if (days.includes(d)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalDays,
      completionPct,
      currentStreak,
      days,
      moods: results.items.reduce((acc, ci) => {
        if (ci.mood) acc[ci.day] = ci.mood;
        return acc;
      }, {})
    };
  }
);
