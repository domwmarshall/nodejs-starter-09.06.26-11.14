import { starterClinicalPathways } from "../data/starterClinicalPathways";

export function getStarterClinicalPathways() {
  return starterClinicalPathways;
}

export function createPathwayVersionRecord(pathway, changes = {}, actor = {}) {
  return {
    id: `pathway-version-${Date.now()}`,
    pathwayId: pathway.id,
    version: changes.version || pathway.version,
    approvalStatus: changes.approvalStatus || pathway.approvalStatus || "Requires clinical review",
    clinicalOwner: changes.owner || pathway.owner || "Clinical owner required",
    sourceUrl: changes.sourceUrl || pathway.sourceUrl || "",
    reviewDate: changes.nextReview || pathway.nextReview || "Not set",
    changeReason: changes.changeReason || "Prototype version record created",
    createdBy: actor.name || "Prototype user",
    createdAt: new Date().toISOString(),
    liveUseAllowed: false,
  };
}

export function canUsePathwayLive(pathway) {
  return Boolean(
    pathway?.status === "Approved" &&
    pathway?.approvalStatus === "Approved" &&
    pathway?.owner &&
    pathway?.nextReview &&
    pathway?.sourceUrl
  );
}
