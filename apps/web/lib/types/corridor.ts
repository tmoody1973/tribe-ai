import type { Doc, Id } from "@/convex/_generated/dataModel";

export type Corridor = Doc<"corridors">;
export type CorridorId = Id<"corridors">;

export type MigrationStage =
  | "dreaming"
  | "planning"
  | "preparing"
  | "relocating"
  | "settling";

export const migrationStageLabels: Record<MigrationStage, string> = {
  dreaming: "Dreaming",
  planning: "Planning",
  preparing: "Preparing",
  relocating: "Relocating",
  settling: "Settling",
};
