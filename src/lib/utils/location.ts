// Location utility functions (non-server-action helpers)

/**
 * Get location display string for a branch
 * @param branch - Branch with cities and barangays data
 * @returns Formatted location string
 */
export function getLocationDisplayString(
  branch: { cities?: { name: string } | null; barangays?: { name: string } | null }
): string {
  const parts: string[] = [];

  if (branch.barangays?.name) {
    parts.push(branch.barangays.name);
  }

  if (branch.cities?.name) {
    parts.push(branch.cities.name);
  }

  return parts.join(", ") || "Location not specified";
}
