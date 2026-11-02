import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

async function verifyPairMember(pairId, memberId) {
  const pair = await wixData.get("BuddyPairs", pairId, { suppressAuth: true });
  if (!pair) throw new Error("Pair not found");
  if (pair.memberA !== memberId && pair.memberB !== memberId && pair.memberC !== memberId) {
    throw new Error("Not a member of this pair");
  }
  return pair;
}

export const sendMessage = webMethod(
  Permissions.SiteMember,
  async (pairId, type, text) => {
    const member = await currentMember.getMember();
    await verifyPairMember(pairId, member._id);

    if (text && text.length > 280) {
      throw new Error("Message too long (max 280 characters)");
    }

    return await wixData.insert("BuddyMessages", {
      pairId,
      fromMember: member._id,
      type: type || "note",
      text: text || "",
      createdAt: new Date()
    }, { suppressAuth: true });
  }
);

export const getMessages = webMethod(
  Permissions.SiteMember,
  async (pairId, limit) => {
    const member = await currentMember.getMember();
    await verifyPairMember(pairId, member._id);

    const results = await wixData.query("BuddyMessages")
      .eq("pairId", pairId)
      .descending("createdAt")
      .limit(limit || 10)
      .find({ suppressAuth: true });

    return results.items;
  }
);

export const getMyPair = webMethod(
  Permissions.SiteMember,
  async (ritualId) => {
    const member = await currentMember.getMember();
    const now = new Date();
    const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const asA = await wixData.query("BuddyPairs")
      .eq("memberA", member._id)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .eq("status", "active")
      .find({ suppressAuth: true });

    if (asA.items.length > 0) return asA.items[0];

    const asB = await wixData.query("BuddyPairs")
      .eq("memberB", member._id)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .eq("status", "active")
      .find({ suppressAuth: true });

    if (asB.items.length > 0) return asB.items[0];

    const asC = await wixData.query("BuddyPairs")
      .eq("memberC", member._id)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .eq("status", "active")
      .find({ suppressAuth: true });

    return asC.items.length > 0 ? asC.items[0] : null;
  }
);

export const markCallComplete = webMethod(
  Permissions.SiteMember,
  async (callId) => {
    const member = await currentMember.getMember();
    const call = await wixData.get("BuddyCalls", callId, { suppressAuth: true });
    if (!call) throw new Error("Call not found");

    const pair = await verifyPairMember(call.pairId, member._id);

    if (pair.memberA === member._id) call.completedA = true;
    else if (pair.memberB === member._id) call.completedB = true;
    else if (pair.memberC === member._id) call.completedC = true;

    await wixData.update("BuddyCalls", call, { suppressAuth: true });

    const { awardCallBadge } = await import('backend/badges/award-sisterhood');
    await awardCallBadge(member._id, pair.ritualId, pair.cycleId, call.type, call.mode);

    return call;
  }
);

export const updateIntention = webMethod(
  Permissions.SiteMember,
  async (pairId, intention) => {
    const member = await currentMember.getMember();
    const pair = await verifyPairMember(pairId, member._id);
    pair.intention = intention;
    return await wixData.update("BuddyPairs", pair, { suppressAuth: true });
  }
);

export const voteKeepOrSwap = webMethod(
  Permissions.SiteMember,
  async (pairId, vote) => {
    const member = await currentMember.getMember();
    const pair = await verifyPairMember(pairId, member._id);

    if (vote !== "keep" && vote !== "swap") throw new Error("Vote must be 'keep' or 'swap'");

    if (pair.memberA === member._id) pair.keepVoteA = vote;
    else if (pair.memberB === member._id) pair.keepVoteB = vote;
    else if (pair.memberC === member._id) pair.keepVoteC = vote;

    await wixData.update("BuddyPairs", pair, { suppressAuth: true });
    return pair;
  }
);

export const swapBuddy = webMethod(
  Permissions.SiteMember,
  async (pairId) => {
    const member = await currentMember.getMember();
    const pair = await verifyPairMember(pairId, member._id);

    pair.status = "rematched";
    pair.endedAt = new Date();
    await wixData.update("BuddyPairs", pair, { suppressAuth: true });

    await wixData.insert("BuddyRequests", {
      memberId: member._id,
      ritualId: pair.ritualId,
      cycleId: pair.cycleId,
      ritualPath: "",
      status: "waiting",
      createdAt: new Date()
    }, { suppressAuth: true });

    return { swapped: true };
  }
);

export const reportBuddy = webMethod(
  Permissions.SiteMember,
  async (pairId, reason) => {
    const member = await currentMember.getMember();
    await verifyPairMember(pairId, member._id);

    console.log(`REPORT: Member ${member._id} reported pair ${pairId}. Reason: ${reason}`);

    return { reported: true };
  }
);
