export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
export const dayFromDate = (): Day => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/New_York",
  }).format(new Date());
  const map: Record<string, Day> = {
    Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu",
    Fri: "fri", Sat: "sat", Sun: "sun",
  };
  return map[weekday] ?? "mon";
};
