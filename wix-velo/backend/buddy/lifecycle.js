import wixData from 'wix-data';

export async function checkInactivity() {
  const now = new Date();
  const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activePairs = await wixData.query("BuddyPairs")
    .eq("cycleId", cycleId)
    .eq("status", "active")
    .find({ suppressAuth: true });

  let nudges = 0;
  let rematchOffers = 0;

  for (const pair of activePairs.items) {
    const members = [pair.memberA, pair.memberB];
    if (pair.memberC) members.push(pair.memberC);

    for (const memberId of members) {
      const checkIns = await wixData.query("CheckIns")
        .eq("memberId", memberId)
        .eq("ritualId", pair.ritualId)
        .eq("cycleId", cycleId)
        .descending("practicedAt")
        .limit(1)
        .find({ suppressAuth: true });

      if (checkIns.items.length === 0) continue;

      const lastCheckIn = new Date(checkIns.items[0].practicedAt);
      const daysSince = Math.floor((now - lastCheckIn) / 86400000);

      if (daysSince >= 7) {
        const buddyIds = members.filter(m => m !== memberId);
        for (const buddyId of buddyIds) {
          console.log(`REMATCH_OFFER: Member ${buddyId}'s buddy ${memberId} inactive for ${daysSince} days`);
        }
        rematchOffers++;
      } else if (daysSince >= 5) {
        console.log(`NUDGE: Member ${memberId} inactive for ${daysSince} days in pair ${pair._id}`);
        nudges++;
      }
    }
  }

  console.log(`Inactivity check: ${nudges} nudges, ${rematchOffers} rematch offers`);
  return { nudges, rematchOffers };
}

export async function resolveKeepSwap() {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevCycleId = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const pairs = await wixData.query("BuddyPairs")
    .eq("cycleId", prevCycleId)
    .eq("status", "active")
    .find({ suppressAuth: true });

  let kept = 0;
  let ended = 0;

  for (const pair of pairs.items) {
    const allKeep = pair.keepVoteA === "keep" && pair.keepVoteB === "keep"
      && (!pair.memberC || pair.keepVoteC === "keep");

    if (allKeep) {
      const newCycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await wixData.insert("BuddyPairs", {
        memberA: pair.memberA,
        memberB: pair.memberB,
        memberC: pair.memberC || "",
        ritualId: pair.ritualId,
        cycleId: newCycleId,
        matchScore: pair.matchScore,
        status: "active",
        intention: "",
        keepVoteA: "",
        keepVoteB: "",
        keepVoteC: "",
        createdAt: new Date()
      }, { suppressAuth: true });
      kept++;
    }

    pair.status = "ended";
    pair.endedAt = new Date();
    await wixData.update("BuddyPairs", pair, { suppressAuth: true });
    ended++;
  }

  console.log(`Keep/Swap resolution: ${kept} kept, ${ended - kept} ended`);
  return { kept, ended: ended - kept };
}

export async function proposeCallSlots() {
  const now = new Date();
  const day = now.getDate();
  const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let callType;
  if (day >= 3 && day <= 5) callType = "kickoff";
  else if (day >= 14 && day <= 16) callType = "mid";
  else if (day >= 28 && day <= 30) callType = "closing";
  else return { proposed: 0 };

  const pairs = await wixData.query("BuddyPairs")
    .eq("cycleId", cycleId)
    .eq("status", "active")
    .find({ suppressAuth: true });

  let proposed = 0;

  for (const pair of pairs.items) {
    const existingCall = await wixData.query("BuddyCalls")
      .eq("pairId", pair._id)
      .eq("type", callType)
      .find({ suppressAuth: true });

    if (existingCall.items.length > 0) continue;

    await wixData.insert("BuddyCalls", {
      pairId: pair._id,
      type: callType,
      scheduledAt: null,
      meetUrl: "",
      calendarEventId: "",
      mode: "video",
      venueEventId: "",
      completedA: false,
      completedB: false,
      completedC: false
    }, { suppressAuth: true });
    proposed++;
  }

  console.log(`Call proposals: ${proposed} ${callType} calls proposed`);
  return { proposed, callType };
}
