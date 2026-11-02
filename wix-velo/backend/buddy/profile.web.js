import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

export const getMyProfile = webMethod(
  Permissions.SiteMember,
  async () => {
    const member = await currentMember.getMember();
    const result = await wixData.query("BuddyProfiles")
      .eq("memberId", member._id)
      .find({ suppressAuth: true });
    return result.items.length > 0 ? result.items[0] : null;
  }
);

export const saveProfile = webMethod(
  Permissions.SiteMember,
  async (profileData) => {
    const member = await currentMember.getMember();
    const memberId = member._id;

    const existing = await wixData.query("BuddyProfiles")
      .eq("memberId", memberId)
      .find({ suppressAuth: true });

    const data = {
      memberId,
      displayName: profileData.displayName || member.profile?.nickname || "",
      photo: profileData.photo || "",
      city: profileData.city || "",
      country: profileData.country || "",
      lat: profileData.lat ? Math.round(profileData.lat * 100) / 100 : 0,
      lng: profileData.lng ? Math.round(profileData.lng * 100) / 100 : 0,
      timezone: profileData.timezone || "",
      languages: profileData.languages || [],
      interestTags: profileData.interestTags || [],
      lifeStage: profileData.lifeStage || "",
      practiceTime: profileData.practiceTime || "flexible",
      scheduleType: profileData.scheduleType || "fixed",
      callPref: profileData.callPref || "video",
      reach: profileData.reach || "worldwide",
      radiusKm: profileData.radiusKm || 50,
      idVerified: false,
      active: true,
      guidelinesAccepted: profileData.guidelinesAccepted || false
    };

    if (existing.items.length > 0) {
      data._id = existing.items[0]._id;
      return await wixData.update("BuddyProfiles", data, { suppressAuth: true });
    }
    return await wixData.insert("BuddyProfiles", data, { suppressAuth: true });
  }
);

export const requestBuddy = webMethod(
  Permissions.SiteMember,
  async (ritualId, ritualPath) => {
    const member = await currentMember.getMember();
    const memberId = member._id;
    const now = new Date();
    const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const profile = await wixData.query("BuddyProfiles")
      .eq("memberId", memberId)
      .find({ suppressAuth: true });

    if (profile.items.length === 0) {
      throw new Error("Complete your buddy profile first");
    }

    if (!profile.items[0].guidelinesAccepted) {
      throw new Error("Accept community guidelines first");
    }

    const existing = await wixData.query("BuddyRequests")
      .eq("memberId", memberId)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .ne("status", "cancelled")
      .find({ suppressAuth: true });

    if (existing.items.length > 0) {
      return { alreadyRequested: true, request: existing.items[0] };
    }

    const request = await wixData.insert("BuddyRequests", {
      memberId,
      ritualId,
      cycleId,
      ritualPath: ritualPath || "",
      status: "waiting",
      createdAt: now
    }, { suppressAuth: true });

    return { alreadyRequested: false, request };
  }
);

export const cancelBuddyRequest = webMethod(
  Permissions.SiteMember,
  async (ritualId) => {
    const member = await currentMember.getMember();
    const now = new Date();
    const cycleId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const existing = await wixData.query("BuddyRequests")
      .eq("memberId", member._id)
      .eq("ritualId", ritualId)
      .eq("cycleId", cycleId)
      .eq("status", "waiting")
      .find({ suppressAuth: true });

    for (const req of existing.items) {
      req.status = "cancelled";
      await wixData.update("BuddyRequests", req, { suppressAuth: true });
    }

    return { cancelled: existing.items.length };
  }
);
