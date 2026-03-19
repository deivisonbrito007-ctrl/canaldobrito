export function formatCountdown(publishAt: string): string {
  const now = new Date();
  const target = new Date(publishAt);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Em breve";
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) {
    const diffMin = Math.floor(diffMs / (1000 * 60));
    return `Publica em ${diffMin}min`;
  }
  if (diffH < 24) return `Publica em ${diffH}h`;
  const diffDays = Math.floor(diffH / 24);
  return diffDays === 1 ? "Publica amanhã" : `Publica em ${diffDays}d`;
}

export function getScheduleDate(hoursOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hoursOffset, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
