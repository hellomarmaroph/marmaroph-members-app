import wixData from 'wix-data';

export async function evaluateBadges(memberId, ritualId, cycleId) {
  const allDefs = await wixData.query("BadgeDefinitions").limit(100).find({ suppressAuth: true });
  const earned = await wixData.query("MemberBadges")
    .eq("memberId", memberId)
    .find({ suppressAuth: true });
  const earnedIds = new Set(earned.items.map(b => `${b.badgeId}-${b.ritualId}-${b.cycleId}`));

  const checkIns = await wixData.query("CheckIns")
    .eq("memberId", memberId)
    .eq("ritualId", ritualId)
    .eq("cycleId", cycleId)
    .ascending("day")
    .find({ suppressAuth: true });

  const allCheckIns = await wixData.query("CheckIns")
    .eq("memberId", memberId)
    .ascending("practicedAt")
    .limit(200)
    .find({ suppressAuth: true });

  const newBadges = [];

  for (const def of allDefs.items) {
    if (def.ritualId !== "all" && def.ritualId !== ritualId) continue;

    const key = `${def.badgeId}-${ritualId}-${cycleId}`;
    if (earnedIds.has(key)) continue;

    const rule = JSON.parse(def.rule);
    const qualified = evaluateRule(rule, {
      memberId,
      ritualId,
      cycleId,
      cycleCheckIns: checkIns.items,
      allCheckIns: allCheckIns.items
    });

    if (qualified) {
      const badge = await wixData.insert("MemberBadges", {
        memberId,
        badgeId: def.badgeId,
        ritualId,
        cycleId,
        earnedAt: new Date(),
        seen: false
      }, { suppressAuth: true });
      earnedIds.add(key);
      newBadges.push({ ...badge, name: def.name, description: def.description, tier: def.tier });
    }
  }

  return newBadges;
}

function evaluateRule(rule, ctx) {
  switch (rule.type) {
    case "total_checkins":
      return evaluateTotalCheckIns(rule, ctx);
    case "streak":
      return evaluateStreak(rule, ctx);
    case "cycle_complete":
      return evaluateCycleComplete(rule, ctx);
    case "milestone":
      return false; // milestones are awarded via a separate trigger
    case "buddy_call":
      return false; // evaluated when a call is marked complete
    case "pair_complete":
      return false; // evaluated at cycle end
    case "limited":
      return evaluateLimited(rule, ctx);
    default:
      return false;
  }
}

function evaluateTotalCheckIns(rule, ctx) {
  if (rule.scope === "cycle") {
    return ctx.cycleCheckIns.length >= rule.count;
  }
  return ctx.allCheckIns.filter(ci => ci.ritualId === ctx.ritualId).length >= rule.count;
}

function evaluateStreak(rule, ctx) {
  const items = rule.beforeHour
    ? ctx.allCheckIns.filter(ci => {
        const hour = new Date(ci.practicedAt).getHours();
        return hour < rule.beforeHour && ci.ritualId === ctx.ritualId;
      })
    : ctx.allCheckIns.filter(ci => ci.ritualId === ctx.ritualId);

  if (items.length < rule.days) return false;

  const dates = items.map(ci => {
    const d = new Date(ci.practicedAt);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  });
  const unique = [...new Set(dates)].sort((a, b) => a - b);

  let maxStreak = 1;
  let current = 1;
  const oneDay = 86400000;

  for (let i = 1; i < unique.length; i++) {
    if (unique[i] - unique[i - 1] === oneDay) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }

  return maxStreak >= rule.days;
}

function evaluateCycleComplete(rule, ctx) {
  return ctx.cycleCheckIns.length >= rule.minDays;
}

function evaluateLimited(rule, ctx) {
  if (ctx.cycleId !== rule.month) return false;
  return evaluateRule(rule.inner, ctx);
}

export async function nightlyBadgeSweep() {
  const now = new Date();
  const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const recentCheckIns = await wixData.query("CheckIns")
    .eq("cycleId", cycleId)
    .limit(1000)
    .find({ suppressAuth: true });

  const memberRituals = new Map();
  for (const ci of recentCheckIns.items) {
    const key = `${ci.memberId}|${ci.ritualId}`;
    if (!memberRituals.has(key)) {
      memberRituals.set(key, { memberId: ci.memberId, ritualId: ci.ritualId });
    }
  }

  let totalNew = 0;
  for (const { memberId, ritualId } of memberRituals.values()) {
    const newBadges = await evaluateBadges(memberId, ritualId, cycleId);
    totalNew += newBadges.length;
  }

  console.log(`Nightly badge sweep: evaluated ${memberRituals.size} member-rituals, awarded ${totalNew} new badges.`);
  return { evaluated: memberRituals.size, awarded: totalNew };
}
