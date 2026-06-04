export function nowISO(): string {
  return new Date().toISOString();
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
