import wixData from 'wix-data';

const STARTER_BADGES = [
  {
    badgeId: "first-step",
    name: "First Step",
    ritualId: "all",
    category: "core",
    rule: JSON.stringify({ type: "total_checkins", count: 1, scope: "cycle" }),
    tier: 1,
    description: "Complete your first check-in of any ritual"
  },
  {
    badgeId: "7-day-flow",
    name: "7-Day Flow",
    ritualId: "all",
    category: "core",
    rule: JSON.stringify({ type: "streak", days: 7 }),
    tier: 2,
    description: "Achieve a 7-day practice streak"
  },
  {
    badgeId: "21-days-rooted",
    name: "21 Days Rooted",
    ritualId: "all",
    category: "core",
    rule: JSON.stringify({ type: "total_checkins", count: 21, scope: "cycle" }),
    tier: 3,
    description: "Complete 21 check-ins in one cycle"
  },
  {
    badgeId: "ritual-complete",
    name: "Ritual Complete",
    ritualId: "all",
    category: "core",
    rule: JSON.stringify({ type: "cycle_complete", minDays: 24 }),
    tier: 4,
    description: "Complete 24 or more days in a 30-day cycle"
  },
  {
    badgeId: "sunrise-week",
    name: "Sunrise Week",
    ritualId: "energized-mornings",
    category: "ritual",
    rule: JSON.stringify({ type: "streak", days: 7, beforeHour: 9 }),
    tier: 2,
    description: "7 morning check-ins before 9:00 AM"
  },
  {
    badgeId: "present-plate",
    name: "Present Plate",
    ritualId: "mindful-eating",
    category: "ritual",
    rule: JSON.stringify({ type: "total_checkins", count: 14, scope: "cycle" }),
    tier: 3,
    description: "14 mindful-meal check-ins in one cycle"
  },
  {
    badgeId: "first-debt-cleared",
    name: "First Debt Cleared",
    ritualId: "quiet-abundance",
    category: "ritual",
    rule: JSON.stringify({ type: "milestone", key: "first_debt_cleared" }),
    tier: 3,
    description: "Mark your first debt as cleared"
  },
  {
    badgeId: "seed-fund",
    name: "Seed Fund",
    ritualId: "quiet-abundance",
    category: "ritual",
    rule: JSON.stringify({ type: "milestone", key: "first_savings" }),
    tier: 3,
    description: "Start your first savings or investment"
  },
  {
    badgeId: "december-glow",
    name: "December Glow",
    ritualId: "all",
    category: "limited",
    rule: JSON.stringify({ type: "limited", month: "2026-12", inner: { type: "streak", days: 10 } }),
    tier: 4,
    limitedMonth: "2026-12",
    description: "Achieve a 10-day streak in December"
  },
  {
    badgeId: "sister-found",
    name: "Sister Found",
    ritualId: "all",
    category: "sisterhood",
    rule: JSON.stringify({ type: "buddy_call", callType: "kickoff" }),
    tier: 2,
    description: "Complete your first kickoff call with your buddy"
  },
  {
    badgeId: "side-by-side",
    name: "Side by Side",
    ritualId: "all",
    category: "sisterhood",
    rule: JSON.stringify({ type: "pair_complete" }),
    tier: 4,
    description: "Both you and your buddy complete the cycle"
  },
  {
    badgeId: "met-in-person",
    name: "Met in Person",
    ritualId: "all",
    category: "sisterhood",
    rule: JSON.stringify({ type: "buddy_call", callType: "closing", mode: "in-person" }),
    tier: 5,
    description: "Attend the Day 30 closing in person"
  }
];

export async function seedBadgeDefinitions() {
  const existing = await wixData.query("BadgeDefinitions").limit(1).find();
  if (existing.totalCount > 0) {
    console.log("BadgeDefinitions already seeded, skipping.");
    return { skipped: true, count: existing.totalCount };
  }

  let inserted = 0;
  for (const badge of STARTER_BADGES) {
    await wixData.insert("BadgeDefinitions", {
      ...badge,
      limitedMonth: badge.limitedMonth || ""
    }, { suppressAuth: true });
    inserted++;
  }

  console.log(`Seeded ${inserted} badge definitions.`);
  return { inserted };
}
