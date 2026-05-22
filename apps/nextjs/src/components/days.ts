export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
export const dayFromDate = (): Day => {
  const d = new Date();
  return DAYS[(d.getDay() + 6) % 7] ?? "mon";
};
