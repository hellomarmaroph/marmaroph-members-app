import { ok, forbidden, notFound, serverError } from 'wix-http-functions';
import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';

export async function get_memberBadges(request) {
  try {
    const secret = await getSecret("APP_BADGES_SECRET");
    const authHeader = request.headers["authorization"];
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return forbidden({ body: { error: "Unauthorized" } });
    }

    const memberId = request.query["memberId"];
    if (!memberId) {
      return notFound({ body: { error: "memberId required" } });
    }

    const badges = await wixData.query("MemberBadges")
      .eq("memberId", memberId)
      .ascending("earnedAt")
      .find({ suppressAuth: true });

    const badgeDefs = await wixData.query("BadgeDefinitions")
      .limit(100)
      .find({ suppressAuth: true });

    const defMap = {};
    for (const def of badgeDefs.items) {
      defMap[def.badgeId] = def;
    }

    const enriched = badges.items.map(b => ({
      badgeId: b.badgeId,
      name: defMap[b.badgeId]?.name || b.badgeId,
      description: defMap[b.badgeId]?.description || "",
      category: defMap[b.badgeId]?.category || "",
      tier: defMap[b.badgeId]?.tier || 0,
      ritualId: b.ritualId,
      cycleId: b.cycleId,
      earnedAt: b.earnedAt,
      seen: b.seen
    }));

    return ok({ body: { memberId, badges: enriched } });
  } catch (err) {
    return serverError({ body: { error: err.message } });
  }
}
