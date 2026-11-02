import wixData from 'wix-data';

export async function awardMilestone(memberId, ritualId, cycleId, milestoneKey) {
  const defs = await wixData.query("BadgeDefinitions")
    .find({ suppressAuth: true });

  for (const def of defs.items) {
    const rule = JSON.parse(def.rule);
    if (rule.type !== "milestone" || rule.key !== milestoneKey) continue;
    if (def.ritualId !== "all" && def.ritualId !== ritualId) continue;

    const existing = await wixData.query("MemberBadges")
      .eq("memberId", memberId)
      .eq("badgeId", def.badgeId)
      .find({ suppressAuth: true });

    if (existing.items.length === 0) {
      return await wixData.insert("MemberBadges", {
        memberId,
        badgeId: def.badgeId,
        ritualId,
        cycleId,
        earnedAt: new Date(),
        seen: false
      }, { suppressAuth: true });
    }
  }

  return null;
}
