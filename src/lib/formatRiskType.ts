/**
 * Converts raw database risk/alert type strings into human-readable labels.
 * e.g. "burst_activity" → "Burst Activity"
 */
export const formatRiskType = (raw: string): string => {
  if (!raw) return "Unknown";
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
