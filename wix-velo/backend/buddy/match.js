import wixData from 'wix-data';

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tzOffsetHours(tz) {
  try {
    const now = new Date();
    const utc = now.toLocaleString("en-US", { timeZone: "UTC" });
    const local = now.toLocaleString("en-US", { timeZone: tz });
    return (new Date(local) - new Date(utc)) / 3600000;
  } catch {
    return 0;
  }
}

function sharedLanguages(a, b) {
  return a.filter(lang => b.includes(lang));
}

function passHardFilters(reqA, reqB, profA, profB) {
  if (reqA.ritualId !== reqB.ritualId) return false;
  if (reqA.cycleId !== reqB.cycleId) return false;
  if (reqA.ritualPath && reqB.ritualPath && reqA.ritualPath !== reqB.ritualPath) return false;

  const shared = sharedLanguages(profA.languages || [], profB.languages || []);
  if (shared.length === 0) return false;

  const bothNear = profA.reach === "near" && profB.reach === "near";
  if (bothNear) {
    const dist = haversineKm(profA.lat, profA.lng, profB.lat, profB.lng);
    const maxRadius = Math.min(profA.radiusKm || 50, profB.radiusKm || 50);
    if (dist > maxRadius) return false;
  } else {
    const gap = Math.abs(tzOffsetHours(profA.timezone) - tzOffsetHours(profB.timezone));
    if (gap > 6) return false;
  }

  return true;
}

function computeScore(profA, profB) {
  let score = 0;

  const sharedTags = (profA.interestTags || []).filter(t => (profB.interestTags || []).includes(t));
  score += Math.min(sharedTags.length, 5) * 7;

  if (profA.practiceTime === profB.practiceTime) {
    score += 20;
  } else if (profA.practiceTime === "flexible" || profB.practiceTime === "flexible") {
    score += 10;
  }

  if (profA.lifeStage === profB.lifeStage) score += 15;

  if (profA.scheduleType === profB.scheduleType) score += 10;

  const bothNear = profA.reach === "near" && profB.reach === "near";
  if (bothNear) {
    const dist = haversineKm(profA.lat, profA.lng, profB.lat, profB.lng);
    const maxRadius = Math.min(profA.radiusKm || 50, profB.radiusKm || 50);
    score += Math.max(0, Math.round(15 * (1 - dist / maxRadius)));
  } else {
    const gap = Math.abs(tzOffsetHours(profA.timezone) - tzOffsetHours(profB.timezone));
    score += Math.max(0, Math.round(15 * (1 - gap / 6)));
  }

  if (profA.callPref === profB.callPref) score += 5;

  return Math.min(score, 100);
}

export async function runDailyMatching() {
  const now = new Date();
  const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const waiting = await wixData.query("BuddyRequests")
    .eq("status", "waiting")
    .eq("cycleId", cycleId)
    .find({ suppressAuth: true });

  if (waiting.items.length < 2) {
    console.log(`Matching: only ${waiting.items.length} waiting requests for ${cycleId}, skipping.`);
    return { pairs: 0, trio: false };
  }

  const memberIds = [...new Set(waiting.items.map(r => r.memberId))];
  const profiles = {};
  for (const mid of memberIds) {
    const p = await wixData.query("BuddyProfiles")
      .eq("memberId", mid)
      .find({ suppressAuth: true });
    if (p.items.length > 0) profiles[mid] = p.items[0];
  }

  const requestsByRitual = {};
  for (const req of waiting.items) {
    const key = `${req.ritualId}|${req.ritualPath || ""}`;
    if (!requestsByRitual[key]) requestsByRitual[key] = [];
    if (profiles[req.memberId]) {
      requestsByRitual[key].push(req);
    }
  }

  let totalPairs = 0;
  let trioCreated = false;

  for (const [, requests] of Object.entries(requestsByRitual)) {
    const candidates = [];
    for (let i = 0; i < requests.length; i++) {
      for (let j = i + 1; j < requests.length; j++) {
        const rA = requests[i];
        const rB = requests[j];
        const pA = profiles[rA.memberId];
        const pB = profiles[rB.memberId];
        if (passHardFilters(rA, rB, pA, pB)) {
          candidates.push({
            reqA: rA,
            reqB: rB,
            score: computeScore(pA, pB)
          });
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const matched = new Set();
    for (const c of candidates) {
      if (matched.has(c.reqA.memberId) || matched.has(c.reqB.memberId)) continue;

      await wixData.insert("BuddyPairs", {
        memberA: c.reqA.memberId,
        memberB: c.reqB.memberId,
        ritualId: c.reqA.ritualId,
        cycleId,
        matchScore: c.score,
        status: "active",
        intention: "",
        keepVoteA: "",
        keepVoteB: "",
        createdAt: new Date()
      }, { suppressAuth: true });

      c.reqA.status = "matched";
      c.reqB.status = "matched";
      await wixData.update("BuddyRequests", c.reqA, { suppressAuth: true });
      await wixData.update("BuddyRequests", c.reqB, { suppressAuth: true });

      matched.add(c.reqA.memberId);
      matched.add(c.reqB.memberId);
      totalPairs++;
    }

    // Trio fallback after Day 3
    if (now.getDate() >= 3) {
      const unmatched = requests.filter(r => !matched.has(r.memberId) && r.status === "waiting");
      if (unmatched.length === 1 && totalPairs > 0) {
        const loner = unmatched[0];
        const pairs = await wixData.query("BuddyPairs")
          .eq("ritualId", loner.ritualId)
          .eq("cycleId", cycleId)
          .eq("status", "active")
          .isEmpty("memberC")
          .find({ suppressAuth: true });

        if (pairs.items.length > 0) {
          let bestPair = pairs.items[0];
          let bestScore = 0;
          for (const pair of pairs.items) {
            const pA = profiles[pair.memberA];
            const pLoner = profiles[loner.memberId];
            if (pA && pLoner) {
              const s = computeScore(pA, pLoner);
              if (s > bestScore) {
                bestScore = s;
                bestPair = pair;
              }
            }
          }

          bestPair.memberC = loner.memberId;
          await wixData.update("BuddyPairs", bestPair, { suppressAuth: true });

          loner.status = "matched";
          await wixData.update("BuddyRequests", loner, { suppressAuth: true });

          trioCreated = true;
        }
      }
    }
  }

  console.log(`Matching complete: ${totalPairs} pairs, trio: ${trioCreated}`);
  return { pairs: totalPairs, trio: trioCreated };
}
