import type { BuildEditorSnapshot, SavedBuild } from "../types/savedBuildTypes";

const SAVED_BUILDS_STORAGE_KEY = "bg3-vis.saved-builds.v1";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `saved-build-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDefaultSavedBuildLabel(snapshot: BuildEditorSnapshot) {
  return (
    snapshot.buildName.trim() ||
    snapshot.characterName.trim() ||
    snapshot.selectedSubclass ||
    snapshot.selectedClass ||
    "Untitled Build"
  );
}

export function createSavedBuild(
  snapshot: BuildEditorSnapshot,
  label = getDefaultSavedBuildLabel(snapshot)
): SavedBuild {
  const now = new Date().toISOString();

  return {
    id: createId(),
    label: label.trim() || "Untitled Build",
    createdAt: now,
    updatedAt: now,
    snapshot,
  };
}

export function loadSavedBuildsFromStorage(): SavedBuild[] {
  try {
    const rawValue = localStorage.getItem(SAVED_BUILDS_STORAGE_KEY);

    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (item): item is SavedBuild =>
        typeof item?.id === "string" &&
        typeof item?.label === "string" &&
        typeof item?.createdAt === "string" &&
        typeof item?.updatedAt === "string" &&
        typeof item?.snapshot === "object" &&
        item.snapshot !== null
    );
  } catch {
    return [];
  }
}

export function saveSavedBuildsToStorage(savedBuilds: SavedBuild[]) {
  localStorage.setItem(SAVED_BUILDS_STORAGE_KEY, JSON.stringify(savedBuilds));
}

export function formatSavedBuildDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}