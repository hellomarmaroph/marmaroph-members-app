# Wix CMS Collections — Ritual Buddy & Badges

Create these 8 collections on the DEV site only.
Go to: Wix Editor → CMS → Add Collection for each.

---

## 1. BuddyProfiles

**Permissions:** Member-authored (owner read/write, others no access)

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Member ID | memberId | Text | Reference to Members `_id`, unique |
| Display Name | displayName | Text | |
| Photo | photo | Image | |
| City | city | Text | |
| Country | country | Text | |
| Latitude | lat | Number | Rounded to ~1 km |
| Longitude | lng | Number | Rounded to ~1 km |
| Timezone | timezone | Text | e.g. "America/Mexico_City" |
| Languages | languages | Tags | Multi-value |
| Interest Tags | interestTags | Tags | Multi-value |
| Life Stage | lifeStage | Text | |
| Practice Time | practiceTime | Text | "morning" / "evening" / "flexible" |
| Schedule Type | scheduleType | Text | "fixed" / "shift" |
| Call Preference | callPref | Text | "video" / "voice" / "in-person" |
| Reach | reach | Text | "near" / "worldwide" |
| Radius (km) | radiusKm | Number | Only if reach = "near" |
| ID Verified | idVerified | Boolean | Default false |
| ID Verified At | idVerifiedAt | Date | |
| Active | active | Boolean | Default true |
| Guidelines Accepted | guidelinesAccepted | Boolean | |

---

## 2. BuddyRequests

**Permissions:** Member-authored (owner read/write, others no access)

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Member ID | memberId | Text | |
| Ritual ID | ritualId | Text | Reference to Rituals |
| Cycle ID | cycleId | Text | "YYYY-MM" format |
| Ritual Path | ritualPath | Text | For rituals with paths (e.g. QA) |
| Status | status | Text | "waiting" / "matched" / "cancelled" |
| Created At | createdAt | Date | |

---

## 3. BuddyPairs

**Permissions:** Admin-write, read via backend code only

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Member A | memberA | Text | |
| Member B | memberB | Text | |
| Member C | memberC | Text | Optional trio member |
| Ritual ID | ritualId | Text | |
| Cycle ID | cycleId | Text | |
| Match Score | matchScore | Number | 0–100 |
| Status | status | Text | "active" / "ended" / "rematched" |
| Intention | intention | Text | Shared intention, editable |
| Keep Vote A | keepVoteA | Text | "keep" / "swap" / null |
| Keep Vote B | keepVoteB | Text | "keep" / "swap" / null |
| Keep Vote C | keepVoteC | Text | For trios |
| Created At | createdAt | Date | |
| Ended At | endedAt | Date | |

---

## 4. CheckIns

**Permissions:** Member-authored (owner write, pair members read via backend)

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Member ID | memberId | Text | |
| Ritual ID | ritualId | Text | |
| Cycle ID | cycleId | Text | |
| Day | day | Number | 1–30 |
| Practiced At | practicedAt | Date | |
| Mood | mood | Text | Optional emoji |

---

## 5. BuddyMessages

**Permissions:** Admin-write, pair members read via backend

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Pair ID | pairId | Text | Reference to BuddyPairs `_id` |
| From Member | fromMember | Text | |
| Type | type | Text | "love" / "note" / "nudge" |
| Text | text | Text | Max 280 chars |
| Created At | createdAt | Date | |

---

## 6. BuddyCalls

**Permissions:** Admin-write, pair members read via backend

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Pair ID | pairId | Text | Reference to BuddyPairs `_id` |
| Type | type | Text | "kickoff" / "mid" / "closing" |
| Scheduled At | scheduledAt | Date | |
| Meet URL | meetUrl | URL | Google Meet link |
| Calendar Event ID | calendarEventId | Text | |
| Mode | mode | Text | "video" / "in-person" |
| Venue Event ID | venueEventId | Text | Reference to Events |
| Completed A | completedA | Boolean | |
| Completed B | completedB | Boolean | |
| Completed C | completedC | Boolean | For trios |

---

## 7. BadgeDefinitions

**Permissions:** Admin read/write, Member read-only

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Badge ID | badgeId | Text | Unique slug |
| Name | name | Text | Display name |
| Ritual ID | ritualId | Text | "all" or specific ritual |
| Category | category | Text | "core" / "sisterhood" / "ritual" / "limited" |
| Rule | rule | Text | JSON string (see rule shapes) |
| Icon | icon | Image | Earned state |
| Icon Locked | iconLocked | Image | Greyscale state |
| Tier | tier | Number | For display order |
| Limited Month | limitedMonth | Text | "YYYY-MM" or empty |
| Description | description | Text | What member sees |

---

## 8. MemberBadges

**Permissions:** Member-authored (owner read, admin write)

| Field | Key | Type | Notes |
|-------|-----|------|-------|
| Member ID | memberId | Text | |
| Badge ID | badgeId | Text | Reference to BadgeDefinitions |
| Ritual ID | ritualId | Text | |
| Cycle ID | cycleId | Text | |
| Earned At | earnedAt | Date | |
| Seen | seen | Boolean | Default false |
