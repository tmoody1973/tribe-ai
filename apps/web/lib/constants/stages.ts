export const migrationStages = [
  {
    id: "dreaming",
    labelKey: "onboarding.stages.dreaming.title",
    descriptionKey: "onboarding.stages.dreaming.description",
  },
  {
    id: "planning",
    labelKey: "onboarding.stages.planning.title",
    descriptionKey: "onboarding.stages.planning.description",
  },
  {
    id: "preparing",
    labelKey: "onboarding.stages.preparing.title",
    descriptionKey: "onboarding.stages.preparing.description",
  },
  {
    id: "relocating",
    labelKey: "onboarding.stages.relocating.title",
    descriptionKey: "onboarding.stages.relocating.description",
  },
  {
    id: "settling",
    labelKey: "onboarding.stages.settling.title",
    descriptionKey: "onboarding.stages.settling.description",
  },
] as const;

export type MigrationStage = (typeof migrationStages)[number]["id"];
