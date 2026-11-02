import wixData from 'wix-data';

export async function awardCallBadge(memberId, ritualId, cycleId, callType, mode) {
  const defs = await wixData.query("BadgeDefinitions")
    .eq("category", "sisterhood")
    .find({ suppressAuth: true });

  for (const def of defs.items) {
    const rule = JSON.parse(def.rule);

    if (rule.type === "buddy_call" && rule.callType === callType) {
      if (rule.mode && rule.mode !== mode) continue;

      const existing = await wixData.query("MemberBadges")
        .eq("memberId", memberId)
        .eq("badgeId", def.badgeId)
        .eq("cycleId", cycleId)
        .find({ suppressAuth: true });

      if (existing.items.length === 0) {
        await wixData.insert("MemberBadges", {
          memberId,
          badgeId: def.badgeId,
          ritualId,
          cycleId,
          earnedAt: new Date(),
          seen: false
        }, { suppressAuth: true });
      }
    }
  }
}

export async function awardPairCompleteBadge(pair) {
  const { memberA, memberB, memberC, ritualId, cycleId } = pair;
  const members = [memberA, memberB];
  if (memberC) members.push(memberC);

  const allComplete = [];
  for (const mid of members) {
    const checkIns = await wixData.query("CheckIns")
      .eq("memberId", mid)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .find({ suppressAuth: true });
    allComplete.push(checkIns.items.length >= 24);
  }

  if (!allComplete.every(Boolean)) return;

  const def = (await wixData.query("BadgeDefinitions")
    .eq("badgeId", "side-by-side")
    .find({ suppressAuth: true })).items[0];

  if (!def) return;

  for (const mid of members) {
    const existing = await wixData.query("MemberBadges")
      .eq("memberId", mid)
      .eq("badgeId", "side-by-side")
      .eq("cycleId", cycleId)
      .find({ suppressAuth: true });

    if (existing.items.length === 0) {
      await wixData.insert("MemberBadges", {
        memberId: mid,
        badgeId: "side-by-side",
        ritualId,
        cycleId,
        earnedAt: new Date(),
        seen: false
      }, { suppressAuth: true });
    }
  }
}
